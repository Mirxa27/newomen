import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';
import { Json, Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type NewMeMessageInsert = TablesInsert<'newme_messages'>;

export class NewMeMemoryService {
  private static instance: NewMeMemoryService;

  private constructor() {}

  public static getInstance(): NewMeMemoryService {
    if (!NewMeMemoryService.instance) {
      NewMeMemoryService.instance = new NewMeMemoryService();
    }
    return NewMeMemoryService.instance;
  }

  public async getUserContext(userId: string): Promise<Json | null> {
    try {
      const { data, error } = await supabase.rpc('get_newme_user_context', {
        p_user_id: userId,
      });
      if (error) throw error;
      return data;
    } catch (e) {
      logger.error('Error getting user context:', e);
      return null;
    }
  }

  public async updateConversation(conversationId: string, updates: Partial<Tables<'newme_conversations'>>) {
    try {
      const { error } = await supabase
        .from('newme_conversations')
        .update(updates as TablesUpdate<'newme_conversations'>)
        .eq('id', conversationId);
      if (error) throw error;
    } catch (e) {
      logger.error('Error updating conversation:', e);
    }
  }

  public async logNewMessage(input: {
    conversation_id: string;
    sender: 'user' | 'assistant' | 'system';
    text_content: string;
    metadata?: Json;
  }): Promise<void> {
    try {
      await supabase.from('newme_messages').insert({
        conversation_id: input.conversation_id,
        sender: input.sender,
        text_content: input.text_content,
        emotion_data: input.metadata,
        ts: new Date().toISOString(),
      } as NewMeMessageInsert);

      await supabase.rpc('increment_message_count', { conv_id: input.conversation_id });
    } catch (e) {
      logger.error('Error logging new message:', e);
    }
  }

  public async upsertUserMemory(input: {
    user_id: string;
    memory_value: string;
    context: string;
    importance_score: number;
  }): Promise<void> {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('newme_user_memories')
        .select('id, reference_count')
        .eq('user_id', input.user_id)
        .eq('memory_value', input.memory_value)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (existing) {
        await supabase
          .from('newme_user_memories')
          .update({
            context: input.context,
            importance_score: input.importance_score,
            last_referenced_at: new Date().toISOString(),
            reference_count: (existing.reference_count || 0) + 1,
          } as TablesUpdate<'newme_user_memories'>)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('newme_user_memories')
          .insert({
            user_id: input.user_id,
            memory_value: input.memory_value,
            context: input.context,
            importance_score: input.importance_score,
          } as TablesInsert<'newme_user_memories'>);
      }
    } catch (e) {
      logger.error('Error upserting user memory:', e);
    }
  }

  public async deactivateUserMemory(memoryId: string): Promise<void> {
    try {
      await supabase
        .from('newme_user_memories')
        .update({ is_active: false })
        .eq('id', memoryId);
    } catch (e) {
      logger.error('Error deactivating user memory:', e);
    }
  }

  public async trackAssessmentSuggestion(
    userId: string,
    assessmentName: string,
    conversationId: string
  ): Promise<void> {
    try {
      await supabase
        .from('newme_assessment_tracking')
        .insert({
          user_id: userId,
          assessment_name: assessmentName,
          suggested_in_conversation_id: conversationId,
          suggested_at: new Date().toISOString(),
          completion_status: 'suggested',
          follow_up_discussed: false,
        } as TablesInsert<'newme_assessment_tracking'>);
    } catch (e) {
      logger.error('Error tracking assessment suggestion:', e);
    }
  }

  public async updateAssessmentTracking(
    trackingId: string,
    updates: Partial<Tables<'newme_assessment_tracking'>>
  ): Promise<void> {
    try {
      await supabase
        .from('newme_assessment_tracking')
        .update(updates as TablesUpdate<'newme_assessment_tracking'>)
        .eq('id', trackingId);
    } catch (e) {
      logger.error('Error updating assessment tracking:', e);
    }
  }
}

export const newMeMemoryService = NewMeMemoryService.getInstance();