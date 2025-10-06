import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Loader2, Gem, TrendingUp } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type GamificationSetting = Tables<'gamification_settings'>;

export default function GamificationSettings() {
  const [settings, setSettings] = useState<GamificationSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gamification_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for initial load
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // Initialize default settings if none exist
        setSettings({
          id: 'default', // Assuming a single row with a fixed ID
          crystal_reward_session: 10,
          crystal_reward_assessment: 20,
          crystal_reward_challenge: 15,
          level_threshold_1: 100,
          level_threshold_2: 250,
          level_threshold_3: 500,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error loading gamification settings:', error);
      toast.error('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const { id, created_at, ...updatePayload } = settings; // Exclude id and created_at for update

      const { error } = await supabase
        .from('gamification_settings')
        .upsert({ ...updatePayload, id: 'default', updated_at: new Date().toISOString() }, { onConflict: 'id' });

      if (error) throw error;

      toast.success('Gamification settings saved successfully!');
      loadSettings(); // Reload to ensure consistency
    } catch (error) {
      console.error('Error saving gamification settings:', error);
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setSettings((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [id]: type === 'number' ? parseInt(value, 10) : value,
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No gamification settings found or initialized.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold gradient-text">Gamification Settings</h1>
      <p className="text-muted-foreground">
        Configure Crystal rewards for user actions and define level progression thresholds.
      </p>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 gradient-text">
            <Gem className="w-5 h-5" />
            Crystal Rewards
          </CardTitle>
          <CardDescription>Set the number of Crystals users earn for various activities.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="crystal_reward_session">Crystals per Session</Label>
            <Input
              id="crystal_reward_session"
              type="number"
              value={settings.crystal_reward_session}
              onChange={handleChange}
              min="0"
              className="glass"
            />
          </div>
          <div>
            <Label htmlFor="crystal_reward_assessment">Crystals per Assessment Completion</Label>
            <Input
              id="crystal_reward_assessment"
              type="number"
              value={settings.crystal_reward_assessment}
              onChange={handleChange}
              min="0"
              className="glass"
            />
          </div>
          <div>
            <Label htmlFor="crystal_reward_challenge">Crystals per Challenge Completion</Label>
            <Input
              id="crystal_reward_challenge"
              type="number"
              value={settings.crystal_reward_challenge}
              onChange={handleChange}
              min="0"
              className="glass"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 gradient-text">
            <TrendingUp className="w-5 h-5" />
            Level Thresholds
          </CardTitle>
          <CardDescription>Define the Crystal amounts required to reach each user level.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="level_threshold_1">Level 1 Threshold (Crystals)</Label>
            <Input
              id="level_threshold_1"
              type="number"
              value={settings.level_threshold_1}
              onChange={handleChange}
              min="0"
              className="glass"
            />
          </div>
          <div>
            <Label htmlFor="level_threshold_2">Level 2 Threshold (Crystals)</Label>
            <Input
              id="level_threshold_2"
              type="number"
              value={settings.level_threshold_2}
              onChange={handleChange}
              min="0"
              className="glass"
            />
          </div>
          <div>
            <Label htmlFor="level_threshold_3">Level 3 Threshold (Crystals)</Label>
            <Input
              id="level_threshold_3"
              type="number"
              value={settings.level_threshold_3}
              onChange={handleChange}
              min="0"
              className="glass"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={isSaving} className="clay-button">
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}