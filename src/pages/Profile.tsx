import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Edit, Save, Camera, Award, Zap, User } from "lucide-react"; // Import User icon
import { toast } from "sonner";
import { useUserProfile, UserProfile, UserAchievement } from "@/hooks/useUserProfile";
import type { Database, TablesUpdate } from "@/integrations/supabase/types";

type LevelThreshold = Database["public"]["Tables"]["level_thresholds"]['Row'];

export default function Profile() {
  const {
    profile,
    achievements,
    loading,
    error,
    updateProfile,
    uploadingAvatar,
    uploadAvatar,
    getDisplayName,
  } = useUserProfile();

  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState("");
  const [levelThresholds, setLevelThresholds] = useState<LevelThreshold[]>([]);

  const fetchLevelThresholds = useCallback(async () => {
    const { data, error } = await supabase
      .from("level_thresholds")
      .select("*")
      .order("level", { ascending: true });
    if (error) {
      console.error("Error fetching level thresholds:", error);
      toast.error("Failed to load level thresholds.");
    } else {
      setLevelThresholds(data || []);
    }
  }, []);

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || "");
    }
    void fetchLevelThresholds();
  }, [profile, fetchLevelThresholds]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    if (profile.nickname !== nickname) {
      const success = await updateProfile({ nickname });
      if (success) {
        setEditMode(false);
      }
    } else {
      setEditMode(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      toast.error("You must select an image to upload.");
      return;
    }
    const file = event.target.files[0];
    await uploadAvatar(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive text-center mt-8">{error}</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Profile Not Found</h1>
        <p className="text-muted-foreground mb-6">Please ensure you are logged in.</p>
      </div>
    );
  }

  const {
    crystal_balance: currentCrystalBalance = 0,
    current_level: currentLevel = 1,
    daily_streak: dailyStreak = 0,
    avatar_url: avatarUrl,
    email,
  } = profile;

  const nextLevelThreshold = levelThresholds.find(
    (threshold) => threshold.level === currentLevel + 1
  );
  const progressToNextLevel = nextLevelThreshold
    ? (currentCrystalBalance / nextLevelThreshold.crystals_required) * 100
    : 100;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold gradient-text">Your Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and track your progress.</p>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your public profile details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-3xl">
                    {getDisplayName()?.[0]?.toUpperCase() || <User className="h-12 w-12" />}
                  </AvatarFallback>
                </Avatar>
                <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/80 transition-colors">
                  {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  <Input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" disabled={uploadingAvatar} />
                </Label>
              </div>
              <div className="flex-1 space-y-2">
                <div className="grid gap-1">
                  <Label htmlFor="nickname">Nickname</Label>
                  {editMode ? (
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="glass"
                    />
                  ) : (
                    <p className="text-lg font-semibold">{getDisplayName()}</p>
                  )}
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="email">Email</Label>
                  <p className="text-lg font-semibold">{email}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              {editMode ? (
                <Button onClick={handleSaveProfile} disabled={loading || uploadingAvatar} className="clay-button">
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </Button>
              ) : (
                <Button onClick={() => setEditMode(true)} variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Subscription & Usage</CardTitle>
            <CardDescription>Your current plan and remaining minutes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Subscription:</span>
              <Badge className="capitalize" variant={profile.subscription_tier === 'growth' || profile.subscription_tier === 'transformation' ? 'default' : 'secondary'}>{profile.subscription_tier || "discovery"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Minutes Remaining:</span>
              <span className="font-semibold">{profile.remaining_minutes || 0} min</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Gamification Progress</CardTitle>
            <CardDescription>Your current level, crystals, and achievements.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center">
                <Zap className="h-8 w-8 text-yellow-500 mb-2" />
                <span className="text-lg font-semibold">{currentCrystalBalance} Crystals</span>
              </div>
              <div className="flex flex-col items-center">
                <Award className="h-8 w-8 text-purple-500 mb-2" />
                <span className="text-lg font-semibold">Level {currentLevel}</span>
                <Progress value={progressToNextLevel} className="h-2 w-full mt-2" />
                {nextLevelThreshold && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {nextLevelThreshold.crystals_required - currentCrystalBalance} crystals to next level
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center">
                <Heart className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-lg font-semibold">{dailyStreak} Day Streak</span>
              </div>
            </div>

            <h3 className="font-semibold text-lg mt-6 mb-3">Achievements</h3>
            {achievements.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <Card key={achievement.id} className="glass-card p-4 flex items-center space-x-3">
                    <img src={achievement.achievements.badge_url || "/badges/default.svg"} alt={achievement.achievements.title} className="h-12 w-12" />
                    <div>
                      <h4 className="font-medium">{achievement.achievements.title}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.achievements.description}</p>
                      <p className="text-xs text-muted-foreground">Earned: {new Date(achievement.earned_at).toLocaleDateString()}</p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No achievements unlocked yet. Keep going!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}