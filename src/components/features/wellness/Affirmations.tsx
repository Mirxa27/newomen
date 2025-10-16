import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/features/auth/useAuth';
import { AffirmationService } from '@/services/features/wellness/AffirmationService';
import type { DailyAffirmation, UserAffirmationSettings } from '@/services/features/wellness/AffirmationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Switch } from '@/components/shared/ui/switch';
import { Label } from '@/components/shared/ui/label';
import { Input } from '@/components/shared/ui/input';
import { Button } from '@/components/shared/ui/button';
import { toast } from 'sonner';
import { Sparkles, Clock, Bell } from 'lucide-react';

export default function Affirmations() {
  const { user } = useAuth();
  const [affirmations, setAffirmations] = useState<DailyAffirmation[]>([]);
  const [settings, setSettings] = useState<UserAffirmationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [affirmationsData, settingsData] = await Promise.all([
        AffirmationService.getAffirmations({ limit: 10 }),
        AffirmationService.getAffirmationSettings(user.id)
      ]);
      setAffirmations(affirmationsData);
      setSettings(settingsData);
    } catch (error) {
      console.error("Error loading affirmations data:", error);
      toast.error("Failed to load affirmations data.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEnabledChange = async (enabled: boolean) => {
    if (!user?.id || !settings) return;
    try {
      await AffirmationService.updateAffirmationEnabled(user.id, enabled);
      setSettings({ ...settings, is_enabled: enabled });
      toast.success(`Affirmations ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update settings.');
    }
  };

  const handleTimeChange = async (event: React.FocusEvent<HTMLInputElement>) => {
    if (!user?.id || !settings) return;
    const time = event.target.value;
    try {
      await AffirmationService.updateAffirmationTime(user.id, time);
      setSettings({ ...settings, preferred_time: time });
      toast.success(`Affirmation time updated to ${time}`);
    } catch (error) {
      toast.error('Failed to update time.');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="affirmation-enabled" className="flex flex-col gap-1">
                  <span>Enable Daily Affirmations</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Receive a positive affirmation every day.
                  </span>
                </Label>
                <Switch
                  id="affirmation-enabled"
                  checked={settings.is_enabled ?? false}
                  onCheckedChange={handleEnabledChange}
                />
              </div>
              {settings.is_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="affirmation-time">Preferred Time</Label>
                  <Input
                    id="affirmation-time"
                    type="time"
                    defaultValue={settings.preferred_time ?? "09:00"}
                    onBlur={handleTimeChange}
                    className="w-40"
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Recent Affirmations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading affirmations...</p>
          ) : (
            <div className="space-y-4">
              {affirmations.map((affirmation) => (
                <div key={affirmation.id} className="p-4 border rounded-lg">
                  <p className="italic">"{affirmation.content}"</p>
                  <p className="text-sm text-muted-foreground mt-2">- {affirmation.category}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





