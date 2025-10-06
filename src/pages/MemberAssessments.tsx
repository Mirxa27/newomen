import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle,
  Target,
  Brain,
  Heart,
  Zap,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { memberAssessments } from "@/data/memberAssessments";
import { aiAssessmentService, type AIProcessingResult } from "@/services/AIAssessmentService";
import type { Json, Tables } from "@/integrations/supabase/types";

type SupabaseAssessment = Tables<"assessments">;

type AssessmentQuestion = {
  question: string;
  options: string[];
};

type AssessmentDetails = {
  id: string;
  title: string;
  description: string;
  category: string;
  tier: string;
  questions: AssessmentQuestion[];
};

type ResultMessage = {
  title: string;
  description: string;
  color: string;
};

interface AssessmentResultPayload {
  user_id: string;
  assessment_id: string;
  answers: Json;
  raw_score: number;
  percentage_score: number;
  ai_feedback?: string;
  ai_insights?: Json;
  ai_recommendations?: string;
  personality_traits?: Json;
  strengths_identified?: Json;
  areas_for_improvement?: Json;
  detailed_explanations?: Json;
  processing_time_ms?: number;
  ai_model_used?: string;
  attempt_number?: number;
  is_passed?: boolean;
  completed_at: string;
}

const toStaticAssessments = (): AssessmentDetails[] =>
  memberAssessments.map((assessment) => ({
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    category: assessment.category,
    tier: assessment.tier ?? "growth",
    questions: assessment.questions.map((question) => ({
      question: question.question,
      options: [...question.options],
    })),
  }));

const parseQuestionSet = (value: SupabaseAssessment["questions"]): AssessmentQuestion[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (
        entry &&
        typeof entry === "object" &&
        "question" in entry &&
        "options" in entry &&
        Array.isArray((entry as Record<string, unknown>).options)
      ) {
        return {
          question: String((entry as Record<string, unknown>).question ?? ""),
          options: (entry as Record<string, unknown>).options.map((option) => String(option ?? "")),
        };
      }
      return null;
    })
    .filter((question): question is AssessmentQuestion => Boolean(question));
};

const normalizeSupabaseAssessment = (record: SupabaseAssessment): AssessmentDetails | null => {
  const questions = parseQuestionSet(record.questions);

  if (questions.length === 0) {
    return null;
  }

  return {
    id: record.id,
    title: record.title,
    description: record.description ?? "Personalized assessment",
    category: record.category ?? "growth",
    tier: record.difficulty_level ?? "growth",
    questions,
  };
};

const categoryIcons: Record<string, LucideIcon> = {
  personality: Brain,
  emotional: Heart,
  career: Target,
  wellness: Zap,
  relationships: Heart,
  growth: Target,
  "self-discovery": Sparkles,
  mindset: Brain,
  "personal-growth": Sparkles,
  productivity: Target,
  finance: Target,
  communication: Heart,
  "emotional-health": Heart,
  "goal-setting": Target,
  default: Sparkles,
};

export default function MemberAssessments() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<AssessmentDetails[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentDetails | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<AIProcessingResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssessments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("assessments")
          .select("id, title, description, category, difficulty_level, questions")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          const parsed = data
            .map((record) => normalizeSupabaseAssessment(record))
            .filter((assessment): assessment is AssessmentDetails => Boolean(assessment));

          if (parsed.length > 0) {
            setAssessments(parsed);
            return;
          }
        }

        setAssessments(toStaticAssessments());
      } catch (error) {
        console.error("Error loading assessments:", error);
        toast.error("Unable to load live assessments. Showing defaults.");
        setAssessments(toStaticAssessments());
      } finally {
        setLoading(false);
      }
    };

    void loadAssessments();
  }, []);

  const startAssessment = (assessment: AssessmentDetails) => {
    setSelectedAssessment(assessment);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
    setAiResult(null);
  };

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: answer }));
  };

  const handleNext = () => {
    if (!selectedAssessment) {
      return;
    }

    if (!answers[currentQuestion]) {
      toast.error("Please select an answer");
      return;
    }

    if (currentQuestion < selectedAssessment.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      void calculateResults();
    }
  };

  const handlePrevious = () => {
    setCurrentQuestion((prev) => Math.max(0, prev - 1));
  };

  const calculateResults = async () => {
    if (!selectedAssessment) {
      return;
    }

    setAiProcessing(true);
    setShowResults(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, crystal_balance")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        throw new Error("User profile not found");
      }

      let resultFromAI: AIProcessingResult | null = null;
      let finalScore = 0;

      try {
        resultFromAI = await aiAssessmentService.processAssessmentWithAI(
          selectedAssessment.id,
          profile.id,
          answers,
        );

        if (resultFromAI.success && typeof resultFromAI.percentage_score === "number") {
          finalScore = resultFromAI.percentage_score;
          setAiResult(resultFromAI);
          toast.success("AI analysis completed!");
        } else {
          throw new Error(resultFromAI.error_message || "AI processing failed");
        }
      } catch (aiError) {
        console.warn("AI processing failed, using fallback:", aiError);
        const totalQuestions = selectedAssessment.questions.length;
        const answeredCount = Object.keys(answers).length;
        finalScore = totalQuestions > 0 ? Math.floor((answeredCount / totalQuestions) * 100) : 0;
        toast.info("Using basic scoring while AI finishes setup");
        setAiResult(null);
      }

      setScore(finalScore);

      const resultPayload: AssessmentResultPayload = {
        user_id: profile.id,
        assessment_id: selectedAssessment.id,
        answers: answers as unknown as Json,
        raw_score: finalScore,
        percentage_score: finalScore,
        completed_at: new Date().toISOString(),
      };

      if (resultFromAI && resultFromAI.success) {
        if (resultFromAI.feedback) resultPayload.ai_feedback = resultFromAI.feedback;
        if (resultFromAI.recommendations) resultPayload.ai_recommendations = resultFromAI.recommendations;
        if (resultFromAI.ai_model_used) resultPayload.ai_model_used = resultFromAI.ai_model_used;
        if (typeof resultFromAI.processing_time_ms === "number") {
          resultPayload.processing_time_ms = resultFromAI.processing_time_ms;
        }
        if (resultFromAI.insights) {
          resultPayload.ai_insights = resultFromAI.insights as Json;
        }
        if (resultFromAI.strengths_identified) {
          resultPayload.strengths_identified = resultFromAI.strengths_identified as Json;
        }
        if (resultFromAI.areas_for_improvement) {
          resultPayload.areas_for_improvement = resultFromAI.areas_for_improvement as Json;
        }
        if (resultFromAI.personality_traits) {
          resultPayload.personality_traits = resultFromAI.personality_traits as Json;
        }
        if (resultFromAI.detailed_explanations) {
          resultPayload.detailed_explanations = resultFromAI.detailed_explanations as Json;
        }
      }

      const { error: insertError } = await supabase
        .from("assessment_results")
        .insert(resultPayload);

      if (insertError) {
        throw insertError;
      }

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ crystal_balance: (profile.crystal_balance || 0) + 50 })
        .eq("id", profile.id);

      if (updateError) {
        throw updateError;
      }

      toast.success("Assessment completed! +50 Crystals earned.");
    } catch (error) {
      console.error("Error processing assessment:", error);
      toast.error("Failed to process assessment. Please try again.");
      setShowResults(false);
    } finally {
      setAiProcessing(false);
    }
  };

  const resultMessage = useMemo<ResultMessage>(() => {
    if (score >= 80) {
      return {
        title: "Excellent!",
        description: "You show strong understanding in this area.",
        color: "text-green-500",
      };
    }

    if (score >= 60) {
      return {
        title: "Good Progress",
        description: "You're on the right track with room to grow.",
        color: "text-blue-500",
      };
    }

    return {
      title: "Keep Growing",
      description: "This is a great area to focus your development.",
      color: "text-amber-500",
    };
  }, [score]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading assessments...</p>
        </div>
      </div>
    );
  }

  if (showResults && selectedAssessment) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card">
            <CardHeader className="text-center space-y-3">
              <CheckCircle className={`w-16 h-16 mx-auto ${resultMessage.color}`} />
              <CardTitle className="text-3xl">{resultMessage.title}</CardTitle>
              <CardDescription className="text-lg">{selectedAssessment.title}</CardDescription>
              {aiProcessing && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating AI insights...</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="clay p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Your Score</span>
                  <span className="text-3xl font-bold gradient-text">{score}%</span>
                </div>
                <Progress value={score} className="h-3" />
                <p className="text-muted-foreground">{resultMessage.description}</p>
              </div>

              {aiResult && aiResult.success && (
                <div className="clay p-6 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI-Powered Insights
                  </h3>
                  {aiResult.feedback && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm leading-relaxed">{aiResult.feedback}</p>
                    </div>
                  )}
                  {aiResult.recommendations && (
                    <div>
                      <h4 className="font-medium mb-2">Personalized Recommendations</h4>
                      <p className="text-sm text-muted-foreground">{aiResult.recommendations}</p>
                    </div>
                  )}
                  {Array.isArray(aiResult.strengths_identified) && aiResult.strengths_identified.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Your Strengths</h4>
                      <ul className="space-y-1">
                        {aiResult.strengths_identified.map((strength, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            {String(strength)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(aiResult.areas_for_improvement) && aiResult.areas_for_improvement.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Areas for Growth</h4>
                      <ul className="space-y-1">
                        {aiResult.areas_for_improvement.map((area, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-amber-500 mt-1">•</span>
                            {String(area)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {!aiResult && !aiProcessing && (
                <div className="clay p-6 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Insights & Recommendations
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Based on your responses, consider focusing on self-reflection practices.</li>
                    <li>• Your answers suggest strong emotional awareness.</li>
                    <li>• Continue exploring this topic through our AI conversations.</li>
                    <li>• Track your progress by retaking this assessment in 30 days.</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setSelectedAssessment(null);
                    setShowResults(false);
                    setAiResult(null);
                    setAnswers({});
                  }}
                  className="flex-1"
                  variant="outline"
                >
                  Browse Assessments
                </Button>
                <Button onClick={() => navigate("/chat")} className="flex-1 glow-primary">
                  Discuss with AI
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedAssessment) {
    const question = selectedAssessment.questions[currentQuestion];
    const progress = selectedAssessment.questions.length
      ? ((currentQuestion + 1) / selectedAssessment.questions.length) * 100
      : 0;

    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={() => setSelectedAssessment(null)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestion + 1} of {selectedAssessment.questions.length}
                </span>
              </div>
              <Progress value={progress} className="h-2 mb-4" />
              <CardTitle className="text-xl">{selectedAssessment.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{question?.question}</h3>
                <RadioGroup value={answers[currentQuestion] ?? ""} onValueChange={handleAnswer}>
                  {question?.options.map((option, index) => (
                    <div
                      key={option}
                      className="flex items-center space-x-3 p-4 rounded-xl hover:bg-muted/50 transition-colors border border-border"
                    >
                      <RadioGroupItem value={option} id={`q${currentQuestion}-opt${index}`} />
                      <Label htmlFor={`q${currentQuestion}-opt${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  variant="outline"
                  className="flex-1"
                >
                  Previous
                </Button>
                <Button onClick={handleNext} className="flex-1 glow-primary" disabled={!answers[currentQuestion]}>
                  {currentQuestion === selectedAssessment.questions.length - 1 ? "Finish" : "Next"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">Member Assessments</h1>
          <p className="text-xl text-muted-foreground">
            Deep dive into your personal growth journey with comprehensive assessments.
          </p>
        </div>

        {assessments.length === 0 ? (
          <div className="text-center text-muted-foreground">No assessments available yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment) => {
              const Icon = categoryIcons[assessment.category] ?? categoryIcons.default;
              return (
                <Card
                  key={assessment.id}
                  className="glass hover:scale-105 transition-transform cursor-pointer group"
                  onClick={() => startAssessment(assessment)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {assessment.category}
                      </Badge>
                    </div>
                    <CardTitle className="group-hover:gradient-text transition-all">{assessment.title}</CardTitle>
                    <CardDescription>{assessment.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{assessment.questions.length} Questions</span>
                      <span>~{Math.max(1, Math.ceil(assessment.questions.length * 0.5))} min</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
