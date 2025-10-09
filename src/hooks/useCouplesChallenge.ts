import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type RealtimeChannel } from '@supabase/supabase-js';
import { type CouplesChallenges } from '@/integrations/supabase/tables/couples_challenges';
import { useUserProfile } from './useUserProfile';
import { toast } from 'sonner';
import { safeUpdate, safeInsert } from '@/lib/supabase-utils';

export type CouplesChallenge = CouplesChallenges['Row'];
export type ChallengeStatus = CouplesChallenge['status'];

export interface RealtimePayload {
  new: CouplesChallenge;
  old: CouplesChallenge;
}

export interface ResponseData {
  [questionId: string]: {
    initiator_response?: string;
    partner_response?: string;
  };
}

export function useCouplesChallenge(challengeId: string | null) {
  const { profile } = useUserProfile();
  const [challenge, setChallenge] = useState<CouplesChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const handleIncomingChanges = useCallback((payload: RealtimePayload) => {
    setChallenge(payload.new);
  }, []);

  useEffect(() => {
    if (!challengeId || !profile) return;

    const fetchChallenge = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('couples_challenges')
          .select('*')
          .eq('id', challengeId)
          .single();

        if (fetchError || !data) {
          throw fetchError || new Error('Challenge not found.');
        }

        const challengeData = data as CouplesChallenge;

        // Ensure the current user is part of the challenge
        if (challengeData.initiator_id !== profile.id && challengeData.partner_id !== profile.id && challengeData.partner_id !== null) {
          throw new Error("You are not authorized to view this challenge.");
        }

        // If the user is the second person to join, update the partner_id
        if (challengeData.initiator_id !== profile.id && challengeData.partner_id === null) {
          const updateData = {
            partner_id: profile.id,
            status: 'active'
          };

          const { data: updatedChallenge, error: updateError } = await safeUpdate<CouplesChallenge>(
            'couples_challenges',
            challengeId,
            updateData
          );

          if (updateError) throw updateError;
          setChallenge(updatedChallenge);
        } else {
          setChallenge(challengeData);
        }

      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    void fetchChallenge();

    const newChannel = supabase.channel(`couples-challenge-${challengeId}`);

    // Use type assertion for the realtime channel - this is a known Supabase type issue
    newChannel.on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'postgres_changes' as any,
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'couples_challenges',
        filter: `id=eq.${challengeId}`
      },
      handleIncomingChanges
    ).subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to challenge channel!');
      }
      if (err) {
        console.error('Subscription error:', err);
        setError('Could not connect to real-time updates.');
      }
    });

    setChannel(newChannel);

    return () => {
      void supabase.removeChannel(newChannel);
    };
  }, [challengeId, profile, handleIncomingChanges]);

  const submitResponse = useCallback(async (questionId: string, response: string) => {
    if (!challenge || !profile) return;

    const isInitiator = challenge.initiator_id === profile.id;
    const currentResponses = (challenge.responses as Record<string, ResponseData[string]>) || {};

    const newResponses = {
      ...currentResponses,
      [questionId]: {
        ...(currentResponses[questionId] as ResponseData[string]),
        [isInitiator ? 'initiator_response' : 'partner_response']: response,
      }
    };

    const updateData = {
      responses: newResponses
    };

    const { data, error: updateError } = await safeUpdate<CouplesChallenge>(
      'couples_challenges',
      challenge.id,
      updateData
    );

    if (updateError) {
      toast.error('Failed to submit your response.');
      console.error(updateError);
    }
  }, [challenge, profile]);

  return { challenge, loading, error, submitResponse };
}

export async function createNewChallenge(): Promise<CouplesChallenge | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast.error("You must be logged in to start a challenge.");
        return null;
    }

    // Default question set - dynamic sets will be configured via admin panel
    const questionSet = {
        questions: [
            { id: 'q1', text: 'What is your favorite memory together?' },
            { id: 'q2', text: 'What is one thing you admire about your partner?' },
            { id: 'q3', text: 'What is a shared goal you want to achieve in the next year?' },
        ]
    };

    try {
        const insertData = {
            initiator_id: user.id,
            status: 'pending',
            question_set: questionSet,
        };

        const { data, error } = await safeInsert<CouplesChallenge>(
            'couples_challenges',
            insertData
        );

        if (error) throw error;
        toast.success("New challenge created! Share the link with your partner.");
        return data;
    } catch (error) {
        console.error("Error creating challenge:", error);
        toast.error("Could not create a new challenge.");
        return null;
    }
}