import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/features/auth/useAuth';
import { HabitTrackerService } from '@/services/features/wellness/HabitTrackerService';
import type { Habit, HabitLog } from '@/services/features/wellness/HabitTrackerService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/shared/ui/dialog';
import { toast } from 'sonner';
import { Zap, PlusCircle, CheckCircle } from 'lucide-react';

export default function HabitTracker() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHabitName, setNewHabitName] = useState("");

  const loadHabits = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const habitsData = await HabitTrackerService.getUserHabitsWithLogs(user.id, 7);
      setHabits(habitsData);
    } catch (error) {
      console.error("Error loading habits:", error);
      toast.error("Failed to load habits.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleAddHabit = async () => {
    if (!user?.id || !newHabitName.trim()) return;
    try {
      await HabitTrackerService.createHabit(user.id, newHabitName.trim());
      toast.success(`Habit "${newHabitName.trim()}" added!`);
      setNewHabitName("");
      loadHabits();
    } catch (error) {
      toast.error("Failed to add habit.");
    }
  };

  const handleLogCompletion = async (habitId: string) => {
    if (!user?.id) return;
    try {
      await HabitTrackerService.logHabitCompletion(habitId, user.id);
      toast.success("Habit logged for today!");
      loadHabits();
    } catch (error) {
      toast.error("Failed to log habit completion.");
    }
  };

  const isLoggedToday = (logs: HabitLog[]): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return logs.some(log => log.completed_at.startsWith(today));
  };

  return (
    <div className="space-y-6">
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            Add New Habit
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Habit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="e.g., Meditate for 10 minutes"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
            />
            <Button onClick={handleAddHabit} className="w-full">Add Habit</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p>Loading habits...</p>
        ) : (
          habits.map(habit => (
            <Card key={habit.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{habit.name}</span>
                  <Button
                    size="icon"
                    variant={isLoggedToday(habit.logs || []) ? "ghost" : "outline"}
                    onClick={() => handleLogCompletion(habit.id)}
                    disabled={isLoggedToday(habit.logs || [])}
                  >
                    <CheckCircle className={`w-5 h-5 ${isLoggedToday(habit.logs || []) ? 'text-green-500' : ''}`} />
                  </Button>
                </CardTitle>
                <CardDescription>Streak: {habit.streak || 0} days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-1">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateString = date.toISOString().split('T')[0];
                    const logged = (habit.logs || []).some(log => log.completed_at.startsWith(dateString));
                    return (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-sm ${logged ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                        title={date.toLocaleDateString()}
                      />
                    );
                  }).reverse()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}





