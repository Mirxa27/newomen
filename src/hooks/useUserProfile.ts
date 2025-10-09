import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type UserProfile = Tables<'user_profiles'>;
export type UserAchievement = { id: string; name: string; description: string; achieved_at: string };

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert({ user_id: user.id, email: user.email || '' } as TablesInsert<'user_profiles'>)
            .select()
            .single();
          if (insertError) throw insertError;
          setProfile(newProfile);
        } else {
          throw profileError;
        }
      } else {
        setProfile(data);
      }
      // Placeholder for achievements
      setAchievements([
        { id: '1', name: 'First Step', description: 'Completed your first session.', achieved_at: new Date().toISOString() }
      ]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast.error(`Failed to fetch profile: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        void fetchProfile();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Omit<UserProfile, 'id' | 'user_id'>>): Promise<boolean> => {
    if (!profile) {
      toast.error("No profile to update.");
      return false;
    }
    try {
      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update(updates as TablesUpdate<'user_profiles'>)
        .eq('id', profile.id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      setProfile(data);
      toast.success("Profile updated successfully!");
      return true;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast.error(`Failed to update profile: ${errorMessage}`);
      return false;
    }
  }, [profile]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!profile) return;
    setUploadingAvatar(true);
    try {
      const filePath = `${profile.user_id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await updateProfile({ avatar_url: publicUrl });
      toast.success('Avatar updated!');
    } catch (e) {
      toast.error('Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  }, [profile, updateProfile]);

  const getDisplayName = useCallback(() => {
    return profile?.nickname || profile?.email || 'User';
  }, [profile]);

  return { profile, achievements, loading, error, fetchProfile, updateProfile, uploadingAvatar, uploadAvatar, getDisplayName };
}