import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Brain,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processAssessmentWithAI, createAssessmentAttempt, submitAssessmentResponses } from "@/lib/ai-assessment-utils";
import { trackAssessmentCompletion } from "@/lib/gamification-events";
import type { Tables } from "@/integrations/supabase/types";

interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'text' | 'rating' | 'boolean';
  question: string;
  options?: string[];
  required: boolean;
  weight?: number;
}

// Extend Tables<'assessments_enhanced'> to include the 'questions' and 'scoring_rubric' JSON types
interface Assessment extends Omit<Tables<'assessments_enhanced'>, 'questions' | 'scoring_rubric'> {
  questions: AssessmentQuestion[];
  scoring_rubric: Record<string, unknown>;
}

// Extend Tables<'assessment_attempts'> to include 'raw_responses' JSON type
interface AssessmentAttempt extends Omit<Tables<'assessment_attempts'>, 'raw_responses'> {
  raw_responses: Record<string, unknown>;
}

interface AIAnalysisResult {
  score: number;
  feedback: string;
  explanation: string;
  strengths: string[];
  areas_for_improvement: string[];
  recommendations: string[];
}

export default function Assessment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResults, setAiResults] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAssessment = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("assessments_enhanced")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error) throw error;

      // Cast with proper type handling
      const assessmentData = data as unknown as Assessment;
      setAssessment(assessmentData);
    } catch (error: unknown) {
      console.error("Error loading assessment:", error);
      setError("Assessment not found or no longer available");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const startAttempt = useCallback(async () => {
    if (!assessment || !id) return;

    setLoading(true);
    try {
      const attemptId = await createAssessmentAttempt(id, (await supabase.auth.getUser()).data.user?.id || '');
      if (!attemptId) {
        throw new Error("Failed to create assessment attempt");
      }

      const { data, error } = await supabase
        .from("assessment_attempts")
        .select("*")
        .eq("id", attemptId)
        .single();

      if (error) throw error;
      setAttempt(data as AssessmentAttempt); // Cast to AssessmentAttempt
      setTimeRemaining((assessment.time_limit_minutes || 30) * 60);
    } catch (error: unknown) {
      console.error("Error starting attempt:", error);
      setError("Failed to start assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [assessment, id]);

  const submitAssessment = useCallback(async () => {
    if (!attempt || !assessment) return;

    setSubmitting(true);
    try {
      // Submit responses
      const timeSpent = Math.max(0, assessment.time_limit_minutes * 60 - timeRemaining);
      const success = await submitAssessmentResponses(attempt.id, responses, Math.floor(timeSpent / 60));

      if (!success) {
        throw new Error("Failed to submit assessment");
      }

      let completedScore = 0;

      // Process with AI if configured
      if (assessment.ai_config_id) {
        setAiProcessing(true);
        const aiResult = await processAssessmentWithAI(assessment.id, {
          assessment_id: assessment.id,
          user_id: attempt.user_id,
          responses,
          time_spent_minutes: Math.floor(timeSpent / 60),
          attempt_id: attempt.id,
          attempt_number: attempt.attempt_number,
        });

        if (aiResult) {
          completedScore = aiResult.score ?? 0;
          setAiResults(aiResult as AIAnalysisResult);
          toast({
            title: "Assessment completed!",
            description: "AI analysis has been generated for your responses.",
          });
        } else {
          toast({
            title: "Assessment completed",
            description: "Your responses have been saved. AI analysis is being processed.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Assessment completed!",
          description: "Your responses have been saved.",
        });
      }

      // Track assessment completion for gamification
      if (attempt && assessment) {
        void trackAssessmentCompletion(attempt.user_id, assessment.id, completedScore);
      }

    } catch (error: unknown) {
      console.error("Error submitting assessment:", error);
      setError("Failed to submit assessment. Please try again.");
    } finally {
      setSubmitting(false);
      setAiProcessing(false);
    }
  }, [attempt, assessment, responses, timeRemaining, toast]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0 || !attempt) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          void submitAssessment(); // Use void to explicitly ignore Promise
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, attempt, submitAssessment]);

  useEffect(() => {
    void loadAssessment(); // Use void to explicitly ignore Promise
  }, [loadAssessment]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResponseChange = (questionId: string, value: unknown) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const nextQuestion = () => {
    if (assessment && currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const isLastQuestion = assessment ? currentQuestionIndex === assessment.questions.length - 1 : false;
  const isFirstQuestion = currentQuestionIndex === 0;
  const currentQuestion = assessment?.questions[currentQuestionIndex];
  const progress = assessment ? ((currentQuestionIndex + 1) / assessment.questions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Assessment Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error || "This assessment is not available or has been removed."}
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{assessment.title}</CardTitle>
              <CardDescription className="text-lg">{assessment.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{assessment.questions.length}</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{assessment.time_limit_minutes}</div>
                  <div className="text-sm text-muted-foreground">Minutes</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{assessment.difficulty_level}</div>
                  <div className="text-sm text-muted-foreground">Difficulty</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{assessment.max_attempts}</div>
                  <div className="text-sm text-muted-foreground">Max Attempts</div>
                </div>
              </div>

              {assessment.ai_config_id && (
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    This assessment uses AI-powered analysis to provide personalized feedback and insights.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center">
                <Button onClick={startAttempt} size="lg" className="px-8">
                  Start Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (aiResults) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
                Assessment Complete!
              </CardTitle>
              <CardDescription>
                Your AI-powered analysis is ready
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-6 bg-primary/5 rounded-lg">
                <div className="text-4xl font-bold text-primary mb-2">{aiResults.score}%</div>
                <div className="text-lg text-muted-foreground">Overall Score</div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">AI Feedback</h3>
                  <p className="text-muted-foreground">{aiResults.feedback}</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Explanation</h3>
                  <p className="text-muted-foreground">{aiResults.explanation}</p>
                </div>

                {aiResults.strengths && aiResults.strengths.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Your Strengths</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {aiResults.strengths.map((strength: string, index: number) => (
                        <li key={index} className="text-muted-foreground">{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiResults.areas_for_improvement && aiResults.areas_for_improvement.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Areas for Improvement</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {aiResults.areas_for_improvement.map((area: string, index: number) => (
                        <li key={index} className="text-muted-foreground">{area}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiResults.recommendations && aiResults.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Recommendations</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {aiResults.recommendations.map((recommendation: string, index: number) => (
                        <li key={index} className="text-muted-foreground">{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-4">
                <Button onClick={() => navigate('/assessments')} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Assessments
                </Button>
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">{assessment.title}</h1>
              <p className="text-muted-foreground">{assessment.description}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
              </div>
              <Badge variant="outline">Attempt #{attempt.attempt_number}</Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>Question {currentQuestionIndex + 1} of {assessment.questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Question */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQuestion?.question}
            </CardTitle>
            {currentQuestion?.required && (
              <Badge variant="destructive">Required</Badge>
            )}
          </CardHeader>
          <CardContent>
            {currentQuestion?.type === 'multiple_choice' && (
              <RadioGroup
                value={responses[currentQuestion.id] as string || ''}
                onValueChange={(value) => handleResponseChange(currentQuestion.id, value)}
              >
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${currentQuestion.id}-${index}`} />
                    <Label htmlFor={`${currentQuestion.id}-${index}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion?.type === 'text' && (
              <Textarea
                value={responses[currentQuestion.id] as string || ''}
                onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                placeholder="Enter your response..."
                rows={4}
              />
            )}

            {currentQuestion?.type === 'rating' && (
              <div className="space-y-2">
                <Label>Rate from 1 to 5:</Label>
                <RadioGroup
                  value={responses[currentQuestion.id] as string || ''}
                  onValueChange={(value) => handleResponseChange(currentQuestion.id, value)}
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <RadioGroupItem value={rating.toString()} id={`${currentQuestion.id}-${rating}`} />
                      <Label htmlFor={`${currentQuestion.id}-${rating}`}>{rating}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {currentQuestion?.type === 'boolean' && (
              <RadioGroup
                value={responses[currentQuestion.id] as string || ''}
                onValueChange={(value) => handleResponseChange(currentQuestion.id, value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id={`${currentQuestion.id}-true`} />
                  <Label htmlFor={`${currentQuestion.id}-true`}>Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id={`${currentQuestion.id}-false`} />
                  <Label htmlFor={`${currentQuestion.id}-false`}>No</Label>
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevQuestion}
            disabled={isFirstQuestion}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {!isLastQuestion ? (
              <Button onClick={nextQuestion}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={submitAssessment}
                disabled={submitting || aiProcessing}
                className="bg-primary hover:bg-primary/90"
              >
                {submitting || aiProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {aiProcessing ? 'AI Processing...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Assessment
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* AI Processing Status */}
        {aiProcessing && (
          <Alert className="mt-4">
            <Brain className="h-4 w-4" />
            <AlertDescription>
              AI is analyzing your responses. This may take a few moments...
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
