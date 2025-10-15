import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { toast } from "sonner";
import { Save, Award, BarChart, RefreshCw } from "lucide-react";

type GamificationSettingsRow = Tables<"gamification_settings">;
type LevelThresholdRow = Tables<"level_thresholds">;

const FALLBACK_SETTINGS: GamificationSettingsRow = {
  id: "fallback-settings",
  name: "default",
  crystal_reward_session: 10,
  crystal_reward_assessment: 25,
  crystal_reward_challenge: 50,
  created_at: null,
  updated_at: null,
};

export default function GamificationSettings() {
  const [settings, setSettings] = useState<GamificationSettingsRow>(FALLBACK_SETTINGS);
  const [levelThresholds, setLevelThresholds] = useState<LevelThresholdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: settingsData, error: settingsError }, { data: thresholdsData, error: thresholdsError }] =
        await Promise.all([
          supabase
            .from("gamification_settings")
            .select("*")
            .order("created_at", { ascending: true })
            .limit(1),
          supabase
            .from("level_thresholds")
            .select("*")
            .order("level", { ascending: true }),
        ]);

      if (settingsError) throw settingsError;
      if (thresholdsError) throw thresholdsError;

      setSettings(settingsData?.[0] ?? FALLBACK_SETTINGS);
      setLevelThresholds((thresholdsData as LevelThresholdRow[] | null) ?? []);
    } catch (error) {
      console.error("Failed to load gamification settings:", error);
      toast.error("Unable to load gamification settings from Supabase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSettingsChange = (field: "crystal_reward_session" | "crystal_reward_assessment" | "crystal_reward_challenge") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseInt(event.target.value, 10);
      setSettings((prev) => ({
        ...prev,
        [field]: Number.isFinite(value) ? value : 0,
      }));
    };

  const handleThresholdChange = (id: string, value: number) => {
    setLevelThresholds((prev) =>
      prev.map((threshold) =>
        threshold.id === id
          ? { ...threshold, crystals_required: Number.isFinite(value) ? value : 0 }
          : threshold
      )
    );
  };

  const canSave = useMemo(() => !loading && levelThresholds.length > 0, [loading, levelThresholds.length]);

  const handleSave = async () => {
    if (!settings) {
      toast.error("Settings not loaded yet.");
      return;
    }

    if (!canSave) {
      toast.error("Nothing to save. Add level thresholds first.");
      return;
    }

    setSaving(true);
    try {
      const upsertPayload = {
        id: settings.id.startsWith("fallback") ? undefined : settings.id,
        name: settings.name ?? "default",
        crystal_reward_session: settings.crystal_reward_session,
        crystal_reward_assessment: settings.crystal_reward_assessment,
        crystal_reward_challenge: settings.crystal_reward_challenge,
      };

      const { error: settingsError } = await supabase
        .from("gamification_settings")
        .upsert(upsertPayload, { onConflict: "name" })
        .select()
        .single();

      if (settingsError) throw settingsError;

      const thresholdPayload = levelThresholds.map((threshold) => ({
        id: threshold.id.startsWith("fallback") ? undefined : threshold.id,
        level: threshold.level,
        crystals_required: threshold.crystals_required,
        title: threshold.title,
        description: threshold.description,
        rewards: threshold.rewards,
      }));

      const { error: thresholdsError } = await supabase
        .from("level_thresholds")
        .upsert(thresholdPayload, { onConflict: "level" });

      if (thresholdsError) throw thresholdsError;

      toast.success("Gamification settings saved successfully.");
      await loadData();
    } catch (error) {
      console.error("Failed to save gamification settings:", error);
      toast.error("Saving gamification settings failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Gamification Settings</h1>
          <p className="text-muted-foreground">
            Configure crystal rewards and leveling thresholds used across the platform.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={saving}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Crystal Rewards
            </CardTitle>
            <CardDescription>
              Rewards granted when users complete an experience or milestone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="crystal_reward_session">Conversation Session</Label>
              <Input
                id="crystal_reward_session"
                type="number"
                value={settings.crystal_reward_session}
                onChange={handleSettingsChange("crystal_reward_session")}
                min={0}
              />
            </div>
            <div>
              <Label htmlFor="crystal_reward_assessment">Assessment Completion</Label>
              <Input
                id="crystal_reward_assessment"
                type="number"
                value={settings.crystal_reward_assessment}
                onChange={handleSettingsChange("crystal_reward_assessment")}
                min={0}
              />
            </div>
            <div>
              <Label htmlFor="crystal_reward_challenge">Challenge Completion</Label>
              <Input
                id="crystal_reward_challenge"
                type="number"
                value={settings.crystal_reward_challenge}
                onChange={handleSettingsChange("crystal_reward_challenge")}
                min={0}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5 text-primary" />
              Level Thresholds
            </CardTitle>
            <CardDescription>
              XP requirements for each user level. Higher levels unlock additional experiences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {levelThresholds.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No thresholds defined yet. Configure levels in the database to make them available here.
              </p>
            ) : (
              levelThresholds.map((threshold) => (
                <div key={threshold.id} className="space-y-2 rounded-xl border border-white/10 p-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`threshold-${threshold.id}`}>
                      Level {threshold.level} XP
                    </Label>
                    {threshold.title && (
                      <span className="text-xs text-muted-foreground">{threshold.title}</span>
                    )}
                  </div>
                  <Input
                    id={`threshold-${threshold.id}`}
                    type="number"
                    value={threshold.crystals_required}
                    min={0}
                    onChange={(event) =>
                      handleThresholdChange(
                        threshold.id,
                        Number.parseInt(event.target.value, 10)
                      )
                    }
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
