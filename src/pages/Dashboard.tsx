import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { trackDailyLogin } from "@/lib/gamification-events";
import { Loader2, Brain, Heart, Users, Award, TrendingUp, BookOpen, MessageCircle, Zap } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type LevelThreshold = Database["public"]["Tables"]["level_thresholds"]['Row'];

export default function Dashboard() {
  const { toast } = useToast();
  const { profile, loading, getDisplayName } = useUserProfile();
  const [levelThresholds, setLevelThresholds] = useState<LevelThreshold[]>([]);
  const [affirmation, setAffirmation] = useState("");
  const navigate = useNavigate();

  const fetchLevelThresholds = useCallback(async () => {
    const { data, error } = await supabase
      .from("level_thresholds")
      .select("*")
      .order("level", { ascending: true });
    if (error) {
      console.error("Error fetching level thresholds:", error);
      toast({
        title: "Error",
        description: "Failed to load level thresholds.",
        variant: "destructive",
      });
    } else {
      setLevelThresholds(data || []);
    }
  }, [toast]);

  const fetchAffirmation = useCallback(async () => {
    const { data, error } = await supabase
      .from("affirmations")
      .select("content")
      .limit(1)
      .single();
    if (error) {
      console.error("Error fetching affirmation:", error);
    } else {
      setAffirmation(data?.content || "You are capable of amazing things!");
    }
  }, []);

  useEffect(() => {
    if (profile?.user_id) { // Use optional chaining for profile
      // Track daily login after profile is loaded
      void trackDailyLogin(profile.user_id);
    }
    void fetchLevelThresholds();
    void fetchAffirmation();
  }, [profile, fetchLevelThresholds, fetchAffirmation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to NewMe</h1>
        <p className="text-muted-foreground mb-6">Please log in or sign up to continue your journey.</p>
        <Button onClick={() => navigate("/auth")}>Get Started</Button>
      </div>
    );
  }

  const currentCrystalBalance = profile.crystal_balance || 0;
  const currentLevel = profile.current_level || 1;
  const dailyStreak = profile.daily_streak || 0;

  const nextLevelThreshold = levelThresholds.find(
    (threshold) => threshold.level === currentLevel + 1
  );
  const progressToNextLevel = nextLevelThreshold
    ? (currentCrystalBalance / nextLevelThreshold.crystals_required) * 100
    : 100;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold gradient-text">Welcome, {getDisplayName()}!</h1>
          <Button variant="outline" onClick={() => navigate("/chat")}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Start Chat
          </Button>
        </div>

        {/* Daily Affirmation */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-2xl">Daily Affirmation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg italic text-muted-foreground">"{affirmation}"</p>
          </CardContent>
        </Card>

        {/* Gamification Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crystals</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentCrystalBalance}</div>
              <p className="text-xs text-muted-foreground">Earned through activities</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Level {currentLevel}</div>
              <Progress value={progressToNextLevel} className="h-2 mt-2" />
              {nextLevelThreshold && (
                <p className="text-xs text-muted-foreground mt-1">
                  {nextLevelThreshold.crystals_required - currentCrystalBalance} crystals to next level
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Streak</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailyStreak} days</div>
              <p className="text-xs text-muted-foreground">Keep coming back!</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/assessments">
            <Card className="glass-card hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">AI Assessments</CardTitle>
                <Brain className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <CardDescription>Discover insights about yourself with AI-generated analysis.</CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Link to="/couples-challenge">
            <Card className="glass-card hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Couples Challenges</CardTitle>
                <Users className="h-5 w-5 text-pink-500" />
              </CardHeader>
              <CardContent>
                <CardDescription>Strengthen your relationship with guided interactive challenges.</CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Link to="/wellness-library">
            <Card className="glass-card hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Wellness Library</CardTitle>
                <BookOpen className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <CardDescription>Access guided meditations, audio content, and resources.</CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity / Recommendations (Placeholder) */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Your Journey</CardTitle>
            <CardDescription>Recent activities and personalized recommendations.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity yet. Start exploring!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}