import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfiles } from '@/integrations/supabase/tables/user_profiles';
import { UserAchievements } from '@/integrations/supabase/tables/user_achievements';
import { Achievements } from '@/integrations/supabase/tables/achievements';
import { TablesUpdate } from '@/integrations/supabase/types';

export type UserProfile = UserProfiles['Row'];
export type UserAchievement = UserAchievements['Row'] & {
  achievements: Achievements['Row'];
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const getDisplayName = useCallback(() => {
    if (!profile) return 'User';
    return profile.nickname || profile.email || 'User';
  }, [profile]);

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setProfile(null);
        setAchievements([]);
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData) {
        throw new Error('User profile not found.');
      }
      const typedProfile = profileData as UserProfile;
      setProfile(typedProfile);

      const { data: userAchievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select(`*, achievements:achievement_id (*)`)
        .eq('user_id', typedProfile.user_id);

      if (achievementsError) throw achievementsError;
      setAchievements(userAchievements as UserAchievement[]);

    } catch (e) {
      console.error('Error fetching user profile:', e);
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      setProfile(null);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUserProfile();
  }, [fetchUserProfile]);

  const updateProfile = useCallback(async (updates: Partial<TablesUpdate<'user_profiles'>>): Promise<boolean> => {
    if (!profile) {
      toast.error('No profile to update.');
      return false;
    }
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      toast.success('Profile updated successfully!');
      return true;
    } catch (e) {
      console.error('Error updating profile:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to update profile.');
      return false;
    }
  }, [profile]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!profile) {
      toast.error('No profile found.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        await updateProfile({ avatar_url: publicUrlData.publicUrl });
        toast.success('Avatar updated successfully!');
      } else {
        throw new Error('Failed to get public URL for avatar.');
      }
    } catch (e) {
      console.error('Error uploading avatar:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  }, [profile, updateProfile]);

  return {
    profile,
    achievements,
    loading,
    error,
    updateProfile,
    refetchUserProfile: fetchUserProfile,
    getDisplayName,
    uploadingAvatar,
    uploadAvatar,
  };
}