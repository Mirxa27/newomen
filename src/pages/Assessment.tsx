import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, Send, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processAssessmentWithAI, createAssessmentAttempt, updateAssessmentAttempt, updateAssessmentProgress } from "@/lib/ai-assessment-utils";
import { trackAssessmentCompletion } from "@/lib/gamification-events";
import type { Tables, Json } from "@/integrations/supabase/types";
import { AssessmentsEnhanced } from "@/integrations/supabase/tables/assessments_enhanced";
import { AssessmentAttempts } from "@/integrations/supabase/tables/assessment_attempts";
import { AssessmentResults } from "@/integrations/supabase/tables/assessment_results";

interface AssessmentQuestion {
  id: string;
  question: string;
  type: string;
  options?: string[];
}

interface Assessment extends Omit<AssessmentsEnhanced['Row'], 'questions'> {
  questions: AssessmentQuestion[];
}

interface AssessmentAttempt extends Omit<AssessmentAttempts['Row'], 'raw_responses'> {
  raw_responses: Record<string, unknown>;
}

interface AIAnalysisResult { // Define AIAnalysisResult to match expected structure
  overall_analysis: string;
  strengths_identified: string[];
  growth_areas: string[];
  ai_score: number;
  ai_feedback: string;
  recommendations: string[];
}

export default function AssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<AIAnalysisResult | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const loadAssessment = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("assessments_enhanced")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) {
        setError("Assessment not found.");
        return;
      }

      setAssessment(data as Assessment);
      setStartTime(new Date());

      // Create a new attempt record
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        navigate("/auth");
        return;
      }
      const attemptId = await createAssessmentAttempt(id, userId, {});
      if (!attemptId) {
        throw new Error("Failed to create assessment attempt.");
      }
      setCurrentAttemptId(attemptId);

    } catch (err) {
      console.error("Error loading assessment:", err);
      setError("Failed to load the assessment. It might not exist or you may not have access.");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNextQuestion = () => {
    if (assessment && currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitAssessment = async () => {
    if (!assessment || !currentAttemptId || !startTime) return;
    setSubmitting(true);
    try {
      const endTime = new Date();
      const timeSpentMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      await updateAssessmentAttempt(currentAttemptId, answers, timeSpentMinutes);

      // Process with AI
      setAiProcessing(true);
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("User not logged in.");

      const aiResult = await processAssessmentWithAI(
        assessment.id,
        currentAttemptId,
        userId,
        assessment.ai_config_id || '', // Pass AI config ID
        answers
      );

      let completedScore = 0;
      if (aiResult) {
        completedScore = aiResult.percentage_score ?? 0;
        setAiResults(aiResult as unknown as AIAnalysisResult); // Cast to AIAnalysisResult
        toast({
          title: "Assessment Completed!",
          description: "Your responses have been analyzed by AI.",
        });

        // Update user progress
        await updateAssessmentProgress(userId, assessment.id, currentAttemptId, completedScore);

        // Track completion for gamification
        trackAssessmentCompletion(userId, assessment.id, completedScore);
      } else {
        toast({
          title: "Assessment Completed!",
          description: "Your responses have been saved, but AI analysis failed.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error submitting assessment:", err);
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setAiProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;

  if (aiResults) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader className="text-center">
              <Sparkles className="w-12 h-12 mx-auto text-primary" />
              <CardTitle className="text-3xl mt-4">AI Analysis Complete!</CardTitle>
              <CardDescription>{assessment.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="font-semibold text-lg mb-2">Overall Analysis</h3>
                <p className="text-muted-foreground">{aiResults.overall_analysis}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Strengths Identified</h3>
                <ul className="list-disc list-inside text-muted-foreground">
                  {aiResults.strengths_identified.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Growth Areas</h3>
                <ul className="list-disc list-inside text-muted-foreground">
                  {aiResults.growth_areas.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">AI Feedback</h3>
                <p className="text-muted-foreground">{aiResults.ai_feedback}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Recommendations</h3>
                <ul className="list-disc list-inside text-muted-foreground">
                  {aiResults.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
              <div className="text-center pt-4">
                <Button onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
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
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{assessment.title}</CardTitle>
            <CardDescription>{assessment.description}</CardDescription>
            <div className="pt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Question {currentQuestionIndex + 1} of {assessment.questions.length}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <h3 className="font-semibold text-lg mb-2">
                {currentQuestionIndex + 1}. {currentQuestion.question}
              </h3>
              {currentQuestion.type === "text" && (
                <Textarea
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Your answer..."
                  rows={6}
                />
              )}
              {currentQuestion.type === "multiple-choice" && (
                <div className="space-y-2">
                  {currentQuestion.options?.map((option) => (
                    <Button
                      key={option}
                      variant={answers[currentQuestion.id] === option ? "default" : "outline"}
                      onClick={() => handleAnswerChange(currentQuestion.id, option)}
                      className="w-full justify-start"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <Button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              {currentQuestionIndex === assessment.questions.length - 1 ? (
                <Button onClick={handleSubmitAssessment} disabled={submitting || aiProcessing} className="clay-button">
                  {submitting || aiProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {aiProcessing ? "Analyzing..." : "Submit Assessment"}
                </Button>
              ) : (
                <Button onClick={handleNextQuestion} className="clay-button">
                  Next Question
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}