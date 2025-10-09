import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserProfile } from './useUserProfile';
import { newMeMemoryService } from '@/services/NewMeMemoryService';
import { Json, Tables, TablesInsert } from '@/integrations/supabase/types';

type Conversation = Tables<'newme_conversations'>;
type Message = Tables<'newme_messages'>;

interface UIMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: string;
}

export function useChat() {
  const { profile } = useUserProfile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('newme_conversations')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      setConversations(data || []);
      if (data && data.length > 0) {
        await loadConversation(data[0].id);
      }
    } catch (e) {
      toast.error('Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const loadConversation = useCallback(async (conversationId: string) => {
    setLoading(true);
    try {
      const { data: convoData, error: convoError } = await supabase
        .from('newme_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      if (convoError) throw convoError;
      setActiveConversation(convoData);

      const { data: messagesData, error: messagesError } = await supabase
        .from('newme_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('ts', { ascending: true });
      if (messagesError) throw messagesError;
      
      setMessages((messagesData || []).map((m: Message): UIMessage => ({
        id: m.id,
        content: m.text_content || '',
        sender: m.sender as 'user' | 'assistant' | 'system',
        timestamp: m.ts || new Date().toISOString(),
      })));
    } catch (e) {
      toast.error('Failed to load conversation details.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createNewConversation = useCallback(async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('newme_conversations')
        .insert({ user_id: profile.user_id, title: 'New Conversation' } as TablesInsert<'newme_conversations'>)
        .select()
        .single();
      if (error) throw error;
      await loadConversations();
      await loadConversation(data.id);
    } catch (e) {
      toast.error('Failed to create a new conversation.');
    }
  }, [profile, loadConversations, loadConversation]);

  useEffect(() => {
    if (profile) {
      void loadConversations();
    }
  }, [profile, loadConversations]);

  const sendMessage = useCallback(async (content: string) => {
    if (!profile || !activeConversation) return;
    setIsSending(true);
    try {
      await newMeMemoryService.logNewMessage({
        conversation_id: activeConversation.id,
        sender: 'user',
        text_content: content,
      });

      // Simulate AI response
      const aiResponseContent = `Echo: ${content}`;
      await newMeMemoryService.logNewMessage({
        conversation_id: activeConversation.id,
        sender: 'assistant',
        text_content: aiResponseContent,
      });

      // Refresh messages
      await loadConversation(activeConversation.id);
    } catch (e) {
      toast.error("Failed to send message.");
    } finally {
      setIsSending(false);
    }
  }, [profile, activeConversation, loadConversation]);

  return {
    conversations,
    activeConversation,
    messages,
    loading,
    isSending,
    loadConversation,
    createNewConversation,
    sendMessage,
  };
}