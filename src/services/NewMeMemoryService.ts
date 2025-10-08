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
} from '@/types/newme-memory-types';

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
        .insert(input as any)
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
        .update(updates as any)
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
        .insert(input as any)
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
          } as any)
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
        .insert(input as any)
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
        .update(updates as any)
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
}

export const newMeMemoryService = new NewMeMemoryService();