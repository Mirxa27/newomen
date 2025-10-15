import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { safeUpdate } from '@/lib/shared/core/supabase-utils';

type UserProfileRow = Tables<'user_profiles'>;
type UserAchievement = Tables<'user_achievements'> & {
  achievements: Pick<Tables<'achievements'>, 'title' | 'description' | 'badge_url' | 'crystal_reward'> | null;
};

type UseUserProfileOptions = {
  redirectToAuth?: boolean;
};

export function useUserProfile(options: UseUserProfileOptions = {}) {
  const navigate = useNavigate();
  const { redirectToAuth = true } = options;
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [levelThresholds, setLevelThresholds] = useState<Tables<'level_thresholds'>[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        if (redirectToAuth) {
          navigate('/');
        } else {
          setProfile(null);
          setAchievements([]);
          setLevelThresholds([]);
        }
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError || !profileData) {
        throw profileError || new Error('Profile not found');
      }

      setProfile(profileData as any);

      const { data: thresholdsData, error: thresholdsError } = await supabase
        .from('level_thresholds')
        .select('*')
        .order('level', { ascending: true });

      if (thresholdsError) throw thresholdsError;
      setLevelThresholds(thresholdsData);

      const { data: achievementsData, error: achievementsError } = await supabase
        .from('user_achievements')
        .select(`*, achievements:achievement_id (title, description, badge_url, crystal_reward)`)
        .eq('user_id', (profileData as Record<string, unknown>).id || (profileData as Record<string, unknown>).user_id);

      if (achievementsError) throw achievementsError;
      setAchievements((achievementsData as unknown as UserAchievement[]) ?? []);

    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  }, [navigate, redirectToAuth]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const updateProfile = useCallback(async (updates: Partial<UserProfileRow>) => {
    if (!profile) return;
    try {
      const { error } = await safeUpdate('user_profiles', profile.id, updates);

      if (error) throw error;

      await loadProfile(); // Refresh data
      toast.success('Profile updated successfully!');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile.');
      return false;
    }
  }, [profile, loadProfile]);

  const uploadAvatar = useCallback(async (file: Blob) => {
    if (!profile) return;
    setUploadingAvatar(true);
    try {
      const fileExt = 'png';
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { contentType: 'image/png', upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      await updateProfile({ avatar_url: data.publicUrl });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload new avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  }, [profile, updateProfile]);

  const getDisplayName = useCallback(() => {
    if (!profile) return 'Unknown User';
    return profile.frontend_name || profile.nickname || 'Unknown User';
  }, [profile]);

  return {
    loading,
    profile,
    achievements,
    levelThresholds,
    uploadingAvatar,
    loadProfile,
    updateProfile,
    uploadAvatar,
    getDisplayName,
  };
}
