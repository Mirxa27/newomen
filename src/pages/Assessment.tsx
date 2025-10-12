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
  Send,
  Sparkles,
  Lightbulb,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createAssessmentAttempt, submitAssessmentResponses } from "@/lib/ai-assessment-utils";
import { aiAssessmentService } from "@/services/AIAssessmentService";
import { trackAssessmentCompletion } from "@/lib/gamification-events";
import type { Tables } from "@/integrations/supabase/types";
import type { AssessmentAnswers } from "@/types/ai-types";

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
  const [responses, setResponses] = useState<AssessmentAnswers>({});
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
        try {
          const aiResult = await aiAssessmentService.processAssessmentWithAI(assessment.id, {
            assessment_id: assessment.id,
            user_id: attempt.user_id,
            attempt_id: attempt.id,
            userId: attempt.user_id,
            attemptId: attempt.id,
            responses,
            time_spent_minutes: Math.floor(timeSpent / 60),
            timeSpentMinutes: Math.floor(timeSpent / 60),
            attempt_number: attempt.attempt_number,
          });

          console.log('AI Result received:', aiResult);

          if (aiResult && aiResult.score !== undefined) {
            completedScore = aiResult.score ?? 0;
            setAiResults({
              score: aiResult.score,
              feedback: aiResult.feedback,
              explanation: aiResult.explanation,
              insights: aiResult.insights,
              recommendations: aiResult.recommendations,
              strengths: aiResult.strengths,
              areas_for_improvement: aiResult.areas_for_improvement,
              is_passing: aiResult.is_passing,
            } as AIAnalysisResult);
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
        } catch (aiError) {
          console.error('AI processing error:', aiError);
          toast({
            title: "Assessment completed",
            description: "Your responses have been saved. AI analysis encountered an error.",
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

  const handleResponseChange = (questionId: string, value: string | number | boolean | string[]) => {
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Card with Affirmation */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
                Assessment Complete! 🎉
              </CardTitle>
              <CardDescription className="text-lg">
                You've taken a meaningful step in your journey of self-discovery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-6 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-5xl font-bold text-primary mb-3">{aiResults.score}%</div>
                <div className="text-xl font-semibold mb-2">Overall Score</div>
                <p className="text-muted-foreground italic">
                  {aiResults.is_passing 
                    ? "✨ Congratulations! You've shown deep insight and self-awareness." 
                    : "🌱 Every step forward is progress. You're on a meaningful path of growth."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Feedback Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Personalized Feedback from NewMe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <p className="text-lg leading-relaxed">{aiResults.feedback}</p>
              </div>
              {aiResults.explanation && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Detailed Analysis</h4>
                  <p className="text-muted-foreground leading-relaxed">{aiResults.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights Card */}
          {aiResults.insights && aiResults.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Key Insights
                </CardTitle>
                <CardDescription>
                  Deeper patterns and observations from your responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {aiResults.insights.map((insight: string, index: number) => (
                    <li key={index} className="flex gap-3 p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
                      <span className="text-yellow-500 font-bold">💡</span>
                      <span className="text-foreground leading-relaxed">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Strengths & Growth Areas Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths Card */}
            {aiResults.strengths && aiResults.strengths.length > 0 && (
              <Card className="border-green-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    Your Strengths
                  </CardTitle>
                  <CardDescription>
                    Celebrate these positive qualities you demonstrated
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {aiResults.strengths.map((strength: string, index: number) => (
                      <li key={index} className="flex gap-3 p-3 bg-green-500/5 rounded-lg">
                        <span className="text-green-500">✓</span>
                        <span className="text-foreground leading-relaxed">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Areas for Growth Card */}
            {aiResults.areas_for_improvement && aiResults.areas_for_improvement.length > 0 && (
              <Card className="border-blue-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <TrendingUp className="w-5 h-5" />
                    Opportunities for Growth
                  </CardTitle>
                  <CardDescription>
                    Areas where you can continue to evolve
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {aiResults.areas_for_improvement.map((area: string, index: number) => (
                      <li key={index} className="flex gap-3 p-3 bg-blue-500/5 rounded-lg">
                        <span className="text-blue-500">→</span>
                        <span className="text-foreground leading-relaxed">{area}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recommendations Card */}
          {aiResults.recommendations && aiResults.recommendations.length > 0 && (
            <Card className="border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Lightbulb className="w-5 h-5" />
                  Personalized Recommendations
                </CardTitle>
                <CardDescription>
                  Actionable steps to support your continued growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {aiResults.recommendations.map((recommendation: string, index: number) => (
                    <li key={index} className="flex gap-3 p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
                      <span className="text-purple-500 font-bold">{index + 1}.</span>
                      <span className="text-foreground leading-relaxed">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Affirmation Card */}
          <Card className="bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-primary/10 border-pink-500/20">
            <CardContent className="py-6 px-6 text-center">
              <p className="text-xl font-medium mb-2">Remember...</p>
              <p className="text-lg text-muted-foreground italic leading-relaxed">
                "Self-discovery is not about perfection—it's about presence, awareness, and the courage 
                to see yourself clearly. Every reflection brings you closer to living authentically. 
                You're exactly where you need to be. 🌟"
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pb-8">
            <Button onClick={() => navigate('/assessments')} variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assessments
            </Button>
            <Button onClick={() => navigate('/dashboard')} size="lg">
              Go to Dashboard
            </Button>
          </div>
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