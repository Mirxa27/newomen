import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChat, RealtimeChatOptions } from '@/utils/RealtimeAudio';
import { supabase } from '@/integrations/supabase/client';
import { trackConversationCompletion } from '@/lib/gamification-events';
import { NEWME_SYSTEM_PROMPT } from '@/config/newme-system-prompt';
import { newMeMemoryService } from '@/services/NewMeMemoryService';
import { getNewMeGreeting } from '@/services/ai/newme/newmeService';
import type { NewMeUserContext } from '@/types/newme-memory-types';
import type { User } from '@supabase/supabase-js';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatEvent {
  type: 'response.text.delta' | 'response.text.done' | 'response.audio.started' | 'response.audio.ended' | 'response.audio_transcript.delta' | 'response.audio_transcript.done' | 'conversation.item.input_audio_transcription.completed' | 'error';
  delta?: string;
  transcript?: string;
  item?: { id: string; status: string };
  error?: { message: string };
}

type ActiveAgentConfig = {
  id: string;
  voices?: { voice_id?: string | null; name?: string | null } | null;
  models?: { model_id?: string | null } | null;
};

const buildSessionContext = (context: NewMeUserContext | null): string => {
  if (!context) return "";
  const lines: string[] = [];
  if (context.nickname) lines.push(`- The user's preferred nickname is "${context.nickname}". Use it warmly throughout the conversation.`);
  if (context.last_conversation_date) {
    const daysSince = newMeMemoryService.calculateDaysSinceLastConversation(context.last_conversation_date);
    if (daysSince === 0) lines.push("- You spoke with them earlier today. Pick up the thread naturally as if no time has passed.");
    else if (daysSince === 1) lines.push("- It has been 1 day since your last conversation. Acknowledge the brief gap with warmth.");
    else if (daysSince < 999) lines.push(`- It has been ${daysSince} days since you last spoke. Mention this gap with affection when you greet them.`);
  }
  if (context.last_conversation_topic) lines.push(`- Last conversation topic: ${context.last_conversation_topic}. Reference it in your opening memory weave.`);
  if (context.emotional_patterns?.length) lines.push(`- Recurring emotional themes to keep in mind: ${context.emotional_patterns.slice(0, 3).join(', ')}.`);
  if (context.completed_assessments?.length) lines.push(`- They have completed these assessments: ${context.completed_assessments.join(', ')}. Use them to ground insights.`);
  if (context.important_memories?.length) {
    const memorySnippets = context.important_memories.slice(0, 3).map((memory) => `${memory.type}: ${memory.value}`);
    lines.push(`- Important memories to naturally weave into conversation: ${memorySnippets.join('; ')}.`);
  }
  return lines.length ? `### SESSION CONTEXT\n${lines.join('\n')}` : "";
};

export function useChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const chatRef = useRef<RealtimeChat | null>(null);
  const durationInterval = useRef<NodeJS.Timeout>();
  const conversationIdRef = useRef<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleMessage = useCallback((event: ChatEvent) => {
    console.log('Event from AI:', event.type);

    switch (event.type) {
      case 'response.text.delta':
        setPartialTranscript(prev => prev + (event.delta || ''));
        break;

      case 'response.audio.started':
        setIsSpeaking(true);
        break;

      case 'response.audio.ended':
        setIsSpeaking(false);
        break;

      case 'response.audio_transcript.done':
        if (event.transcript) {
          setMessages(prev => [...prev, { role: 'assistant', content: event.transcript!, timestamp: new Date() }]);
          if (conversationIdRef.current) {
            void newMeMemoryService.addMessage({ conversation_id: conversationIdRef.current, role: 'assistant', content: event.transcript });
          }
        }
        setPartialTranscript("");
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) {
          setMessages(prev => [...prev, { role: 'user', content: event.transcript!, timestamp: new Date() }]);
          if (conversationIdRef.current) {
            void newMeMemoryService.addMessage({ conversation_id: conversationIdRef.current, role: 'user', content: event.transcript });
          }
        }
        break;

      case 'error':
        console.error('OpenAI error:', event);
        toast({ title: "Error", description: event.error?.message || "An error occurred", variant: "destructive" });
        break;
    }
  }, [toast]);

  const setupConversation = async (user: User) => {
    const [profileRes, memoryContext] = await Promise.all([
      supabase.from('user_profiles').select('nickname, user_id, role, subscription_tier, remaining_minutes').eq('user_id', user.id).single(),
      newMeMemoryService.getUserContext(user.id)
    ]);

    if (profileRes.error && profileRes.error.code !== 'PGRST116') throw profileRes.error;

    // If there's no profile row yet, create a minimal one so realtime-token can validate subscriptions
    if (!profileRes.data) {
      try {
        const insertPayload = {
          user_id: user.id,
          email: user.email!,
          nickname: user.user_metadata?.full_name || null,
          role: 'member',
          subscription_tier: 'discovery',
          remaining_minutes: 10
        };

        const { data: upserted, error: upsertError } = await supabase.from('user_profiles').upsert(insertPayload as any, { onConflict: 'user_id' }).select().single();
        if (upsertError) {
          console.warn('Failed to upsert user_profiles for user, continuing without it', upsertError);
        } else {
          // Replace profileRes.data with the inserted row so downstream logic has it
          profileRes.data = upserted;
        }
      } catch (e) {
        console.warn('Unexpected error upserting user_profiles, continuing', e);
      }
    }

    let finalContext = memoryContext;
    const profileNickname = (profileRes as any).data ? (profileRes as any).data.nickname : null;

    if (profileNickname && profileNickname !== memoryContext?.nickname) {
        await newMeMemoryService.saveMemory({
            user_id: user.id,
            memory_type: 'personal_detail',
            memory_key: 'nickname',
            memory_value: profileNickname,
            importance_score: 10,
        });
        finalContext = { ...finalContext, nickname: profileNickname };
    }

    const greeting = getNewMeGreeting(finalContext);
    const sessionContext = buildSessionContext(finalContext);

    const conversation = await newMeMemoryService.createConversation({ user_id: user.id });
    if (conversation) {
        conversationIdRef.current = conversation.id;
    }

    return { greeting, sessionContext };
  };

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.WebSocket) {
        throw new Error("Your browser doesn't support the required real-time communication features.");
      }

      chatRef.current?.disconnect();
      conversationIdRef.current = null;
      setMessages([]);
      setPartialTranscript("");
      setDuration(0);
      setIsSpeaking(false);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.id) {
        toast({ title: "Sign in required", description: "Please sign in to continue your voice session.", variant: "destructive" });
        setIsConnecting(false);
        return;
      }

      const chatOptions: RealtimeChatOptions = {
        systemPrompt: NEWME_SYSTEM_PROMPT,
        voice: "merin",
        modalities: ["audio", "text"],
        onAudioLevel: setAudioLevel,
        userId: user.id,
      };

      const { data: activeAgentData } = await supabase.from('agents').select('id, voices:voices(voice_id, name), models:models(model_id)').eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (activeAgentData) {
        const activeAgent = activeAgentData as ActiveAgentConfig;
        chatOptions.agentId = activeAgent.id;
        const preferredVoice = activeAgent.voices?.voice_id || activeAgent.voices?.name;
        if (preferredVoice) chatOptions.voice = preferredVoice;
        if (activeAgent.models?.model_id) chatOptions.model = activeAgent.models.model_id;
      }

      const { greeting, sessionContext } = await setupConversation(user);
      chatOptions.initialGreeting = greeting;
      chatOptions.memoryContext = sessionContext;

      chatRef.current = new RealtimeChat(handleMessage, chatOptions);
      await chatRef.current.init(true);
      setIsConnected(true);
      setIsRecording(false);

      if (durationInterval.current) clearInterval(durationInterval.current);
      durationInterval.current = setInterval(() => setDuration(prev => prev + 1), 1000);

      toast({ title: "Connected", description: "Your conversation with NewMe has started" });
    } catch (error) {
      if (conversationIdRef.current) {
        void newMeMemoryService.updateConversation(conversationIdRef.current, { ended_at: new Date().toISOString(), duration_seconds: 0 });
        conversationIdRef.current = null;
      }
      let errorMessage = error instanceof Error ? error.message : 'Failed to start conversation';
      if (errorMessage.includes('Permission denied')) errorMessage = 'Microphone access denied. Please allow microphone access and try again.';

      // Enhanced error logging
      console.error("Full connection error object:", error);
      if (error && typeof error === 'object' && 'context' in error) {
        const err = error as { context?: { response?: Response } };
        if (err.context?.response) {
          const clonedResponse = err.context.response.clone();
          clonedResponse.json().then((json: { error?: string; code?: string }) => {
            console.error("Connection failed response body:", json);
            if (json.error) {
              errorMessage = `${json.error} (Code: ${json.code || 'N/A'})`;
            }
          }).catch(() => {
            clonedResponse.text().then((text: string) => {
              console.error("Connection failed response text:", text);
            });
          });
        }
      }

      toast({ title: "Connection Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsConnecting(false);
    }
  }, [handleMessage, toast]);

  const endConversation = useCallback(async () => {
    chatRef.current?.disconnect();
    setIsConnected(false);
    setIsSpeaking(false);
    setIsRecording(false);
    if (durationInterval.current) clearInterval(durationInterval.current);

    const activeConversationId = conversationIdRef.current;
    if (activeConversationId) {
      void newMeMemoryService.updateConversation(activeConversationId, { ended_at: new Date().toISOString(), duration_seconds: duration, message_count: messages.length });
      conversationIdRef.current = null;
    }

    toast({ title: "Session Ended", description: `Duration: ${Math.floor(duration / 60)}m ${duration % 60}s` });

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      void trackConversationCompletion(user.id, activeConversationId ?? `conv_${new Date().getTime()}`);
    }
  }, [duration, messages.length, toast]);

  const handleSendText = useCallback(async (text: string) => {
    try {
      await chatRef.current?.sendMessage(text);
      setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date() }]);
      if (conversationIdRef.current) {
        void newMeMemoryService.addMessage({ conversation_id: conversationIdRef.current, role: 'user', content: text });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
  }, [toast]);

  const toggleRecording = useCallback(() => {
    const newRecordingState = !isRecording;
    chatRef.current?.toggleRecording(newRecordingState);
    setIsRecording(newRecordingState);
  }, [isRecording]);

  const toggleSpeakerMute = useCallback(() => {
    const newMuteState = !isSpeakerMuted;
    chatRef.current?.toggleSpeakerMute(newMuteState);
    setIsSpeakerMuted(newMuteState);
  }, [isSpeakerMuted]);

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
      if (durationInterval.current) clearInterval(durationInterval.current);
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    isSpeaking,
    isRecording,
    isSpeakerMuted,
    messages,
    partialTranscript,
    duration,
    audioLevel,
    startConversation,
    endConversation,
    handleSendText,
    toggleRecording,
    toggleSpeakerMute,
    navigate,
  };
}
