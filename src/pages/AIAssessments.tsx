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
import { aiService } from "@/utils/AIService";

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

interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  time_limit_minutes?: number;
  is_public: boolean;
  is_active: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  category: string;
  difficulty_level: string;
  duration_days: number;
  reward_crystals: number;
  is_public: boolean;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
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
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState("assessments");

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Load assessments
      let assessmentsData;
      try {
        const { data } = await supabase
          .from("assessments_enhanced")
          .select("*")
          .eq("is_public", true)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(20);
        assessmentsData = data;
      } catch (error) {
        console.warn("Assessments table not available yet, using sample data");
        assessmentsData = [
          {
            id: "1",
            title: "Personality Assessment",
            description: "Discover your personality traits and behavioral patterns",
            type: "personality",
            category: "Self-Discovery",
            difficulty_level: "medium",
            time_limit_minutes: 15,
            is_public: true,
            is_active: true
          },
          {
            id: "2",
            title: "Emotional Intelligence Test",
            description: "Evaluate your emotional awareness and social skills",
            type: "emotional",
            category: "Emotional Health",
            difficulty_level: "medium",
            time_limit_minutes: 20,
            is_public: true,
            is_active: true
          }
        ];
      }
      setAssessments(assessmentsData as Assessment[] || []);

      // Load quizzes
      let quizzesData;
      try {
        const { data } = await (supabase as any)
          .from("quizzes")
          .select("*")
          .eq("is_public", true)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(20);
        quizzesData = data;
      } catch (error) {
        console.warn("Quizzes table not available yet, using sample data");
        quizzesData = [
          {
            id: "1",
            title: "Mindfulness Knowledge Quiz",
            description: "Test your understanding of mindfulness concepts",
            category: "Wellness",
            difficulty_level: "easy",
            time_limit_minutes: 10,
            is_public: true,
            is_active: true
          },
          {
            id: "2",
            title: "Psychology Fundamentals",
            description: "Basic concepts in psychology and human behavior",
            category: "Psychology",
            difficulty_level: "medium",
            time_limit_minutes: 15,
            is_public: true,
            is_active: true
          }
        ];
      }
      setQuizzes(quizzesData || []);

      // Load challenges
      let challengesData;
      try {
        const { data } = await (supabase as any)
          .from("challenges")
          .select("*")
          .eq("is_public", true)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(20);
        challengesData = data;
      } catch (error) {
        console.warn("Challenges table not available yet, using sample data");
        challengesData = [
          {
            id: "1",
            title: "7-Day Mindfulness Challenge",
            description: "Build a daily mindfulness practice over one week",
            challenge_type: "habit_formation",
            category: "Wellness",
            difficulty_level: "easy",
            duration_days: 7,
            reward_crystals: 50,
            is_public: true,
            is_active: true
          },
          {
            id: "2",
            title: "Gratitude Journal Challenge",
            description: "Write down three things you're grateful for each day",
            challenge_type: "daily",
            category: "Personal Growth",
            difficulty_level: "easy",
            duration_days: 30,
            reward_crystals: 100,
            is_public: true,
            is_active: true
          }
        ];
      }
      setChallenges(challengesData || []);

      // Load user stats
      let statsData;
      try {
        const { data } = await (supabase as any)
          .from("user_assessment_stats")
          .select("*")
          .eq("user_id", user.id)
          .single();
        statsData = data;
      } catch (error) {
        console.warn("User assessment stats not available yet");
        statsData = {
          total_assessments_completed: 0,
          total_quizzes_completed: 0,
          total_challenges_completed: 0,
          average_assessment_score: 0,
          average_quiz_score: 0,
          current_streak: 0,
          longest_streak: 0,
          total_ai_interactions: 0
        };
      }
      setUserStats(statsData);

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

  const startQuiz = (quiz: Quiz) => {
    navigate(`/quiz/${quiz.id}`);
  };

  const joinChallenge = (challenge: Challenge) => {
    navigate(`/challenge/${challenge.id}`);
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assessments">
              <Brain className="w-4 h-4 mr-2" />
              Assessments
            </TabsTrigger>
            <TabsTrigger value="quizzes">
              <Target className="w-4 h-4 mr-2" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger value="challenges">
              <Trophy className="w-4 h-4 mr-2" />
              Challenges
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

          <TabsContent value="quizzes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Quizzes</CardTitle>
                <CardDescription>
                  Test your knowledge with AI-graded quizzes and instant feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                {quizzes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No quizzes available yet</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map((quiz) => (
                      <Card key={quiz.id} className="hover:shadow-lg transition-all cursor-pointer border-2 border-accent/20">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className="capitalize">
                              {quiz.category}
                            </Badge>
                            <Badge className={getDifficultyColor(quiz.difficulty_level)}>
                              {quiz.difficulty_level}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{quiz.title}</CardTitle>
                          <CardDescription>{quiz.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            {quiz.time_limit_minutes && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{quiz.time_limit_minutes} min limit</span>
                              </div>
                            )}
                          </div>

                          <Button
                            onClick={() => startQuiz(quiz)}
                            className="w-full clay-button bg-gradient-to-r from-accent to-primary"
                          >
                            Start Quiz
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="challenges" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Growth Challenges</CardTitle>
                <CardDescription>
                  Participate in guided challenges with AI-powered coaching and feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                {challenges.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No challenges available yet</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {challenges.map((challenge) => (
                      <Card key={challenge.id} className="hover:shadow-lg transition-all cursor-pointer border-2 border-purple-500/20">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className="capitalize">
                              {challenge.challenge_type.replace('_', ' ')}
                            </Badge>
                            <Badge className={getDifficultyColor(challenge.difficulty_level)}>
                              {challenge.difficulty_level}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{challenge.title}</CardTitle>
                          <CardDescription>{challenge.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{challenge.duration_days} days</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span>{challenge.reward_crystals} crystals</span>
                            </div>
                          </div>

                          <Button
                            onClick={() => joinChallenge(challenge)}
                            className="w-full clay-button bg-gradient-to-r from-purple-500 to-pink-500"
                          >
                            Join Challenge
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