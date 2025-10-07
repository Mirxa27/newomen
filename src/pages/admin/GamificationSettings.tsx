import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Settings, Award, BarChart } from "lucide-react";

// NOTE: The 'gamification_settings' table does not exist.
// This component now uses local state for demonstration purposes.
interface GamificationSetting {
  id: string;
  crystal_reward_session: number;
  crystal_reward_assessment: number;
  crystal_reward_challenge: number;
  level_threshold_1: number;
  level_threshold_2: number;
  level_threshold_3: number;
  created_at?: string;
  updated_at?: string;
}

const defaultSettings: GamificationSetting = {
  id: 'default',
  crystal_reward_session: 10,
  crystal_reward_assessment: 25,
  crystal_reward_challenge: 50,
  level_threshold_1: 100,
  level_threshold_2: 500,
  level_threshold_3: 1000,
};

export default function GamificationSettings() {
  const [settings, setSettings] = useState<GamificationSetting>(defaultSettings);
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [id]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    // This is a mock save since the backend table doesn't exist.
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Saving settings (mock):", settings);
    toast.success("Gamification settings saved successfully! (Mock)");
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Gamification Settings</h1>
          <p className="text-muted-foreground">
            Configure crystal rewards and level thresholds for user engagement.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Crystal Rewards
            </CardTitle>
            <CardDescription>
              Set the number of crystals awarded for completing activities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="crystal_reward_session">Conversation Session</Label>
              <Input
                id="crystal_reward_session"
                type="number"
                value={settings.crystal_reward_session}
                onChange={handleChange}
                className="glass"
              />
            </div>
            <div>
              <Label htmlFor="crystal_reward_assessment">Assessment Completion</Label>
              <Input
                id="crystal_reward_assessment"
                type="number"
                value={settings.crystal_reward_assessment}
                onChange={handleChange}
                className="glass"
              />
            </div>
            <div>
              <Label htmlFor="crystal_reward_challenge">Challenge Completion</Label>
              <Input
                id="crystal_reward_challenge"
                type="number"
                value={settings.crystal_reward_challenge}
                onChange={handleChange}
                className="glass"
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
              Define the experience points (XP) required for each level.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="level_threshold_1">Level 1 XP</Label>
              <Input
                id="level_threshold_1"
                type="number"
                value={settings.level_threshold_1}
                onChange={handleChange}
                className="glass"
              />
            </div>
            <div>
              <Label htmlFor="level_threshold_2">Level 2 XP</Label>
              <Input
                id="level_threshold_2"
                type="number"
                value={settings.level_threshold_2}
                onChange={handleChange}
                className="glass"
              />
            </div>
            <div>
              <Label htmlFor="level_threshold_3">Level 3 XP</Label>
              <Input
                id="level_threshold_3"
                type="number"
                value={settings.level_threshold_3}
                onChange={handleChange}
                className="glass"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}