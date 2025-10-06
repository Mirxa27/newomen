import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GamificationDisplay from "@/components/GamificationDisplay";
import {
  Sparkles,
  MessageSquare,
  Target,
  Users,
  BookOpen,
  Heart,
  LogOut,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { trackDailyLogin } from "@/lib/gamification-events";

const AFFIRMATIONS = [
  "You are capable of amazing things. Every step forward is progress.",
  "Your journey is unique and beautiful.",
  "Today is filled with possibilities for growth.",
  "You have the strength to overcome any challenge.",
  "Your potential is limitless.",
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Tables<"user_profiles"> | null>(null);
  const [levelThresholds, setLevelThresholds] = useState<Tables<"level_thresholds">[]>([]);
  const [affirmation, setAffirmation] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfileAndGamificationData = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/auth");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        const { data: thresholdsData, error: thresholdsError } = await supabase
          .from("level_thresholds")
          .select("*")
          .order("level", { ascending: true });

        if (thresholdsError) {
          throw thresholdsError;
        }

        if (isMounted) {
          setProfile(profileData);
          setLevelThresholds(thresholdsData);
          // Track daily login after profile is loaded
          void trackDailyLogin(user.id);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast({
          title: "Unable to load dashboard data",
          description: "Please refresh or try signing in again.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadProfileAndGamificationData();
    setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);

    return () => {
      isMounted = false;
    };
  }, [navigate, toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8">
          <p>Loading your journey...</p>
        </div>
      </div>
    );
  }

  const currentCrystalBalance = profile?.crystal_balance || 0;
  const currentLevel = profile?.current_level || 1;
  const dailyStreak = profile?.daily_streak || 0;

  const nextLevelThreshold = levelThresholds.find(
    (threshold) => threshold.level === currentLevel + 1
  );
  const currentLevelThreshold = levelThresholds.find(
    (threshold) => threshold.level === currentLevel
  );

  const crystalsNeededForNextLevel = nextLevelThreshold
    ? nextLevelThreshold.crystals_required - currentCrystalBalance
    : 0;

  const crystalsEarnedInCurrentLevel = currentCrystalBalance - (currentLevelThreshold?.crystals_required || 0);
  const crystalsRequiredForCurrentLevelUp = (nextLevelThreshold?.crystals_required || 0) - (currentLevelThreshold?.crystals_required || 0);

  const levelProgressPercentage =
    crystalsRequiredForCurrentLevelUp > 0
      ? (crystalsEarnedInCurrentLevel / crystalsRequiredForCurrentLevelUp) * 100
      : 0;


  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold gradient-text">
              Welcome back, {profile?.nickname || "Friend"}!
            </h1>
            <p className="text-xl text-muted-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" /> 
              <span>{affirmation}</span>
            </p>
          </div>
          <Button variant="outline" className="glass" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <GamificationDisplay
          crystalBalance={currentCrystalBalance}
          currentLevel={currentLevel}
          dailyStreak={dailyStreak}
          crystalsToNextLevel={crystalsNeededForNextLevel}
          levelProgressPercentage={levelProgressPercentage}
        />

        {/* Featured: Narrative Identity Exploration */}
        <Card
          className="glass-card hover:shadow-lg transition-all cursor-pointer border-2 border-accent bg-gradient-to-br from-primary/10 to-accent/10"
          onClick={() => navigate("/narrative-exploration")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="clay w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary to-accent">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl gradient-text">Discover Your Narrative Identity</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Take a guided journey through 10 questions to understand your personal story
                  </CardDescription>
                </div>
              </div>
              <Button className="clay-button bg-gradient-to-r from-primary to-accent">Begin Journey</Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/chat")}
          >
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Start Conversation</CardTitle>
              <CardDescription>Talk with your AI companion</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/member-assessments")}
          >
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Assessments</CardTitle>
              <CardDescription>Explore your personality and growth areas</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/couples-challenge")}
          >
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Couple's Challenge</CardTitle>
              <CardDescription>Connect deeper with your partner</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/community")}
          >
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Community</CardTitle>
              <CardDescription>Connect with others on the same journey</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/wellness-library")}
          >
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Wellness Library</CardTitle>
              <CardDescription>Access guided meditations and more</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/profile")}
          >
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>View achievements and progress</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;