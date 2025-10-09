import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Edit, Save } from "lucide-react";
import { toast } from "sonner";
import { useUserProfile, UserProfile, UserAchievement } from "@/hooks/useUserProfile";
import type { TablesUpdate } from "@/integrations/supabase/types";

export default function ProfilePage() {
  const {
    profile,
    achievements,
    loading,
    updateProfile,
    uploadingAvatar,
    uploadAvatar,
    getDisplayName,
  } = useUserProfile();

  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || "");
    }
  }, [profile]);

  const handleSave = async () => {
    const success = await updateProfile({ nickname });
    if (success) {
      setEditMode(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadAvatar(e.target.files[0]);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!profile) {
    return <div>User not found.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || ""} alt={getDisplayName()} />
                <AvatarFallback>{getDisplayName().charAt(0)}</AvatarFallback>
              </Avatar>
              <Input type="file" id="avatar-upload" className="hidden" onChange={handleAvatarChange} accept="image/*" />
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer">
                {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
              </label>
            </div>
            <div>
              {editMode ? (
                <Input value={nickname} onChange={(e) => setNickname(e.target.value)} className="text-2xl font-bold" />
              ) : (
                <CardTitle className="text-3xl">{getDisplayName()}</CardTitle>
              )}
              <CardDescription>{profile.email}</CardDescription>
            </div>
            <div className="ml-auto">
              {editMode ? (
                <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
              ) : (
                <Button variant="outline" onClick={() => setEditMode(true)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg">Stats</h3>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <StatCard title="Level" value={profile.current_level || 1} />
              <StatCard title="Crystals" value={profile.crystal_balance || 0} />
              <StatCard title="Minutes Left" value={profile.remaining_minutes || 0} />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Achievements</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {achievements.map(ach => (
                <AchievementCard key={ach.id} achievement={ach} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value }: { title: string, value: number | string }) {
  return (
    <div className="p-4 bg-muted rounded-lg text-center">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: UserAchievement }) {
  return (
    <div className="p-4 border rounded-lg">
      <p className="font-bold">{achievement.name}</p>
      <p className="text-sm text-muted-foreground">{achievement.description}</p>
    </div>
  );
}