import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import GamificationDisplay from "@/components/features/community/GamificationDisplay";
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
import { useToast } from "@/hooks/shared/ui/use-toast";
import { useUserProfile } from "@/hooks/features/auth/useUserProfile";
import type { Database } from "@/integrations/supabase/types";
import { trackDailyLogin } from "@/lib/features/assessment/gamification-events";
import { AffirmationService } from "@/services/features/wellness/AffirmationService";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading, getDisplayName } = useUserProfile();
  const [levelThresholds, setLevelThresholds] = useState<Database["public"]["Tables"]["level_thresholds"]["Row"][]>([]);
  const [affirmation, setAffirmation] = useState("");

  useEffect(() => {
    const loadGamificationData = async () => {
      if (!profile) return;

      try {
        const { data: thresholdsData, error: thresholdsError } = await supabase
          .from("level_thresholds")
          .select("*")
          .order("level", { ascending: true });

        if (thresholdsError) {
          throw thresholdsError;
        }

        setLevelThresholds(thresholdsData);
        // Track daily login after profile is loaded
        void trackDailyLogin(profile.user_id!);
      } catch (error) {
        console.error("Error loading gamification data:", error);
        toast({
          title: "Unable to load gamification data",
          description: "Some features may not work correctly.",
          variant: "destructive",
        });
      }
    };

    if (profile) {
      void loadGamificationData();
    }
    
    const loadAffirmation = async () => {
      try {
        const todayAffirmation = await AffirmationService.getTodaysAffirmation();
        if (todayAffirmation) {
          setAffirmation(todayAffirmation.content);
        } else {
          setAffirmation("You are capable of amazing things.");
        }
      } catch (error) {
        console.error("Failed to load affirmation", error);
        setAffirmation("Your journey is unique and beautiful.");
      }
    };

    void loadAffirmation();

  }, [profile, toast]);

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


  const displayName = getDisplayName();

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header - Mobile optimized */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-6">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text line-clamp-2">
              Welcome back, {displayName}!
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground flex items-center gap-1 sm:gap-2 line-clamp-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-accent shrink-0" />
              <span>{affirmation}</span>
            </p>
          </div>
          <Button variant="outline" className="glass w-full sm:w-auto h-10 sm:h-auto" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            <span className="text-sm sm:text-base">Sign Out</span>
          </Button>
        </div>

        {/* Gamification Display */}
        <GamificationDisplay
          crystalBalance={currentCrystalBalance}
          currentLevel={currentLevel}
          dailyStreak={dailyStreak}
          crystalsToNextLevel={crystalsNeededForNextLevel}
          levelProgressPercentage={levelProgressPercentage}
        />

        {/* Featured: Narrative Identity Exploration - Mobile responsive */}
        <Card
          className="glass-card hover:shadow-lg transition-all cursor-pointer border-2 border-accent bg-gradient-to-br from-primary/10 to-accent/10"
          onClick={() => navigate("/narrative-exploration")}
        >
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="clay w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary to-accent shrink-0">
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-lg sm:text-xl md:text-2xl gradient-text line-clamp-2">Discover Your Narrative Identity</CardTitle>
                  <CardDescription className="text-xs sm:text-sm md:text-base mt-1 line-clamp-2">
                    Take a guided journey through 10 questions to understand your personal story
                  </CardDescription>
                </div>
              </div>
              <Button className="clay-button bg-gradient-to-r from-primary to-accent w-full sm:w-auto h-9 sm:h-10 md:h-auto text-sm sm:text-base mt-2 sm:mt-0 shrink-0">Begin Journey</Button>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Access Grid - Fully responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Card
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/chat")}
          >
            <CardHeader className="p-4 sm:p-5 md:p-6">
              <div className="clay w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <CardTitle className="text-base sm:text-lg">Start Conversation</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Talk with your AI companion</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/member-assessments")}
          >
            <CardHeader className="p-4 sm:p-5 md:p-6">
              <div className="clay w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <CardTitle className="text-base sm:text-lg">Assessments</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Explore your personality and growth areas</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/couples-challenge")}
          >
            <CardHeader className="p-4 sm:p-5 md:p-6">
              <div className="clay w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <CardTitle className="text-base sm:text-lg">Couple's Challenge</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Connect deeper with your partner</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/community")}
          >
            <CardHeader className="p-4 sm:p-5 md:p-6">
              <div className="clay w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <CardTitle className="text-base sm:text-lg">Community</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Connect with others on the same journey</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/wellness-library")}
          >
            <CardHeader className="p-4 sm:p-5 md:p-6">
              <div className="clay w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <CardTitle className="text-base sm:text-lg">Wellness Library</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Access guided meditations and more</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/profile")}
          >
            <CardHeader className="p-4 sm:p-5 md:p-6">
              <div className="clay w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <CardTitle className="text-base sm:text-lg">My Profile</CardTitle>
              <CardDescription className="text-xs sm:text-sm">View achievements and progress</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;