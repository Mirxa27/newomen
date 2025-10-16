import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/features/auth/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shared/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Heart, Brain, Sparkles, Book, Wand2, Zap, Infinity as InfinityIcon, BookOpen } from "lucide-react";
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
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Header - Mobile responsive */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-1 sm:mb-2">
            Wellness Hub
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
            Your personal sanctuary for meditation, affirmations, habits, and personal growth
          </p>
        </div>

        {/* Today's Affirmation Banner - Mobile responsive */}
        {todayAffirmation && (
          <Card className="mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                <CardTitle className="text-base sm:text-lg">Today's Affirmation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
              <p className="text-sm sm:text-base md:text-lg italic text-gray-700 dark:text-gray-300 line-clamp-4">
                "{todayAffirmation.content}"
              </p>
              {todayAffirmation.category && (
                <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">Category: {todayAffirmation.category}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Stats - Mobile responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                Meditation Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Sessions:</span>
                  <span className="font-bold">{stats.meditationStats?.totalSessions || 0}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Minutes:</span>
                  <span className="font-bold">{stats.meditationStats?.totalMinutes || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                Habit Streaks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Active Habits:</span>
                  <span className="font-bold">{stats.habitStats?.totalHabits || 0}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Avg Streak:</span>
                  <span className="font-bold">
                    {stats.habitStats?.averageCompletion?.toFixed(1) || 0} days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                Journal Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Entries:</span>
                  <span className="font-bold">{stats.diaryStats?.totalGratitudeEntries || 0}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Avg Mood:</span>
                  <span className="font-bold">{stats.diaryStats?.averageMood?.toFixed(1) || 0}/10</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs - Mobile responsive */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 mb-4 sm:mb-6">
            <TabsTrigger value="meditations" className="text-xs sm:text-sm">🧘 Meditations</TabsTrigger>
            <TabsTrigger value="affirmations" className="text-xs sm:text-sm">✨ Affirmations</TabsTrigger>
            <TabsTrigger value="habits" className="text-xs sm:text-sm">🔥 Habits</TabsTrigger>
            <TabsTrigger value="diaries" className="hidden sm:inline-flex text-xs sm:text-sm">📔 Diaries</TabsTrigger>
            <TabsTrigger value="cards" className="hidden lg:inline-flex text-xs sm:text-sm">🃏 Cards</TabsTrigger>
            <TabsTrigger value="audio" className="hidden lg:inline-flex text-xs sm:text-sm">🎵 Audio</TabsTrigger>
            <TabsTrigger value="recipes" className="hidden lg:inline-flex text-xs sm:text-sm">♾️ Recipes</TabsTrigger>
            <TabsTrigger value="community" className="hidden lg:inline-flex text-xs sm:text-sm">🤝 Community</TabsTrigger>
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
