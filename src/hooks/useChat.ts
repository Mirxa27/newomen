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
        // Final message is handled by audio_transcript.done to ensure sync
        break;

      case 'response.audio_transcript.done':
        if (event.transcript) {
          setMessages(prev => [...prev, { role: 'assistant', content: event.transcript!, timestamp: new Date() }]);
          if (conversationIdRef.current) {
            void newMeMemoryService.addMessage({ conversation_id: conversationIdRef.current, role: 'assistant', content: event.transcript });
          }
        }
        setPartialTranscript(""); // Clear partial transcript after final message
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

  const startConversation = useCallback(async () => {
    let conversationStarted = false;
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
      const chatOptions: RealtimeChatOptions = {
        systemPrompt: NEWME_SYSTEM_PROMPT,
        voice: "marin",
        modalities: ["audio", "text"],
        onAudioLevel: setAudioLevel,
        userId: user?.id,
      };

      const { data: activeAgentData } = await supabase.from('agents').select('id, voices:voices(voice_id, name), models:models(model_id)').eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (activeAgentData) {
        const activeAgent = activeAgentData as ActiveAgentConfig;
        chatOptions.agentId = activeAgent.id;
        const preferredVoice = activeAgent.voices?.voice_id || activeAgent.voices?.name;
        if (preferredVoice) chatOptions.voice = preferredVoice;
        if (activeAgent.models?.model_id) chatOptions.model = activeAgent.models.model_id;
      }

      if (user) {
        const [profileRes, memoryContext] = await Promise.all([
          supabase.from('user_profiles').select('nickname').eq('user_id', user.id).single(),
          newMeMemoryService.getUserContext(user.id)
        ]);

        if (profileRes.error) throw profileRes.error;
        const profile = profileRes.data;

        let finalContext = memoryContext;

        if (profile?.nickname && profile.nickname !== memoryContext?.nickname) {
          await newMeMemoryService.saveMemory({
            user_id: user.id,
            memory_type: 'personal_detail',
            memory_key: 'nickname',
            memory_value: profile.nickname,
            importance_score: 10,
          });
          finalContext = { ...finalContext, nickname: profile.nickname };
        }

        const greeting = await getNewMeGreeting(user.id, finalContext);
        chatOptions.memoryContext = buildSessionContext(finalContext);
        chatOptions.initialGreeting = greeting;
        
        const conversation = await newMeMemoryService.createConversation({ user_id: user.id, topics_discussed: [], emotional_tone: 'warm' });
        if (conversation?.id) {
          conversationIdRef.current = conversation.id;
          conversationStarted = true;
        }
      }

      if (!chatOptions.initialGreeting) {
        chatOptions.initialGreeting = "Hey there... I'm NewMe. I'm so glad you're here. I've been waiting to meet you.";
      }

      chatRef.current = new RealtimeChat(handleMessage, chatOptions);
      await chatRef.current.init(true); // Start with recorder paused
      setIsConnected(true);
      setIsRecording(false); // User is not recording by default

      if (durationInterval.current) clearInterval(durationInterval.current);
      durationInterval.current = setInterval(() => setDuration(prev => prev + 1), 1000);

      toast({ title: "Connected", description: "Your conversation with NewMe has started" });
    } catch (error) {
      if (conversationStarted && conversationIdRef.current) {
        void newMeMemoryService.updateConversation(conversationIdRef.current, { ended_at: new Date().toISOString(), duration_seconds: 0 });
        conversationIdRef.current = null;
      }
      let errorMessage = error instanceof Error ? error.message : 'Failed to start conversation';
      if (errorMessage.includes('Permission denied')) errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
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