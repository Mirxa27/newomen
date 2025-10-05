import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Upload, User, Trophy, Target, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setProfile(profileData);
      setNickname(profileData?.nickname || "");
      setAvatarUrl(profileData?.avatar_url || "");

      // Load achievements
      const { data: achievementsData } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievements:achievement_id (
            title,
            description,
            badge_url,
            crystal_reward
          )
        `)
        .eq("user_id", profileData?.id);

      setAchievements(achievementsData || []);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      toast.success("Avatar uploaded successfully");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async () => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          nickname,
          avatar_url: avatarUrl
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      setEditMode(false);
      loadProfile();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    }
  };

  const getLevelProgress = () => {
    const currentLevel = profile?.current_level || 1;
    const crystalsForNextLevel = currentLevel * 100;
    const currentCrystals = profile?.crystal_balance || 0;
    return Math.min((currentCrystals / crystalsForNextLevel) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
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
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <div className="relative mx-auto mb-4">
                <Avatar className="w-32 h-32 border-4 border-primary">
                  <AvatarImage src={avatarUrl} alt={nickname || "User"} />
                  <AvatarFallback className="text-4xl">
                    {(nickname || profile?.email || "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {editMode && (
                  <label className="absolute bottom-0 right-0 clay-button p-2 rounded-full cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
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
                      className="text-center"
                      placeholder="Enter nickname"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveProfile} className="flex-1">Save</Button>
                    <Button variant="outline" onClick={() => setEditMode(false)} className="flex-1">Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-2xl">{nickname || "Set your nickname"}</CardTitle>
                  <CardDescription>{profile?.email}</CardDescription>
                  <Button onClick={() => setEditMode(true)} variant="outline" className="mt-4">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Level {profile?.current_level || 1}</span>
                  <span className="text-sm text-muted-foreground">
                    {profile?.crystal_balance || 0} / {(profile?.current_level || 1) * 100} Crystals
                  </span>
                </div>
                <Progress value={getLevelProgress()} className="h-3" />
              </div>

              <div className="glass p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Subscription:</span>
                  <Badge className="capitalize">{profile?.subscription_tier || "discovery"}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Minutes Remaining:</span>
                  <span className="font-semibold">{profile?.remaining_minutes || 0} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Daily Streak:</span>
                  <span className="font-semibold">{profile?.daily_streak || 0} days 🔥</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="md:col-span-2">
            <Tabs defaultValue="achievements">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="achievements" className="space-y-4">
                <Card>
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
                      <div className="grid md:grid-cols-2 gap-4">
                        {achievements.map((achievement) => (
                          <div key={achievement.id} className="glass p-4 rounded-lg space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="clay w-12 h-12 rounded-full flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{achievement.achievements?.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {achievement.achievements?.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {new Date(achievement.earned_at).toLocaleDateString()}
                              </span>
                              <Badge variant="secondary">
                                +{achievement.achievements?.crystal_reward || 0} Crystals
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Growth Journey
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="glass p-6 rounded-lg space-y-4">
                      <h3 className="font-semibold text-lg">Journey Stats</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center clay p-4 rounded-lg">
                          <div className="text-3xl font-bold gradient-text">
                            {profile?.current_level || 1}
                          </div>
                          <div className="text-sm text-muted-foreground">Current Level</div>
                        </div>
                        <div className="text-center clay p-4 rounded-lg">
                          <div className="text-3xl font-bold gradient-text">
                            {profile?.crystal_balance || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Crystals</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Life Balance Areas</h4>
                      <div className="space-y-3">
                        {["Career & Purpose", "Relationships", "Health & Wellness", "Personal Growth"].map((area) => (
                          <div key={area}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{area}</span>
                              <span className="text-muted-foreground">Coming soon</span>
                            </div>
                            <Progress value={0} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Email</Label>
                        <Input value={profile?.email || ""} disabled className="opacity-50" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Email cannot be changed
                        </p>
                      </div>

                      <div>
                        <Button onClick={() => navigate("/account-settings")} variant="outline" className="w-full">
                          Advanced Settings
                        </Button>
                      </div>

                      <div>
                        <Button
                          onClick={async () => {
                            await supabase.auth.signOut();
                            navigate("/");
                          }}
                          variant="destructive"
                          className="w-full"
                        >
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
