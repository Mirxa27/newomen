import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/features/auth/useAuth';
import { DiaryService } from '@/services/features/wellness/DiaryService';
import type { GratitudeEntry, StateEntry } from '@/services/features/wellness/DiaryService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Textarea } from '@/components/shared/ui/textarea';
import { toast } from 'sonner';
import { Book, Heart, Smile } from 'lucide-react';
import { Label } from '@/components/shared/ui/label';
import { Input } from '@/components/shared/ui/input';

export default function Diaries() {
  const { user } = useAuth();
  const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>([]);
  const [stateEntries, setStateEntries] = useState<StateEntry[]>([]);
  const [newGratitude, setNewGratitude] = useState('');
  const [newState, setNewState] = useState('');
  const [mood, setMood] = useState(5);
  const [loading, setLoading] = useState(true);

  const loadDiaries = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [gratitudeData, stateData] = await Promise.all([
        DiaryService.getGratitudeEntries(user.id, 5),
        DiaryService.getStateEntries(user.id, 5)
      ]);
      setGratitudeEntries(gratitudeData);
      setStateEntries(stateData);
    } catch (error) {
      console.error("Error loading diary entries:", error);
      toast.error("Failed to load diary entries.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDiaries();
  }, [loadDiaries]);

  const handleAddGratitude = async () => {
    if (!user?.id || !newGratitude.trim()) return;
    try {
      await DiaryService.addGratitudeEntry(user.id, newGratitude.trim());
      toast.success("Gratitude entry added!");
      setNewGratitude('');
      loadDiaries();
    } catch (error) {
      toast.error("Failed to add gratitude entry.");
    }
  };
  
  const handleAddState = async () => {
    if (!user?.id || !newState.trim()) return;
    try {
      await DiaryService.addStateEntry(user.id, newState.trim(), mood);
      toast.success("State entry added!");
      setNewState('');
      setMood(5);
      loadDiaries();
    } catch (error) {
      toast.error("Failed to add state entry.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gratitude Diary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5 text-pink-500" />Gratitude Journal</CardTitle>
          <CardDescription>What are you grateful for today?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="I am grateful for..."
            value={newGratitude}
            onChange={(e) => setNewGratitude(e.target.value)}
          />
          <Button onClick={handleAddGratitude} className="w-full">Add Gratitude</Button>
          <div className="space-y-2">
            <h4 className="font-semibold">Recent Entries:</h4>
            {loading ? <p>Loading...</p> : gratitudeEntries.map(entry => (
              <div key={entry.id} className="p-2 border rounded-md text-sm">
                {entry.content}
                <p className="text-xs text-muted-foreground mt-1">{new Date(entry.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* State of Being Diary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Smile className="w-5 h-5 text-yellow-500" />State of Being</CardTitle>
          <CardDescription>Check in with your feelings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="How are you feeling right now?"
            value={newState}
            onChange={(e) => setNewState(e.target.value)}
          />
          <div className="space-y-2">
            <Label>Mood (1-10): {mood}</Label>
            <Input type="range" min="1" max="10" value={mood} onChange={(e) => setMood(Number(e.target.value))} />
          </div>
          <Button onClick={handleAddState} className="w-full">Add State Entry</Button>
          <div className="space-y-2">
            <h4 className="font-semibold">Recent Entries:</h4>
            {loading ? <p>Loading...</p> : stateEntries.map(entry => (
              <div key={entry.id} className="p-2 border rounded-md text-sm">
                <p>Mood: {entry.mood_rating}/10</p>
                <p>{entry.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(entry.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





