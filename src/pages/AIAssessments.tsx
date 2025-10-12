import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Brain, Clock, Target, Trophy, BookOpen, Star, TrendingUp, Award } from "lucide-react";

interface Assessment {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  difficulty_level: string;
  time_limit_minutes: number;
  is_public: boolean;
  is_active: boolean;
}

interface UserStats {
  total_assessments_completed: number;
  total_quizzes_completed: number;
  total_challenges_completed: number;
  average_assessment_score: number;
  average_quiz_score: number;
  current_streak: number;
  longest_streak: number;
  total_ai_interactions: number;
}

export default function AIAssessments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState("assessments");

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      const [
        { data: assessmentRows, error: assessmentsError },
        statsResult,
      ] = await Promise.all([
        supabase
          .from("assessments_enhanced")
          .select("*")
          .eq("is_public", true)
          .eq("is_active", true)
          .eq("type", "assessment")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("user_assessment_stats")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (assessmentsError) throw assessmentsError;
      if (statsResult.error && statsResult.error.code !== "PGRST116") throw statsResult.error;

      setAssessments((assessmentRows ?? []) as Assessment[]);
      setUserStats(
        statsResult.data ?? {
          total_assessments_completed: 0,
          total_quizzes_completed: 0,
          total_challenges_completed: 0,
          average_assessment_score: 0,
          average_quiz_score: 0,
          current_streak: 0,
          longest_streak: 0,
          total_ai_interactions: 0,
        }
      );

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load assessments data");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startAssessment = (assessment: Assessment) => {
    navigate(`/assessment/${assessment.id}`);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-orange-500';
      case 'expert': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'personality': return <Brain className="w-4 h-4" />;
      case 'cognitive': return <Target className="w-4 h-4" />;
      case 'emotional': return <Star className="w-4 h-4" />;
      case 'career': return <TrendingUp className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-4xl font-bold gradient-text">AI-Powered Assessments</h1>
            <p className="text-muted-foreground">
              Discover insights about yourself with AI-generated analysis and feedback
            </p>
          </div>
        </div>

        {/* User Stats Overview */}
        {userStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Assessments</p>
                    <p className="text-2xl font-bold">{userStats.total_assessments_completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Quizzes</p>
                    <p className="text-2xl font-bold">{userStats.total_quizzes_completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Challenges</p>
                    <p className="text-2xl font-bold">{userStats.total_challenges_completed}</p>
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
                      {userStats.average_assessment_score > 0
                        ? Math.round(userStats.average_assessment_score)
                        : '--'}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="assessments">
              <Brain className="w-4 h-4 mr-2" />
              Assessments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assessments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Assessments</CardTitle>
                <CardDescription>
                  Comprehensive evaluations with detailed AI-generated insights and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assessments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No assessments available yet</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments.map((assessment) => (
                      <Card key={assessment.id} className="hover:shadow-lg transition-all cursor-pointer border-2 border-primary/20">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(assessment.type)}
                              <Badge variant="outline" className="capitalize">
                                {assessment.type}
                              </Badge>
                            </div>
                            <Badge className={getDifficultyColor(assessment.difficulty_level)}>
                              {assessment.difficulty_level}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{assessment.title}</CardTitle>
                          <CardDescription>{assessment.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{assessment.time_limit_minutes} min</span>
                            </div>
                            <Badge variant="secondary">{assessment.category}</Badge>
                          </div>

                          <Button
                            onClick={() => startAssessment(assessment)}
                            className="w-full clay-button bg-gradient-to-r from-primary to-accent"
                          >
                            Start Assessment
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}