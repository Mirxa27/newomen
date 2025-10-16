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
import { trackDailyLogin } from "@/lib/features/assessment/gamification-events";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading, getDisplayName } = useUserProfile();
  const [affirmation, setAffirmation] = useState("You are capable of amazing things.");

  useEffect(() => {
    if (profile) {
      // Track daily login after profile is loaded
      void trackDailyLogin(profile.user_id!);
    }
    
    // Set a random affirmation from a predefined list
    const affirmations = [
      "You are capable of amazing things.",
      "Your journey is unique and beautiful.",
      "Every day is a new opportunity for growth.",
      "You have the power to create positive change.",
      "Your potential is limitless.",
      "Small steps lead to big transformations.",
      "You are worthy of love and happiness.",
      "Your strength is greater than any challenge."
    ];
    
    const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
    setAffirmation(randomAffirmation);

  }, [profile]);

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

  // Default level progression (simplified without database dependency)
  const crystalsNeededForNextLevel = Math.max(0, (currentLevel * 100) - currentCrystalBalance);
  const levelProgressPercentage = Math.min(100, (currentCrystalBalance / (currentLevel * 100)) * 100);

  const displayName = getDisplayName();

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6">
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
          className="glass-card hover:shadow-lg transition-all cursor-pointer border-2 border-accent bg-gradient-to-br from-primary/10 to-accent/10 clay-card hover:scale-102"
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
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer clay-card hover:scale-102"
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
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer clay-card hover:scale-102"
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
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer clay-card hover:scale-102"
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
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer clay-card hover:scale-102"
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
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer clay-card hover:scale-102"
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
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer clay-card hover:scale-102"
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
