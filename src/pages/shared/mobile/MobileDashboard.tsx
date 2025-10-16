import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card';
import GamificationDisplay from '@/components/features/community/GamificationDisplay';
import MobileTouchOptimizer from '@/components/shared/layout/MobileTouchOptimizer';
import MobileResponsiveGrid from '@/components/shared/layout/MobileResponsiveGrid';
import {
  Sparkles,
  MessageSquare,
  Target,
  Users,
  BookOpen,
  Heart,
  LogOut,
  Zap,
  TrendingUp,
  Calendar,
  Award,
} from 'lucide-react';
import { useToast } from '@/hooks/shared/ui/use-toast';
import { useUserProfile } from '@/hooks/features/auth/useUserProfile';
import type { Database } from '@/integrations/supabase/types';
import { trackDailyLogin } from '@/lib/features/assessment/gamification-events';

const AFFIRMATIONS = [
  "You are capable of amazing things. Every step forward is progress.",
  "Your journey is unique and beautiful.",
  "Today is filled with possibilities for growth.",
  "You have the strength to overcome any challenge.",
  "Your potential is limitless.",
];

type DashboardTab = 'overview' | 'progress' | 'achievements';

const MobileDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading, getDisplayName } = useUserProfile();
  const [levelThresholds, setLevelThresholds] = useState<Database["public"]["Tables"]["level_thresholds"]["Row"][]>([]);
  const [affirmation, setAffirmation] = useState("");
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

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
    setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
  }, [profile, toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-lg">Loading your journey...</p>
        </motion.div>
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

  const quickActions = [
    {
      title: "AI Chat",
      description: "Start a conversation",
      icon: MessageSquare,
      path: "/chat",
      color: "bg-blue-500/20 text-blue-400",
    },
    {
      title: "Assessments",
      description: "Take a self-discovery quiz",
      icon: Target,
      path: "/member-assessments",
      color: "bg-green-500/20 text-green-400",
    },
    {
      title: "Community",
      description: "Connect with others",
      icon: Users,
      path: "/community",
      color: "bg-purple-500/20 text-purple-400",
    },
    {
      title: "Wellness Library",
      description: "Explore resources",
      icon: BookOpen,
      path: "/wellness-library",
      color: "bg-orange-500/20 text-orange-400",
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-2xl font-bold gradient-text">
          Welcome back, {getDisplayName()}!
        </h1>
        <p className="text-muted-foreground text-sm">
          {affirmation}
        </p>
      </motion.div>

      {/* Gamification Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <GamificationDisplay
          crystalBalance={currentCrystalBalance}
          currentLevel={currentLevel}
          dailyStreak={dailyStreak}
          crystalsNeededForNextLevel={crystalsNeededForNextLevel}
          crystalsEarnedInCurrentLevel={crystalsEarnedInCurrentLevel}
        />
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex bg-muted/20 rounded-2xl p-1"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <MobileTouchOptimizer key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            </MobileTouchOptimizer>
          );
        })}
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Quick Actions */}
              <MobileResponsiveGrid columns={{ mobile: 2, tablet: 2, desktop: 4 }}>
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <MobileTouchOptimizer key={action.title}>
                      <Card
                        className="glass-card hover:scale-105 transition-all duration-300 cursor-pointer border-0"
                        onClick={() => navigate(action.path)}
                      >
                        <CardContent className="p-4 text-center space-y-3">
                          <div className={`w-12 h-12 rounded-2xl ${action.color} flex items-center justify-center mx-auto`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{action.title}</h3>
                            <p className="text-xs text-muted-foreground">{action.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </MobileTouchOptimizer>
                  );
                })}
              </MobileResponsiveGrid>

              {/* Daily Affirmation Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass-card border-0">
                  <CardContent className="p-6 text-center">
                    <Heart className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Daily Affirmation</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {affirmation}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-4">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Level</span>
                    <span className="font-semibold">Level {currentLevel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Crystal Balance</span>
                    <span className="font-semibold text-primary">{currentCrystalBalance}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Daily Streak</span>
                    <span className="font-semibold text-green-400">{dailyStreak} days</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No achievements yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Complete activities to earn achievements!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Sign Out Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="pt-4"
      >
        <MobileTouchOptimizer>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full glass-card border-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </MobileTouchOptimizer>
      </motion.div>
    </div>
  );
};

export default MobileDashboard;
