import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserProfile } from './useUserProfile';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type ChallengeTemplate = Tables<'challenge_templates'>;
type CouplesChallenge = Tables<'couples_challenges'>;
type ChallengeStatus = CouplesChallenge['status'];

export function useCouplesChallenge() {
  const { profile } = useUserProfile();
  const [activeChallenges, setActiveChallenges] = useState<CouplesChallenge[]>([]);
  const [challengeTemplates, setChallengeTemplates] = useState<ChallengeTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data: challenges, error: challengesError } = await supabase
        .from('couples_challenges')
        .select('*')
        .or(`initiator_id.eq.${profile.user_id},partner_id.eq.${profile.user_id}`)
        .in('status', ['pending', 'active']);

      if (challengesError) throw challengesError;
      setActiveChallenges(challenges || []);

      const { data: templates, error: templatesError } = await supabase
        .from('challenge_templates')
        .select('*');
      
      if (templatesError) throw templatesError;
      setChallengeTemplates(templates || []);

    } catch (e) {
      console.error('Error fetching challenges:', e);
      toast.error('Failed to load your challenges.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void fetchChallenges();
  }, [fetchChallenges]);

  const updateChallengeStatus = useCallback(async (challengeId: string, status: ChallengeStatus, partnerId?: string) => {
    try {
      const updates: TablesUpdate<'couples_challenges'> = { status };
      if (partnerId) {
        updates.partner_id = partnerId;
      }
      
      const { error } = await supabase
        .from('couples_challenges')
        .update(updates)
        .eq('id', challengeId);

      if (error) throw error;
      toast.success(`Challenge status updated to ${status}.`);
      await fetchChallenges();
    } catch (e) {
      console.error('Error updating challenge status:', e);
      toast.error('Failed to update challenge status.');
    }
  }, [fetchChallenges]);

  const acceptChallenge = useCallback(async (challengeId: string) => {
    await updateChallengeStatus(challengeId, 'active');
  }, [updateChallengeStatus]);

  const declineChallenge = useCallback(async (challengeId: string) => {
    await updateChallengeStatus(challengeId, 'cancelled');
  }, [updateChallengeStatus]);

  const createChallenge = useCallback(async (templateId: string, partnerEmail: string) => {
    if (!profile) {
      toast.error('You must be logged in to create a challenge.');
      return null;
    }

    try {
      const { data: partnerProfile, error: partnerError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', partnerEmail)
        .single();

      if (partnerError || !partnerProfile) {
        toast.error('Could not find a user with that email.');
        return null;
      }

      if (partnerProfile.user_id === profile.user_id) {
        toast.error("You can't challenge yourself!");
        return null;
      }

      const { data: template, error: templateError } = await supabase
        .from('challenge_templates')
        .select('questions')
        .eq('id', templateId)
        .single();

      if (templateError || !template) {
        toast.error('Challenge template not found.');
        return null;
      }

      const newChallenge: TablesInsert<'couples_challenges'> = {
        initiator_id: profile.user_id,
        partner_id: partnerProfile.user_id,
        status: 'pending',
        question_set: template.questions,
        responses: {},
        challenge_template_id: templateId,
      };

      const { data: createdChallenge, error: createError } = await supabase
        .from('couples_challenges')
        .insert(newChallenge)
        .select()
        .single();

      if (createError) throw createError;

      toast.success(`Challenge sent to ${partnerEmail}!`);
      await fetchChallenges();
      return createdChallenge;

    } catch (e) {
      console.error('Error creating challenge:', e);
      toast.error('Failed to create challenge.');
      return null;
    }
  }, [profile, fetchChallenges]);

  return {
    activeChallenges,
    challengeTemplates,
    loading,
    acceptChallenge,
    declineChallenge,
    createChallenge,
    refetchChallenges: fetchChallenges,
  };
}