import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Trophy,
  BookOpen,
  Award,
  TrendingUp,
  Clock,
} from "lucide-react";
import { aiAssessmentService, type AIProcessingResult } from "@/services/AIAssessmentService";
import type { Json, Tables } from "@/integrations/supabase/types";

// --- Type Definitions ---
type Assessment = Tables<"assessments">;
type AssessmentQuestion = { question: string; options: string[] };
type AssessmentDetails = {
  id: string;
  title: string;
  description: string;
  category: string;
  questions: AssessmentQuestion[];
};
type UserStats = {
  total_assessments_completed: number;
  average_assessment_score: number;
  current_streak: number;
};
type ResultMessage = { title: string; description: string; color: string };

// --- Main Component ---
export default function AssessmentsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<AssessmentDetails[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentDetails | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<AIProcessingResult | null>(null);

  // --- Data Loading ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const [assessmentsRes, statsRes] = await Promise.all([
        supabase.from("assessments").select("*").eq("is_active", true),
        supabase.from("user_assessment_stats").select("*").eq("user_id", user.id).single(),
      ]);

      if (assessmentsRes.error) throw assessmentsRes.error;
      
      const parsedAssessments = assessmentsRes.data
        .map(normalizeSupabaseAssessment)
        .filter((a): a is AssessmentDetails => a !== null);
      setAssessments(parsedAssessments);

      if (statsRes.data) {
        setUserStats(statsRes.data as UserStats);
      } else {
         setUserStats({ total_assessments_completed: 0, average_assessment_score: 0, current_streak: 0 });
      }

    } catch (error) {
      console.error("Error loading assessments data:", error);
      toast.error("Failed to load assessments data.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Assessment Logic ---
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
    if (!selectedAssessment) return;
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
    if (!selectedAssessment) return;
    setAiProcessing(true);
    setShowResults(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const result = await aiAssessmentService.processAssessmentWithAI(
        selectedAssessment.id,
        user.id,
        answers
      );

      if (!result.success) throw new Error(result.error_message || "AI processing failed");
      
      setScore(result.percentage_score ?? 0);
      setAiResult(result);
      toast.success("AI analysis completed!");

      // Save results to DB
      await supabase.from("assessment_results").insert({
        user_id: user.id,
        assessment_id: selectedAssessment.id,
        answers: answers as unknown as Json,
        raw_score: result.percentage_score,
        percentage_score: result.percentage_score,
        ai_feedback: result.feedback,
        ai_insights: result.insights as Json,
        ai_recommendations: result.recommendations,
        completed_at: new Date().toISOString(),
      });

      // Award crystals
      const { data: profile } = await supabase.from("user_profiles").select("crystal_balance").eq("user_id", user.id).single();
      await supabase.from("user_profiles").update({ crystal_balance: (profile?.crystal_balance || 0) + 50 }).eq("user_id", user.id);
      toast.success("Assessment completed! +50 Crystals earned.");

    } catch (error) {
      console.error("Error processing assessment:", error);
      toast.error("Failed to process assessment. Please try again.");
      setShowResults(false);
    } finally {
      setAiProcessing(false);
    }
  };

  // --- UI Render ---
  if (loading) return <LoadingState />;
  if (showResults && selectedAssessment) return <ResultsView />;
  if (selectedAssessment) return <AssessmentView />;
  return <AssessmentListView />;

  // --- Sub-components ---
  function LoadingState() {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Assessment Center...</p>
        </div>
      </div>
    );
  }

  function AssessmentListView() {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-4xl font-bold gradient-text">Assessment Center</h1>
              <p className="text-muted-foreground">
                Discover insights about yourself with our assessments
              </p>
            </div>
          </div>

          {userStats && <StatsOverview stats={userStats} />}

          <Tabs defaultValue="assessments">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
            </TabsList>
            <TabsContent value="assessments" className="mt-6">
              {assessments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No assessments available yet. Check back soon!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assessments.map((assessment) => (
                    <Card
                      key={assessment.id}
                      className="glass-card hover:scale-105 transition-transform cursor-pointer group"
                      onClick={() => startAssessment(assessment)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                            <Brain className="w-6 h-6 text-primary" />
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
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  function StatsOverview({ stats }: { stats: UserStats }) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.total_assessments_completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold">
                  {stats.average_assessment_score > 0 ? Math.round(stats.average_assessment_score) : '--'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{stats.current_streak}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function AssessmentView() {
    if (!selectedAssessment) return null;
    const question = selectedAssessment.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / selectedAssessment.questions.length) * 100;

    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={() => setSelectedAssessment(null)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
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
                    <div key={index} className="flex items-center space-x-3 p-4 rounded-xl hover:bg-muted/50 transition-colors border border-border">
                      <RadioGroupItem value={option} id={`q${currentQuestion}-opt${index}`} />
                      <Label htmlFor={`q${currentQuestion}-opt${index}`} className="flex-1 cursor-pointer">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="flex gap-3">
                <Button onClick={handlePrevious} disabled={currentQuestion === 0} variant="outline" className="flex-1 glass">Previous</Button>
                <Button onClick={handleNext} className="flex-1 clay-button" disabled={!answers[currentQuestion]}>
                  {currentQuestion === selectedAssessment.questions.length - 1 ? "Finish" : "Next"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  function ResultsView() {
    const resultMessage = useMemo<ResultMessage>(() => {
      if (score >= 80) return { title: "Excellent!", description: "You show strong understanding in this area.", color: "text-green-500" };
      if (score >= 60) return { title: "Good Progress", description: "You're on the right track with room to grow.", color: "text-blue-500" };
      return { title: "Keep Growing", description: "This is a great area to focus your development.", color: "text-amber-500" };
    }, [score]);

    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card">
            <CardHeader className="text-center space-y-3">
              <CheckCircle className={`w-16 h-16 mx-auto ${resultMessage.color}`} />
              <CardTitle className="text-3xl">{resultMessage.title}</CardTitle>
              <CardDescription className="text-lg">{selectedAssessment?.title}</CardDescription>
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

              {aiResult?.success && (
                <div className="clay p-6 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />AI-Powered Insights</h3>
                  {aiResult.feedback && <div className="bg-muted/50 p-4 rounded-lg"><p className="text-sm leading-relaxed">{aiResult.feedback}</p></div>}
                  {aiResult.recommendations && <div><h4 className="font-medium mb-2">Personalized Recommendations</h4><p className="text-sm text-muted-foreground">{aiResult.recommendations}</p></div>}
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => setSelectedAssessment(null)} className="flex-1" variant="outline">Browse Assessments</Button>
                <Button onClick={() => navigate("/chat")} className="flex-1 clay-button">Discuss with AI</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
}

// --- Helper Functions ---
const normalizeSupabaseAssessment = (record: Assessment): AssessmentDetails | null => {
  const questions = Array.isArray(record.questions) ? record.questions.map(q => ({
    question: (q as any)?.question ?? "",
    options: Array.isArray((q as any)?.options) ? (q as any).options.map(String) : [],
  })) : [];

  if (questions.length === 0) return null;

  return {
    id: record.id,
    title: record.title,
    description: record.description ?? "Personalized assessment",
    category: record.category ?? "growth",
    questions,
  };
};