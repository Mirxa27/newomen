import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { Textarea } from "@/components/shared/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/shared/ui/radio-group";
import { Checkbox } from "@/components/shared/ui/checkbox";
import { Progress } from "@/components/shared/ui/progress";
import { Badge } from "@/components/shared/ui/badge";
import { Alert, AlertDescription } from "@/components/shared/ui/alert";
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
import { useToast } from "@/hooks/shared/ui/use-toast";
import { trackAssessmentCompletion } from "@/lib/features/assessment/gamification-events";
import { unifiedAIAssessmentService } from "@/services/features/ai/UnifiedAIAssessmentService";
import type { AssessmentAnswers } from "@/types/features/ai/ai-types";
import type { 
  Assessment as UnifiedAssessment, 
  AssessmentAttempt as UnifiedAssessmentAttempt,
  AssessmentQuestion,
  AIAnalysisResult
} from "@/services/features/ai/UnifiedAIAssessmentService";

// Use types from UnifiedAIAssessmentService
type Assessment = UnifiedAssessment;
type AssessmentAttempt = UnifiedAssessmentAttempt;

interface AIQuestionInsight {
  question_id: string;
  question_text: string;
  purpose: string;
  tips: string;
  suggested_approach: string;
}

interface AIQuestionAnalysis {
  assessment_overview?: string;
  question_insights?: AIQuestionInsight[];
  overall_guidance?: string;
  time_estimate?: string;
}

interface AIAnswerOption {
  option_text: string;
  explanation: string;
  tone: string;
}

interface AIAnswerOptionsPayload {
  question_analysis?: string;
  answer_options?: AIAnswerOption[];
  guidance?: string;
  common_pitfalls?: string;
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
  const [aiHealthCheck, setAiHealthCheck] = useState<boolean | null>(null);
  const [aiQuestionAnalysis, setAiQuestionAnalysis] = useState<AIQuestionAnalysis | null>(null);
  const [aiAnswerOptions, setAiAnswerOptions] = useState<Record<string, AIAnswerOptionsPayload>>({});
  const [loadingAiAnalysis, setLoadingAiAnalysis] = useState(false);
  const [requiresAI, setRequiresAI] = useState(false);


  // Analyze assessment questions with AI
  const analyzeQuestionsWithAI = useCallback(async (assessmentData: Assessment) => {
    if (!id || !assessmentData.ai_config_id) return;

    setLoadingAiAnalysis(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assessment-helper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          assessmentId: id,
          userId: session.user.id,
          action: 'analyze_questions'
        })
      });

      if (!response.ok) {
        throw new Error(`AI analysis failed with status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setAiQuestionAnalysis(result.analysis);
        toast({
          title: "AI Analysis Complete",
          description: "AI has analyzed your assessment questions and is ready to help!",
        });
      }
    } catch (error) {
      console.error('AI question analysis failed:', error);
      toast({
        title: "AI Analysis Failed",
        description: "AI analysis is temporarily unavailable, but you can still take the assessment.",
        variant: "destructive"
      });
    } finally {
      setLoadingAiAnalysis(false);
    }
  }, [id, toast]);

  // Generate AI answer options for a specific question
  const generateAIAnswerOptions = useCallback(async (questionId: string, questionText: string, questionType: string) => {
    if (!id || !requiresAI) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assessment-helper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          assessmentId: id,
          userId: session.user.id,
          action: 'generate_answers',
          questionId,
          questionText,
          questionType
        })
      });

      if (!response.ok) {
        console.error('AI answer generation failed with status:', response.status);
        return;
      }

      const result = await response.json();
      if (result.success) {
        setAiAnswerOptions(prev => ({
          ...prev,
          [questionId]: result.answerOptions
        }));
      }
    } catch (error) {
      console.error('AI answer generation failed:', error);
    }
  }, [id, requiresAI]);

  const loadAssessment = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const assessmentData = await unifiedAIAssessmentService.getAssessment(id);
      
      if (!assessmentData) {
        throw new Error("Assessment not found or no longer available");
      }

      setAssessment(assessmentData);

      const needsAI = Boolean(assessmentData.ai_config_id);
      setRequiresAI(needsAI);

      if (needsAI) {
        const aiHealthy = await unifiedAIAssessmentService.checkAIHealth();
        setAiHealthCheck(aiHealthy);

        if (aiHealthy) {
          await analyzeQuestionsWithAI(assessmentData);
        }
      } else {
        setAiHealthCheck(true);
        setAiQuestionAnalysis(null);
      }
    } catch (error: unknown) {
      console.error("Error loading assessment:", error);
      setError("Assessment not found or no longer available");
    } finally {
      setLoading(false);
    }
  }, [id, analyzeQuestionsWithAI]);

  const startAttempt = useCallback(async () => {
    if (!assessment || !id) return;

    if (requiresAI && aiHealthCheck === false) {
      toast({
        title: "AI Services Unavailable",
        description: "Assessment requires AI assistance which is currently unavailable. Please try again later.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const attemptId = await unifiedAIAssessmentService.createAssessmentAttempt(id, user.id);
      if (!attemptId) {
        throw new Error("Failed to create assessment attempt");
      }

      const attemptData = await unifiedAIAssessmentService.getAssessmentAttempt(attemptId);
      if (!attemptData) {
        throw new Error("Failed to retrieve assessment attempt");
      }

      setAttempt(attemptData);
      setTimeRemaining((assessment.time_limit_minutes || 30) * 60);

      // Parse questions from JSON
      const questions = unifiedAIAssessmentService.parseAssessmentQuestions(assessment.questions);
      if (requiresAI && questions.length > 0) {
        const firstQuestion = questions[0];
        await generateAIAnswerOptions(
          firstQuestion.id,
          firstQuestion.question,
          firstQuestion.type
        );
      }
    } catch (error: unknown) {
      console.error("Error starting attempt:", error);
      setError("Failed to start assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [assessment, id, aiHealthCheck, generateAIAnswerOptions, toast, requiresAI]);

  const submitAssessment = useCallback(async () => {
    if (!attempt || !assessment) return;

    setSubmitting(true);
    try {
      // Submit responses
      const timeSpent = Math.max(0, (assessment.time_limit_minutes || 0) * 60 - timeRemaining);
      const timeSpentMinutes = Math.floor(timeSpent / 60);
      
      const success = await unifiedAIAssessmentService.submitAssessmentResponses(
        attempt.id, 
        responses, 
        timeSpentMinutes
      );

      if (!success) {
        throw new Error("Failed to submit assessment");
      }

      let completedScore = 0;

      // Process with AI if configured
      if (assessment.ai_config_id && attempt.user_id) {
        setAiProcessing(true);
        try {
          const aiResult = await unifiedAIAssessmentService.processAssessmentWithAI(
            assessment.id,
            attempt.id,
            attempt.user_id,
            responses,
            timeSpentMinutes
          );

          console.log('AI Result received:', aiResult);

          if (aiResult && aiResult.score !== undefined) {
            completedScore = aiResult.score;
            setAiResults(aiResult);
            
            // Update user progress
            await unifiedAIAssessmentService.updateUserProgress(
              attempt.user_id,
              assessment.id,
              aiResult.score,
              attempt.id,
              assessment.passing_score || 70
            );

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
      if (attempt.user_id) {
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

  const nextQuestion = async () => {
    if (assessment) {
      const questions = unifiedAIAssessmentService.parseAssessmentQuestions(assessment.questions);
      if (currentQuestionIndex < questions.length - 1) {
        const newIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(newIndex);
        
        if (requiresAI && questions[newIndex]) {
          const question = questions[newIndex];
          await generateAIAnswerOptions(
            question.id,
            question.question,
            question.type
          );
        }
      }
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const getQuestions = () => {
    if (!assessment) return [];
    return unifiedAIAssessmentService.parseAssessmentQuestions(assessment.questions);
  };

  const questions = getQuestions();
  const isLastQuestion = questions.length > 0 ? currentQuestionIndex === questions.length - 1 : false;
  const isFirstQuestion = currentQuestionIndex === 0;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

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
                  <div className="text-2xl font-bold">{questions.length}</div>
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

              {/* AI Health Check Status */}
              {requiresAI && aiHealthCheck === null && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Checking AI services availability...
                  </AlertDescription>
                </Alert>
              )}

              {requiresAI && aiHealthCheck === false && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    AI services are currently unavailable. This assessment requires AI assistance to provide the best experience. Please try again later.
                  </AlertDescription>
                </Alert>
              )}

              {requiresAI && aiHealthCheck === true && (
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    ✅ AI services are ready! This assessment will provide AI-powered assistance and personalized feedback.
                  </AlertDescription>
                </Alert>
              )}

              {/* AI Question Analysis */}
              {requiresAI && aiQuestionAnalysis && (
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <Sparkles className="w-5 h-5" />
                      AI Assessment Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-white/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Assessment Overview</h4>
                      <p className="text-sm text-muted-foreground">{aiQuestionAnalysis.assessment_overview}</p>
                    </div>
                    <div className="bg-white/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Guidance</h4>
                      <p className="text-sm text-muted-foreground">{aiQuestionAnalysis.overall_guidance}</p>
                    </div>
                    <div className="bg-white/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Estimated Time</h4>
                      <p className="text-sm text-muted-foreground">{aiQuestionAnalysis.time_estimate}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-center">
                <Button 
                  onClick={startAttempt} 
                  size="lg" 
                  className="px-8"
                  disabled={requiresAI && (aiHealthCheck === false || loadingAiAnalysis)}
                >
                  {loadingAiAnalysis ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Preparing AI Assistance...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Start Assessment
                    </>
                  )}
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
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
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

        {/* AI Answer Options */}
        {requiresAI && currentQuestion && aiAnswerOptions[currentQuestion.id] && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Lightbulb className="w-5 h-5" />
                AI Answer Suggestions
              </CardTitle>
              <CardDescription>
                Here are some example answers to help you understand what kind of response is expected:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Question Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  {aiAnswerOptions[currentQuestion.id].question_analysis}
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Example Answers:</h4>
                {aiAnswerOptions[currentQuestion.id].answer_options?.map((option: AIAnswerOption, index: number) => (
                  <div key={index} className="bg-white/70 p-3 rounded-lg border border-green-200">
                    <div className="font-medium text-sm mb-1">{option.option_text}</div>
                    <div className="text-xs text-muted-foreground mb-1">
                      <span className="font-medium">Why this works:</span> {option.explanation}
                    </div>
                    <div className="text-xs text-green-600">
                      <span className="font-medium">Tone:</span> {option.tone}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold mb-2 text-blue-700">Guidance</h4>
                <p className="text-sm text-blue-600">
                  {aiAnswerOptions[currentQuestion.id].guidance}
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold mb-2 text-yellow-700">What to Avoid</h4>
                <p className="text-sm text-yellow-600">
                  {aiAnswerOptions[currentQuestion.id].common_pitfalls}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

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
