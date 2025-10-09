import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

type GamificationSettings = Tables<'gamification_settings'>;
type LevelThreshold = Tables<'level_thresholds'>;

export default function GamificationSettings() {
  const [settings, setSettings] = useState<Partial<GamificationSettings>>({});
  const [levels, setLevels] = useState<Partial<LevelThreshold>[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: settingsData, error: sError },
        { data: levelsData, error: lError },
      ] = await Promise.all([
        supabase.from('gamification_settings').select('*').single(),
        supabase.from('level_thresholds').select('*').order('level'),
      ]);
      if (sError && sError.code !== 'PGRST116') throw sError;
      if (lError) throw lError;
      setSettings(settingsData || { name: 'default' });
      setLevels(levelsData || []);
    } catch (e) {
      toast.error('Failed to load gamification settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: Number(value) }));
  };

  const handleLevelChange = (index: number, field: keyof LevelThreshold, value: any) => {
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setLevels(newLevels);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const upsertPayload = {
        ...settings,
        name: settings.name || 'default',
      } as TablesInsert<'gamification_settings'>;

      const { error: settingsError } = await supabase
        .from("gamification_settings")
        .upsert(upsertPayload, { onConflict: "name" })
        .select()
        .single();
      if (settingsError) throw settingsError;

      const thresholdPayload = levels.map(l => ({
        ...l,
        level: Number(l.level),
        crystals_required: Number(l.crystals_required),
      })) as TablesInsert<'level_thresholds'>[];

      const { error: levelsError } = await supabase
        .from("level_thresholds")
        .upsert(thresholdPayload, { onConflict: "level" });
      if (levelsError) throw levelsError;

      toast.success("Gamification settings saved!");
      await loadData();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gamification Settings</CardTitle>
        <CardDescription>Configure crystal rewards and level thresholds.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Form fields */}
        </form>
      </CardContent>
    </Card>
  );
}