import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';
import { NewmeConversations } from '@/integrations/supabase/tables/newme_conversations';
import { NewmeUserMemories } from '@/integrations/supabase/tables/newme_user_memories';
import { NewmeAssessmentTracking } from '@/integrations/supabase/tables/newme_assessment_tracking';
import { NewmeMessages } from '@/integrations/supabase/tables/newme_messages';
import { Json, Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { PostgrestError } from '@supabase/supabase-js'; // Import PostgrestError

interface NewMeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface NewMeConversation {
  id: string;
  user_id: string;
  agent_id?: string | null;
  title?: string | null;
  messages: NewMeMessage[];
  created_at: string;
  updated_at: string;
}

interface UserMemory {
  id: string;
  user_id: string;
  memory_value: string;
  context: string | null;
  importance_score: number | null;
  last_referenced_at: string | null;
  reference_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AssessmentTracking {
  id: string;
  user_id: string;
  assessment_name: string;
  suggested_in_conversation_id: string | null;
  suggested_at: string;
  completion_status: 'suggested' | 'started' | 'completed' | 'dismissed';
  follow_up_discussed: boolean;
}

export class NewMeMemoryService {
  private static instance: NewMeMemoryService;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): NewMeMemoryService {
    if (!NewMeMemoryService.instance) {
      NewMeMemoryService.instance = new NewMeMemoryService();
    }
    return NewMeMemoryService.instance;
  }

  async getUserContext(userId: string): Promise<Json | null> {
    try {
      const { data, error } = await supabase.rpc('get_newme_user_context', {
        p_user_id: userId,
      });

      if (error) {
        logger.error('Error fetching user context:', error as unknown as Record<string, unknown>);
        return null;
      }
      return data;
    } catch (e) {
      logger.error('Exception fetching user context:', e);
      return null;
    }
  }

  async updateConversation(conversationId: string, updates: Partial<TablesUpdate<'newme_conversations'>>): Promise<Tables<'newme_conversations'>['Row'] | null> {
    try {
      const { data, error } = await supabase
        .from('newme_conversations')
        .update(updates)
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating conversation:', error as unknown as Record<string, unknown>);
        return null;
      }
      return data;
    } catch (e) {
      logger.error('Exception updating conversation:', e);
      return null;
    }
  }

  async logNewMessage(input: {
    conversation_id: string;
    sender: 'user' | 'assistant';
    text_content: string;
    emotion_data?: Json | null;
  }): Promise<void> {
    try {
      await supabase.from('newme_messages').insert({
        conversation_id: input.conversation_id,
        sender: input.sender,
        text_content: input.text_content,
        emotion_data: input.emotion_data || null,
        ts: new Date().toISOString(), // Add timestamp as it's a non-nullable column
      } as TablesInsert<'newme_messages'>); // Cast to Insert type

      // Update message count in conversation
      await supabase.rpc('increment_message_count', { conv_id: input.conversation_id });

    } catch (e) {
      logger.error('Error logging new message:', e);
    }
  }

  async upsertUserMemory(input: {
    user_id: string;
    memory_value: string;
    context?: string | null;
    importance_score?: number | null;
  }): Promise<UserMemory | null> {
    try {
      const { data: existingMemoryData } = await supabase
        .from('newme_user_memories')
        .select('*')
        .eq('user_id', input.user_id)
        .eq('memory_value', input.memory_value)
        .single();
      
      const existingMemory = existingMemoryData as Tables<'newme_user_memories'>['Row'] | null;

      if (existingMemory) {
        const { data, error } = await supabase
          .from('newme_user_memories')
          .update({
            memory_value: input.memory_value,
            context: input.context ?? existingMemory.context,
            importance_score: input.importance_score ?? existingMemory.importance_score,
            last_referenced_at: new Date().toISOString(),
            reference_count: Number(existingMemory.reference_count) + 1,
          } as TablesUpdate<'newme_user_memories'>) // Cast to Update type
          .eq('id', existingMemory.id);

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('newme_user_memories')
          .insert({
            user_id: input.user_id,
            memory_value: input.memory_value,
            context: input.context || null,
            importance_score: input.importance_score || null,
            last_referenced_at: new Date().toISOString(),
            reference_count: 1,
            is_active: true,
          } as TablesInsert<'newme_user_memories'>) // Cast to Insert type
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (e) {
      logger.error('Error upserting user memory:', e);
      return null;
    }
  }

  async deactivateUserMemory(memoryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('newme_user_memories')
        .update({ is_active: false } as TablesUpdate<'newme_user_memories'>) // Cast to Update type
        .eq('id', memoryId);

      if (error) throw error;
    } catch (e) {
      logger.error('Error deactivating user memory:', e);
    }
  }

  async trackAssessmentSuggestion(userId: string, assessmentName: string, conversationId: string): Promise<AssessmentTracking | null> {
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
        } as TablesInsert<'newme_assessment_tracking'>) // Cast to Insert type
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      logger.error('Error tracking assessment suggestion:', e);
      return null;
    }
  }

  async updateAssessmentTracking(trackingId: string, updates: Partial<TablesUpdate<'newme_assessment_tracking'>>): Promise<AssessmentTracking | null> {
    try {
      const { data, error } = await supabase
        .from('newme_assessment_tracking')
        .update(updates)
        .eq('id', trackingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      logger.error('Error updating assessment tracking:', e);
      return null;
    }
  }
}