/**
 * NewMe Memory Service
 * Handles all database operations for NewMe's memory and conversation system
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  NewMeConversation,
  NewMeMessage,
  NewMeUserMemory,
  NewMeEmotionalSnapshot,
  NewMeAssessmentTracking,
  NewMeUserContext,
  CreateMemoryInput,
  CreateConversationInput,
  UpdateConversationInput,
  CreateMessageInput,
  CreateEmotionalSnapshotInput,
  UpdateAssessmentTrackingInput,
} from '@/types/features/ai/newme-memory-types';
import type { Database } from '@/integrations/supabase/types';

type GlimmerPattern = {
  note: string;
  frequency: number;
  emotions: string[];
  dates: string[];
};

type AuthenticityPattern = {
  metadata: {
    context: string;
    faked_feeling: string;
    real_feeling: string;
    pattern_date: string;
  };
  created_at: string;
};

type MicroAssessmentPattern = {
  memory_key: string;
  memory_value: string;
  metadata: {
    assessment_type: string;
    [key: string]: unknown;
  };
  created_at: string;
};

export class NewMeMemoryService {
  /**
   * Get user context for personalizing conversations
   */
  async getUserContext(userId: string): Promise<NewMeUserContext | null> {
    try {
      const { data, error } = await supabase.rpc('get_newme_user_context', {
        p_user_id: userId,
      });

      if (error) throw error;
      return data as NewMeUserContext;
    } catch (error) {
      console.error('Error fetching user context:', error);
      return null;
    }
  }

  /**
   * Create a new conversation session
   */
  async createConversation(input: CreateConversationInput): Promise<NewMeConversation | null> {
    try {
      const { data, error } = await supabase
        .from('newme_conversations')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as NewMeConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  /**
   * Update an existing conversation
   */
  async updateConversation(
    conversationId: string,
    updates: UpdateConversationInput
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('newme_conversations')
        .update(updates)
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating conversation:', error);
      return false;
    }
  }

  /**
   * Get conversation history for a user
   */
  async getConversationHistory(
    userId: string,
    limit: number = 10
  ): Promise<NewMeConversation[]> {
    try {
      const { data, error } = await supabase
        .from('newme_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as unknown as NewMeConversation[];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }

  /**
   * Get the most recent active conversation
   */
  async getActiveConversation(userId: string): Promise<NewMeConversation | null> {
    try {
      const { data, error } = await supabase
        .from('newme_conversations')
        .select('*')
        .eq('user_id', userId)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
      }
      return data as unknown as NewMeConversation;
    } catch (error) {
      console.error('Error fetching active conversation:', error);
      return null;
    }
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(input: CreateMessageInput): Promise<NewMeMessage | null> {
    try {
      const { data, error } = await supabase
        .from('newme_messages')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      // Update message count in conversation
      await supabase.rpc('increment_message_count', { conv_id: input.conversation_id });

      return data as unknown as NewMeMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }

  /**
   * End a conversation and calculate duration
   */
  async endConversation(conversationId: string): Promise<boolean> {
    try {
      // Get the conversation start time
      const { data: conversation, error: fetchError } = await supabase
        .from('newme_conversations')
        .select('started_at')
        .eq('id', conversationId)
        .single();

      if (fetchError) throw fetchError;

      const startTime = new Date(conversation.started_at);
      const endTime = new Date();
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      // Update the conversation with end time and duration
      const { error: updateError } = await supabase
        .from('newme_conversations')
        .update({
          ended_at: endTime.toISOString(),
          duration_seconds: durationSeconds
        })
        .eq('id', conversationId);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Error ending conversation:', error);
      return false;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, limit?: number): Promise<NewMeMessage[]> {
    try {
      let query = supabase
        .from('newme_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as NewMeMessage[];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Create or update a user memory
   */
  async saveMemory(input: CreateMemoryInput): Promise<NewMeUserMemory | null> {
    try {
      // Check if memory already exists
      const { data: existing } = await supabase
        .from('newme_user_memories')
        .select('*')
        .eq('user_id', input.user_id)
        .eq('memory_type', input.memory_type)
        .eq('memory_key', input.memory_key)
        .eq('is_active', true)
        .single();

      if (existing) {
        // Update existing memory
        const { data, error } = await supabase
          .from('newme_user_memories')
          .update({
            memory_value: input.memory_value,
            context: input.context,
            importance_score: input.importance_score ?? existing.importance_score,
            last_referenced_at: new Date().toISOString(),
            reference_count: Number(existing.reference_count) + 1,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as unknown as NewMeUserMemory;
      } else {
        // Create new memory
        const { data, error } = await supabase
          .from('newme_user_memories')
          .insert({
            ...input,
            importance_score: input.importance_score ?? 5,
          } as Database['public']['Tables']['newme_user_memories']['Insert'])
          .select()
          .single();

        if (error) throw error;
        return data as unknown as NewMeUserMemory;
      }
    } catch (error) {
      console.error('Error saving memory:', error);
      return null;
    }
  }

  /**
   * Get all active memories for a user
   */
  async getUserMemories(userId: string, memoryType?: string): Promise<NewMeUserMemory[]> {
    try {
      let query = supabase
        .from('newme_user_memories')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('importance_score', { ascending: false });

      if (memoryType) {
        query = query.eq('memory_type', memoryType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as NewMeUserMemory[];
    } catch (error) {
      console.error('Error fetching user memories:', error);
      return [];
    }
  }

  /**
   * Deactivate a memory (soft delete)
   */
  async deactivateMemory(memoryId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('newme_user_memories')
        .update({ is_active: false })
        .eq('id', memoryId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deactivating memory:', error);
      return false;
    }
  }

  /**
   * Track emotional snapshot
   */
  async createEmotionalSnapshot(
    input: CreateEmotionalSnapshotInput
  ): Promise<NewMeEmotionalSnapshot | null> {
    try {
      const { data, error } = await supabase
        .from('newme_emotional_snapshots')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as NewMeEmotionalSnapshot;
    } catch (error) {
      console.error('Error creating emotional snapshot:', error);
      return null;
    }
  }

  /**
   * Get emotional journey for a user
   */
  async getEmotionalJourney(
    userId: string,
    limit: number = 30
  ): Promise<NewMeEmotionalSnapshot[]> {
    try {
      const { data, error } = await supabase
        .from('newme_emotional_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as unknown as NewMeEmotionalSnapshot[];
    } catch (error) {
      console.error('Error fetching emotional journey:', error);
      return [];
    }
  }

  /**
   * Track assessment suggestion and completion
   */
  async trackAssessmentSuggestion(
    userId: string,
    assessmentName: string,
    conversationId?: string
  ): Promise<NewMeAssessmentTracking | null> {
    try {
      const { data, error } = await supabase
        .from('newme_assessment_tracking')
        .insert({
          user_id: userId,
          assessment_name: assessmentName,
          suggested_in_conversation_id: conversationId,
          suggested_at: new Date().toISOString(),
          completion_status: 'suggested',
          follow_up_discussed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as NewMeAssessmentTracking;
    } catch (error) {
      console.error('Error tracking assessment suggestion:', error);
      return null;
    }
  }

  /**
   * Update assessment tracking status
   */
  async updateAssessmentTracking(
    trackingId: string,
    updates: UpdateAssessmentTrackingInput
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('newme_assessment_tracking')
        .update(updates)
        .eq('id', trackingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating assessment tracking:', error);
      return false;
    }
  }

  /**
   * Get assessment suggestions for a user
   */
  async getAssessmentTracking(userId: string): Promise<NewMeAssessmentTracking[]> {
    try {
      const { data, error } = await supabase
        .from('newme_assessment_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('suggested_at', { ascending: false });

      if (error) throw error;
      return data as unknown as NewMeAssessmentTracking[];
    } catch (error) {
      console.error('Error fetching assessment tracking:', error);
      return [];
    }
  }

  /**
   * Calculate days since last conversation
   */
  calculateDaysSinceLastConversation(lastConversationDate?: string): number {
    if (!lastConversationDate) return 999;

    const lastDate = new Date(lastConversationDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Extract key insights from conversation messages
   */
  extractKeyInsights(messages: NewMeMessage[]): string[] {
    const insights: string[] = [];
    const assistantMessages = messages.filter((m) => m.role === 'assistant');

    const insightKeywords = [
      'realize',
      'discover',
      'understand',
      'insight',
      'pattern',
      'breakthrough',
      'aha',
      'makes sense',
    ];

    assistantMessages.forEach((msg) => {
      const lowerContent = msg.content.toLowerCase();
      if (insightKeywords.some((keyword) => lowerContent.includes(keyword))) {
        const sentences = msg.content.split(/[.!?]+/);
        sentences.forEach((sentence) => {
          if (
            sentence.length > 20 &&
            sentence.length < 150 &&
            insightKeywords.some((kw) => sentence.toLowerCase().includes(kw))
          ) {
            insights.push(sentence.trim());
          }
        });
      }
    });

    return insights.slice(0, 5);
  }

  // ===== ADVANCED AGENT FEATURES =====

  /**
   * Save micro-assessment data (scent quiz, truth game, etc.)
   */
  async saveMicroAssessment(
    userId: string,
    assessmentType: 'olfactory_quiz' | 'truth_game' | 'authenticity_check',
    trigger: string,
    response: string,
    traitJudged?: string,
    userConfirmation?: boolean
  ): Promise<NewMeUserMemory | null> {
    const memoryKey = `${assessmentType}_${Date.now()}`;
    const metadata = {
      trigger,
      trait_judged: traitJudged,
      user_confirmation: userConfirmation,
      assessment_type: assessmentType,
    };

    return this.saveMemory({
      user_id: userId,
      memory_type: 'micro_assessment',
      memory_key: memoryKey,
      memory_value: response,
      context: `Micro-assessment: ${assessmentType}`,
      importance_score: 3,
      metadata,
    });
  }

  /**
   * Save glimmer hunt data (daily visual/emotional capture)
   */
  async saveGlimmer(
    userId: string,
    emotion: string,
    note: string,
    reason: string,
    imagePath?: string
  ): Promise<NewMeUserMemory | null> {
    const memoryKey = `glimmer_${new Date().toISOString().split('T')[0]}`;
    const metadata = {
      emotion,
      note,
      reason,
      image_path: imagePath,
      glimmer_date: new Date().toISOString(),
    };

    return this.saveMemory({
      user_id: userId,
      memory_type: 'glimmer',
      memory_key: memoryKey,
      memory_value: note,
      context: `Daily glimmer: ${emotion}`,
      importance_score: 4,
      metadata,
    });
  }

  /**
   * Save authenticity pattern (lies/truths tracking)
   */
  async saveAuthenticityPattern(
    userId: string,
    context: string,
    fakedFeeling: string,
    realFeeling: string
  ): Promise<NewMeUserMemory | null> {
    const memoryKey = `authenticity_${Date.now()}`;
    const metadata = {
      context,
      faked_feeling: fakedFeeling,
      real_feeling: realFeeling,
      pattern_date: new Date().toISOString(),
    };

    return this.saveMemory({
      user_id: userId,
      memory_type: 'authenticity_pattern',
      memory_key: memoryKey,
      memory_value: fakedFeeling,
      context: `Authenticity pattern: ${context}`,
      importance_score: 5,
      metadata,
    });
  }

  /**
   * Get memory bombs - memories from 14+ days ago for deployment
   */
  async getMemoryBombs(userId: string, daysAgo: number = 14): Promise<NewMeUserMemory[]> {
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - daysAgo);
      
      const { data, error } = await supabase
        .from('newme_user_memories')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .lte('created_at', targetDate.toISOString())
        .gte('importance_score', 3)
        .order('importance_score', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as unknown as NewMeUserMemory[];
    } catch (error) {
      console.error('Error fetching memory bombs:', error);
      return [];
    }
  }

  /**
   * Get glimmer patterns for analysis
   */
  async getGlimmerPatterns(userId: string, days: number = 30): Promise<GlimmerPattern[]> {
    try {
      const { data, error } = await supabase
        .from('newme_user_memories')
        .select('memory_value, metadata, created_at')
        .eq('user_id', userId)
        .eq('memory_type', 'glimmer')
        .eq('is_active', true)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by memory_value (note) and analyze patterns
      const patterns: { [key: string]: GlimmerPattern } = {};
      data?.forEach((memory: { memory_value: string; metadata: { emotion?: string }; created_at: string }) => {
        const note = memory.memory_value;
        if (!patterns[note]) {
          patterns[note] = {
            note,
            frequency: 0,
            emotions: [],
            dates: [],
          };
        }
        patterns[note].frequency++;
        if (memory.metadata?.emotion) {
          patterns[note].emotions.push(memory.metadata.emotion);
        }
        patterns[note].dates.push(memory.created_at);
      });

      // Return patterns with frequency >= 3
      return Object.values(patterns).filter((pattern: GlimmerPattern) => pattern.frequency >= 3);
    } catch (error) {
      console.error('Error fetching glimmer patterns:', error);
      return [];
    }
  }

  /**
   * Get authenticity patterns for analysis
   */
  async getAuthenticityPatterns(userId: string, days: number = 30): Promise<AuthenticityPattern[]> {
    try {
      const { data, error } = await supabase
        .from('newme_user_memories')
        .select('metadata, created_at')
        .eq('user_id', userId)
        .eq('memory_type', 'authenticity_pattern')
        .eq('is_active', true)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as AuthenticityPattern[]) || [];
    } catch (error) {
      console.error('Error fetching authenticity patterns:', error);
      return [];
    }
  }

  /**
   * Get micro-assessment patterns
   */
  async getMicroAssessmentPatterns(userId: string, assessmentType?: string): Promise<MicroAssessmentPattern[]> {
    try {
      let query = supabase
        .from('newme_user_memories')
        .select('memory_key, memory_value, metadata, created_at')
        .eq('user_id', userId)
        .eq('memory_type', 'micro_assessment')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (assessmentType) {
        query = query.eq('metadata->>assessment_type', assessmentType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as MicroAssessmentPattern[]) || [];
    } catch (error) {
      console.error('Error fetching micro-assessment patterns:', error);
      return [];
    }
  }

  /**
   * Build advanced context for provocative conversations
   */
  async buildAdvancedContext(userId: string): Promise<string> {
    const context: string[] = [];
    
    // Get memory bombs
    const memoryBombs = await this.getMemoryBombs(userId);
    if (memoryBombs.length > 0) {
      context.push(`\n### MEMORY BOMBS AVAILABLE:`);
      memoryBombs.forEach((memory, index) => {
        context.push(`${index + 1}. ${memory.memory_type}: ${memory.memory_value} (${memory.context})`);
      });
    }

    // Get glimmer patterns
    const glimmerPatterns = await this.getGlimmerPatterns(userId);
    if (glimmerPatterns.length > 0) {
      context.push(`\n### GLIMMER PATTERNS:`);
      glimmerPatterns.forEach((pattern: GlimmerPattern) => {
        context.push(`- ${pattern.note}: ${pattern.frequency} times (emotions: ${pattern.emotions.join(', ')})`);
      });
    }

    // Get authenticity patterns
    const authPatterns = await this.getAuthenticityPatterns(userId);
    if (authPatterns.length > 0) {
      context.push(`\n### AUTHENTICITY PATTERNS:`);
      authPatterns.slice(0, 3).forEach((pattern: AuthenticityPattern) => {
        const meta = pattern.metadata;
        context.push(`- Context: ${meta?.context}, Faked: ${meta?.faked_feeling}, Real: ${meta?.real_feeling}`);
      });
    }

    return context.join('\n');
  }
}

export const newMeMemoryService = new NewMeMemoryService();