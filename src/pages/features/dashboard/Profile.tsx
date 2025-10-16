import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shared/ui/avatar";
import { Badge } from "@/components/shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shared/ui/tabs";
import { ArrowLeft, Upload, Trophy, Target, Edit, Settings } from "lucide-react";
import AchievementBadge from "@/components/features/community/AchievementBadge";
import GamificationDisplay from "@/components/features/community/GamificationDisplay";
import ImageCrop from "@/components/shared/ui/ImageCrop";
import { useUserProfile } from "@/hooks/features/auth/useUserProfile";
import LifeBalanceChart from "@/components/features/dashboard/LifeBalanceChart";

export default function Profile() {
  const navigate = useNavigate();
  const {
    loading,
    profile,
    achievements,
    levelThresholds,
    uploadingAvatar,
    updateProfile,
    uploadAvatar,
    lifeBalance,
  } = useUserProfile();

  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState("");
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || "");
    }
  }, [profile]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = "";
  };

  const handleCropComplete = async (croppedImage: Blob) => {
    setImageToCrop(null);
    await uploadAvatar(croppedImage);
  };

  const handleSaveProfile = async () => {
    if (profile?.nickname !== nickname) {
      const success = await updateProfile({ nickname });
      if (success) {
        setEditMode(false);
      }
    } else {
      setEditMode(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-white mb-4">Could not load profile.</p>
        <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
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
  const currentLevelThreshold = levelThresholds.find(
    (threshold) => threshold.level === currentLevel
  );

  const crystalsNeededForNextLevel = nextLevelThreshold
    ? nextLevelThreshold.crystals_required - currentCrystalBalance
    : 0;

  const crystalsEarnedInCurrentLevel = currentCrystalBalance - (currentLevelThreshold?.crystals_required || 0);
  const crystalsRequiredForCurrentLevelUp = (nextLevelThreshold?.crystals_required || 0) - (currentLevelThreshold?.crystals_required || 0);

  const levelProgressPercentage =
    crystalsRequiredForCurrentLevelUp > 0
      ? (crystalsEarnedInCurrentLevel / crystalsRequiredForCurrentLevelUp) * 100
      : 0;

  return (
    <>
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-4xl font-bold gradient-text">Profile</h1>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 glass-card">
              <CardHeader className="text-center">
                <div className="relative mx-auto mb-4">
                  <Avatar className="w-32 h-32 border-4 border-primary">
                    <AvatarImage src={avatarUrl || undefined} alt={nickname || "User"} />
                    <AvatarFallback className="text-4xl">
                      {(nickname || email || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {editMode && (
                    <label className="absolute bottom-0 right-0 clay-button p-2 rounded-full cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploadingAvatar}
                        title="Upload new avatar"
                      />
                    </label>
                  )}
                </div>
                
                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Nickname</Label>
                      <Input
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="text-center glass"
                        placeholder="Enter nickname"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} className="flex-1 clay-button">Save</Button>
                      <Button variant="outline" onClick={() => setEditMode(false)} className="flex-1 glass">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-2xl">{nickname || "Set your nickname"}</CardTitle>
                    <CardDescription>{email}</CardDescription>
                    <Button onClick={() => setEditMode(true)} variant="outline" className="mt-4 glass">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="glass p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Subscription:</span>
                    <Badge className="capitalize" variant={profile.subscription_tier === 'growth' || profile.subscription_tier === 'transformation' ? 'default' : 'secondary'}>{profile.subscription_tier || "discovery"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Minutes Remaining:</span>
                    <span className="font-semibold">{profile.remaining_minutes || 0} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Streak:</span>
                    <span className="font-semibold">{dailyStreak} days 🔥</span>
                  </div>
                </div>
                <Button onClick={() => navigate("/account-settings")} variant="outline" className="w-full glass">
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced Account Settings
                </Button>
              </CardContent>
            </Card>

            <div className="md:col-span-2">
              <Tabs defaultValue="achievements">
                <TabsList className="grid grid-cols-2 w-full glass">
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                  <TabsTrigger value="progress">Progress</TabsTrigger>
                </TabsList>

                <TabsContent value="achievements" className="space-y-4 mt-4">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-primary" />
                        Your Achievements
                      </CardTitle>
                      <CardDescription>
                        {achievements.length} achievement{achievements.length !== 1 ? 's' : ''} unlocked
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {achievements.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No achievements yet. Keep exploring to earn your first!</p>
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {achievements.map((achievement) => (
                            achievement.achievements && (
                              <AchievementBadge
                                key={achievement.id}
                                title={achievement.achievements.title}
                                description={achievement.achievements.description}
                                badgeUrl={achievement.achievements.badge_url || "/badges/default.svg"}
                                earnedAt={achievement.earned_at}
                              />
                            )
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="progress" className="space-y-4 mt-4">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Growth Journey
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <GamificationDisplay
                        crystalBalance={currentCrystalBalance}
                        currentLevel={currentLevel}
                        dailyStreak={dailyStreak}
                        crystalsToNextLevel={crystalsNeededForNextLevel}
                        levelProgressPercentage={levelProgressPercentage}
                      />

                      <div className="glass p-6 rounded-lg space-y-4">
                        <h3 className="font-semibold text-lg">Life Balance Areas</h3>
                        <LifeBalanceChart data={lifeBalance} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      {imageToCrop && (
        <ImageCrop
          image={imageToCrop}
          open={!!imageToCrop}
          onOpenChange={(isOpen) => !isOpen && setImageToCrop(null)}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}