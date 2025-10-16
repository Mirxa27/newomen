import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/features/auth/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shared/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Heart, Brain, Sparkles, Book, Wand2, Zap, Infinity as InfinityIcon } from "lucide-react";
import { MeditationService } from "@/services/features/wellness/MeditationService";
import { AffirmationService } from "@/services/features/wellness/AffirmationService";
import { HabitTrackerService } from "@/services/features/wellness/HabitTrackerService";
import { DiaryService } from "@/services/features/wellness/DiaryService";
import { CardReadingService } from "@/services/features/wellness/CardReadingService";
import MeditationLibrary from "@/components/features/wellness/MeditationLibrary";
import Affirmations from "@/components/features/wellness/Affirmations";
import HabitTracker from "@/components/features/wellness/HabitTracker";
import Diaries from "@/components/features/wellness/Diaries";
import CardReading from "@/components/features/wellness/CardReading";
import AudioLibrary from "@/components/features/wellness/AudioLibrary";
import MeditationRecipes from "@/components/features/wellness/MeditationRecipes";
import CommunityFeed from "@/components/features/community/CommunityFeed";

export default function WellnessHub() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("meditations");
  const [stats, setStats] = useState<{
    meditationStats: { totalSessions: number; totalMinutes: number; } | null;
    habitStats: { totalHabits: number; averageCompletion: number; } | null;
    diaryStats: { totalGratitudeEntries: string; totalStateEntries: string; averageMood: number; } | null;
  }>({
    meditationStats: null,
    habitStats: null,
    diaryStats: null,
  });
  const [todayAffirmation, setTodayAffirmation] = useState<{ content: string; category: string; } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = React.useCallback(async () => {
    if (!user) return;
    try {
      const [meditationStats, habitStats, diaryStats] = await Promise.all([
        MeditationService.getMeditationStats(user.id),
        HabitTrackerService.getHabitStats(user.id),
        DiaryService.getUserDiaryStats(user.id),
      ]);

      setStats({
        meditationStats,
        habitStats,
        diaryStats,
      });
    } catch (error) {
      console.error("Error loading wellness stats:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadTodayAffirmation = React.useCallback(async () => {
    if (!user) return;
    try {
      const affirmation = await AffirmationService.getTodaysAffirmation();
      setTodayAffirmation(affirmation);
    } catch (error) {
      console.error("Error loading today's affirmation:", error);
    }
  }, [user]);

  React.useEffect(() => {
    loadStats();
    loadTodayAffirmation();
  }, [loadStats, loadTodayAffirmation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-2">
            Wellness Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your personal sanctuary for meditation, affirmations, habits, and personal growth
          </p>
        </div>

        {/* Today's Affirmation Banner */}
        {todayAffirmation && (
          <Card className="mb-8 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
                <CardTitle>Today's Affirmation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg italic text-gray-700 dark:text-gray-300">
                "{todayAffirmation.content}"
              </p>
              {todayAffirmation.category && (
                <p className="text-sm text-gray-500 mt-2">Category: {todayAffirmation.category}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                Meditation Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Sessions:</span>
                  <span className="font-bold">{stats.meditationStats?.totalSessions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Minutes:</span>
                  <span className="font-bold">{stats.meditationStats?.totalMinutes || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                Habit Streaks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Habits:</span>
                  <span className="font-bold">{stats.habitStats?.totalHabits || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Streak:</span>
                  <span className="font-bold">
                    {stats.habitStats?.averageCompletion?.toFixed(1) || 0} days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Wellness Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Diary Entries:</span>
                  <span className="font-bold">
                    {(
                      parseInt(stats.diaryStats?.totalGratitudeEntries || "0") +
                      parseInt(stats.diaryStats?.totalStateEntries || "0")
                    ).toString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Mood:</span>
                  <span className="font-bold">{stats.diaryStats?.averageMood}/10</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Features Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 w-full mb-6">
            <TabsTrigger value="meditations" className="flex items-center gap-1">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Meditations</span>
            </TabsTrigger>
            <TabsTrigger value="affirmations" className="flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Affirmations</span>
            </TabsTrigger>
            <TabsTrigger value="habits" className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Habits</span>
            </TabsTrigger>
            <TabsTrigger value="diaries" className="flex items-center gap-1">
              <Book className="w-4 h-4" />
              <span className="hidden sm:inline">Diaries</span>
            </TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center gap-1">
              <Wand2 className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Audio</span>
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex items-center gap-1">
              <InfinityIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Recipes</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
          </TabsList>

          {/* Meditations Tab */}
          <TabsContent value="meditations">
            <MeditationLibrary />
          </TabsContent>

          {/* Affirmations Tab */}
          <TabsContent value="affirmations">
            <Affirmations />
          </TabsContent>

          {/* Habits Tab */}
          <TabsContent value="habits">
            <HabitTracker />
          </TabsContent>

          {/* Diaries Tab */}
          <TabsContent value="diaries">
            <Diaries />
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards">
            <CardReading />
          </TabsContent>

          {/* Audio Tab */}
          <TabsContent value="audio">
            <AudioLibrary />
          </TabsContent>

          {/* Recipes Tab */}
          <TabsContent value="recipes">
            <MeditationRecipes />
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community">
            <CommunityFeed />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
