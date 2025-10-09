import { useState, useEffect, useCallback, useRef, Dispatch, SetStateAction } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NewMeMemoryService } from '@/services/NewMeMemoryService';
import { AIService } from '@/services/ai/aiService';
import { logger } from '@/lib/logging';
import { toast } from 'sonner';
import { NewmeConversations } from '@/integrations/supabase/tables/newme_conversations';
import { UserProfiles } from '@/integrations/supabase/tables/user_profiles';
import { NewmeMessages } from '@/integrations/supabase/tables/newme_messages';
import { Json } from '@/integrations/supabase/types';

export interface Message { // Exported Message interface
  id: string;
  content: string;
  sender: 'user' | 'assistant' | 'system'; // Added 'system' to sender type
  timestamp: string;
}

interface ChatState {
  conversation: NewmeConversations['Row'] | null;
  messages: Message[];
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  sendMessage: () => Promise<void>;
  loading: boolean;
  error: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  isConnected: boolean; // Added missing property
  isConnecting: boolean; // Added missing property
  startConversation: () => Promise<void>; // Added missing property
  isSpeaking: boolean; // Added missing property
  isRecording: boolean; // Added missing property
  isSpeakerMuted: boolean; // Added missing property
  toggleSpeakerMute: () => void; // Added missing property
  startRecording: () => void; // Added missing property
  stopRecording: () => void; // Added missing property
  audioLevel: number; // Added missing property
}

export function useChat(initialConversationId?: string): ChatState {
  const [conversation, setConversation] = useState<NewmeConversations['Row'] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Added missing states for ChatState interface
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const memoryService = NewMeMemoryService.getInstance();
  const aiService = AIService.getInstance();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = useCallback(async (convId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('newme_conversations')
        .select('*')
        .eq('id', convId)
        .single();

      if (error) throw error;
      if (!data) { // Explicit null check
        throw new Error('Conversation not found.');
      }
      setConversation(data);

      const { data: msgs, error: msgsError } = await supabase
        .from('newme_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('ts', { ascending: true });

      if (msgsError) throw msgsError;
      setMessages(msgs.map(m => ({
        id: m.id,
        content: m.text_content || '',
        sender: m.sender as 'user' | 'assistant' | 'system',
        timestamp: m.ts || '',
      })));
      setIsConnected(true); // Set connected status
    } catch (e) {
      logger.error('Error loading conversation:', e);
      setError(e instanceof Error ? e.message : 'Failed to load conversation.');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const startConversation = useCallback(async () => { // Added missing function
    setIsConnecting(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setError('User not logged in.');
        setIsConnecting(false);
        return;
      }
      setUserId(user.id);

      const { data: newConv, error: newConvError } = await supabase
        .from('newme_conversations')
        .insert({ user_id: user.id, title: 'New Conversation' } as NewmeConversations['Insert'])
        .select()
        .single();

      if (newConvError) throw newConvError;
      setConversation(newConv);
      setMessages([]);
      setIsConnected(true);
      toast.success('New conversation started!');
    } catch (e) {
      logger.error('Error starting new conversation:', e);
      setError(e instanceof Error ? e.message : 'Failed to start new conversation.');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const createOrLoadConversation = useCallback(async () => {
    setLoading(true);
    setIsConnecting(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setError('User not logged in.');
        setLoading(false);
        setIsConnecting(false);
        return;
      }
      setUserId(user.id);

      if (initialConversationId) {
        await loadConversation(initialConversationId);
        return;
      }

      const { data: existingConversations, error: convError } = await supabase
        .from('newme_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (convError) throw convError;

      if (existingConversations && existingConversations.length > 0) {
        await loadConversation(existingConversations[0].id);
      } else {
        await startConversation(); // Use the new startConversation function
      }
    } catch (e) {
      logger.error('Error creating/loading conversation:', e);
      setError(e instanceof Error ? e.message : 'Failed to create or load conversation.');
    } finally {
      setLoading(false);
      setIsConnecting(false);
    }
  }, [initialConversationId, loadConversation, startConversation]);

  useEffect(() => {
    void createOrLoadConversation();
  }, [createOrLoadConversation]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !conversation || !userId) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      content: input,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      await memoryService.logNewMessage({
        conversation_id: conversation.id,
        sender: 'user',
        text_content: userMessage.content,
      });

      const memoryContext = await memoryService.getUserContext(userId);
      const { data: profileData, error: profileError } = await supabase.from('user_profiles').select('nickname').eq('user_id', userId).single();

      if (profileError) throw profileError;

      let finalContext: Json = memoryContext || {};
      const profileNickname = profileData?.nickname;
      if (profileNickname) {
        finalContext = { ...(finalContext as Record<string, unknown>), nickname: profileNickname };
      }

      const aiResponse = await aiService.callAIProvider(
        aiService.getDefaultConfiguration()!, // Assuming default config is always available
        [
          { role: 'system', content: `You are NewMe, an empathetic AI companion for personal growth. Help the user feel seen, heard, and encouraged while guiding them with warmth and curiosity. User context: ${JSON.stringify(finalContext)}` },
          ...messages.map(m => ({ role: m.sender, content: m.content })),
          { role: 'user', content: userMessage.content },
        ]
      );

      const assistantMessage: Message = {
        id: `ai-${Date.now()}`,
        content: aiResponse.text || '', // Ensure content is string
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev.filter(m => m.id !== userMessage.id), userMessage, assistantMessage]);
      await memoryService.logNewMessage({
        conversation_id: conversation.id,
        sender: 'assistant',
        text_content: assistantMessage.content,
      });

      await memoryService.updateConversation(conversation.id, { last_message_at: new Date().toISOString() });

    } catch (e) {
      logger.error('Error sending message:', e);
      setError(e instanceof Error ? e.message : 'Failed to send message.');
      setMessages(prev => prev.filter(m => m.id !== userMessage.id)); // Remove temp message on error
    } finally {
      setLoading(false);
    }
  }, [input, conversation, userId, messages, memoryService, aiService]);

  const toggleSpeakerMute = useCallback(() => setIsSpeakerMuted(prev => !prev), []); // Added missing function
  const startRecording = useCallback(() => setIsRecording(true), []); // Added missing function
  const stopRecording = useCallback(() => setIsRecording(false), []); // Added missing function

  return {
    conversation,
    messages,
    input,
    setInput,
    sendMessage,
    loading,
    error,
    messagesEndRef,
    isConnected,
    isConnecting,
    startConversation,
    isSpeaking,
    isRecording,
    isSpeakerMuted,
    toggleSpeakerMute,
    startRecording,
    stopRecording,
    audioLevel,
  };
}