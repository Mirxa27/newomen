import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/features/auth/useAuth";
import { HabitTrackerService } from "@/services/features/wellness/HabitTrackerService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Badge } from "@/components/shared/ui/badge";
import { Flame, Plus, Check } from "lucide-react";
import { toast } from "sonner";

interface HabitData {
  id: string;
  title: string;
  category: string;
  current_streak: number;
  longest_streak: number;
}

export default function HabitTrackerWidget() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadHabits();
    }
  }, [user?.id]);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const data = await HabitTrackerService.getUserHabits(user!.id);
      setHabits(data as HabitData[]);
    } catch (error) {
      console.error("Error loading habits:", error);
      toast.error("Failed to load habits");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteHabit = async (habitId: string) => {
    try {
      await HabitTrackerService.logHabitCompletion(habitId, user!.id);
      await loadHabits();
      toast.success("Great job! Habit completed");
    } catch (error) {
      console.error("Error completing habit:", error);
      toast.error("Failed to log habit");
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">Loading habits...</div>
      ) : habits.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No habits yet</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Habit
            </Button>
          </CardContent>
        </Card>
      ) : (
        habits.map(habit => (
          <Card key={habit.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{habit.title}</CardTitle>
                  <Badge variant="outline" className="mt-2">{habit.category}</Badge>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleCompleteHabit(habit.id)}
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Current Streak</p>
                  <div className="flex items-center gap-1 justify-center mt-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-lg">{habit.current_streak}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Best Streak</p>
                  <p className="font-bold text-lg mt-1">{habit.longest_streak}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
