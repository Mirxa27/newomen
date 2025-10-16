import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/shared/ui/use-toast';
import type { Tables, TablesInsert, TablesUpdate, Json } from '@/integrations/supabase/types';

export type Message = {
  id: string;
  sender: "ai" | "user" | "partner" | "system";
  content: string;
  timestamp: string;
};

export type ChallengeData = {
  id: string;
  initiator_id: string;
  partner_id: string | null;
  partner_name: string | null;
  status: string;
  question_set: {
    title: string;
    description: string;
    questions: string[];
  };
  messages: Message[];
  current_question_index: number;
  ai_analysis: Json | null;
  unique_link: string | null;
  responses: Json | null;
  compatibility_score: number | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
};

export type ChallengeTemplate = {
  id: string;
  title: string;
  description: string;
  category: string;
  questions: string[];
  is_active: boolean;
  created_at: string;
};

export function useCouplesChallenge() {
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<ChallengeData[]>([]);
  const [templates, setTemplates] = useState<ChallengeTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load challenge templates
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      // Use proper typing for challenge_templates query
      interface RawChallengeTemplate {
        id: string;
        title: string;
        description: string;
        category: string;
        questions: string[] | string;
        is_active: boolean;
        created_at: string;
      }
      
      const { data, error } = await (supabase as unknown as { 
        from: (table: string) => { 
          select: (columns: string) => { 
            eq: (column: string, value: boolean) => { 
              order: (column: string, options: { ascending: boolean }) => Promise<{ data: RawChallengeTemplate[] | null; error: Error | null }> 
            } 
          } 
        } 
      })
        .from('challenge_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our ChallengeTemplate type
      const transformedData: ChallengeTemplate[] = (data as RawChallengeTemplate[]).map(template => ({
        ...template,
        questions: Array.isArray(template.questions) ? template.questions : JSON.parse(template.questions as string) as string[]
      }));
      
      setTemplates(transformedData);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load challenge templates');
      toast({
        title: 'Error',
        description: 'Failed to load challenge templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load user's challenges
  const loadChallenges = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('couples_challenges')
        .select('*')
        .or(`initiator_id.eq.${userId},partner_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data as ChallengeData[]);
    } catch (err) {
      console.error('Error loading challenges:', err);
      setError('Failed to load challenges');
      toast({
        title: 'Error',
        description: 'Failed to load challenges',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Create a new challenge
  const createChallenge = useCallback(async (templateId: string, initiatorId: string) => {
    try {
      setLoading(true);
      
      // Get template data
      interface RawChallengeTemplate {
        id: string;
        title: string;
        description: string;
        category: string;
        questions: string[] | string;
        is_active: boolean;
        created_at: string;
      }
      
      const { data: template, error: templateError } = await (supabase as unknown as { 
        from: (table: string) => { 
          select: (columns: string) => { 
            eq: (column: string, value: string) => { 
              single: () => Promise<{ data: RawChallengeTemplate | null; error: Error | null }> 
            } 
          } 
        } 
      })
        .from('challenge_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;
      if (!template) throw new Error('Template not found');
      
      // Transform the template data
      const transformedTemplate = {
        ...template,
        questions: Array.isArray(template.questions) ? template.questions : JSON.parse(template.questions as string) as string[]
      };

      // Create challenge with proper typing
      const challengeData: TablesInsert<'couples_challenges'> = {
        initiator_id: initiatorId,
        partner_id: null,
        partner_name: null,
        status: 'pending',
        question_set: {
          title: transformedTemplate.title,
          description: transformedTemplate.description,
          category: transformedTemplate.category,
          questions: transformedTemplate.questions
        },
        messages: [],
        current_question_index: 0,
        ai_analysis: null,
        unique_link: null,
        responses: {},
        compatibility_score: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: null
      };

      const { data: newChallenge, error: createError } = await supabase
        .from('couples_challenges')
        .insert(challengeData)
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: 'Challenge Created!',
        description: 'Share the link with your partner to get started',
      });

      return newChallenge as ChallengeData;
    } catch (err) {
      console.error('Error creating challenge:', err);
      setError('Failed to create challenge');
      toast({
        title: 'Error',
        description: 'Failed to create challenge',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Get challenge by ID
  const getChallenge = useCallback(async (challengeId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('couples_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (error) throw error;
      return data as ChallengeData;
    } catch (err) {
      console.error('Error loading challenge:', err);
      setError('Failed to load challenge');
      toast({
        title: 'Error',
        description: 'Failed to load challenge',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Update challenge messages
  const updateChallengeMessages = useCallback(async (challengeId: string, messages: Message[]) => {
    try {
      const updates: TablesUpdate<'couples_challenges'> = {
        messages,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('couples_challenges')
        .update(updates)
        .eq('id', challengeId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating messages:', err);
      toast({
        title: 'Error',
        description: 'Failed to update messages',
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  // Update challenge status
  const updateChallengeStatus = useCallback(async (challengeId: string, status: string) => {
    try {
      const updates: TablesUpdate<'couples_challenges'> = {
        status,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('couples_challenges')
        .update(updates)
        .eq('id', challengeId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update challenge status',
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  // Add partner to challenge (for guest users)
  const addPartner = useCallback(async (challengeId: string, partnerName: string) => {
    try {
      const updates: TablesUpdate<'couples_challenges'> = {
        partner_name: partnerName,
        status: 'in_progress',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('couples_challenges')
        .update(updates)
        .eq('id', challengeId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error adding partner:', err);
      toast({
        title: 'Error',
        description: 'Failed to add partner to challenge',
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  // Update AI analysis
  const updateAIAnalysis = useCallback(async (challengeId: string, analysis: Json) => {
    try {
      const updates: TablesUpdate<'couples_challenges'> = {
        ai_analysis: analysis,
        status: 'analyzed',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('couples_challenges')
        .update(updates)
        .eq('id', challengeId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating AI analysis:', err);
      toast({
        title: 'Error',
        description: 'Failed to update AI analysis',
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  // Subscribe to challenge updates
  const subscribeToChallenge = useCallback((challengeId: string, callback: (challenge: ChallengeData) => void) => {
    const channel = supabase
      .channel(`challenge-${challengeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'couples_challenges',
          filter: `id=eq.${challengeId}`
        },
        (payload) => {
          callback(payload.new as ChallengeData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    challenges,
    templates,
    loading,
    error,
    loadTemplates,
    loadChallenges,
    createChallenge,
    getChallenge,
    updateChallengeMessages,
    updateChallengeStatus,
    addPartner,
    updateAIAnalysis,
    subscribeToChallenge
  };
}
