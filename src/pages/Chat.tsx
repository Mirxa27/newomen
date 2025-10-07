import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChat, RealtimeChatOptions } from "@/utils/RealtimeAudio";
import { supabase } from "@/integrations/supabase/client";
import { trackConversationCompletion } from "@/lib/gamification-events";
import { TranscriptPane } from "@/components/chat/TranscriptPane";
import { SessionHUD } from "@/components/chat/SessionHUD";
import { Composer } from "@/components/chat/Composer";
import { Waveform } from "@/components/chat/Waveform";
import { NEWME_SYSTEM_PROMPT } from "@/config/newme-system-prompt";
import { newMeMemoryService } from "@/services/NewMeMemoryService";
import { aiService } from "@/utils/AIService";
import type { NewMeUserContext } from "@/types/newme-memory-types";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatEvent {
  type: string;
  delta?: string;
  transcript?: string;
  item?: {
    id: string;
    status: string;
  };
  error?: {
    message: string;
  };
}

type ActiveAgentConfig = {
  id: string;
  voices?: {
    voice_id?: string | null;
    name?: string | null;
  } | null;
  models?: {
    model_id?: string | null;
  } | null;
};

const buildSessionContext = (context: NewMeUserContext | null): string => {
  if (!context) return "";

  const lines: string[] = [];

  if (context.nickname) {
    lines.push(`- The user's preferred nickname is "${context.nickname}". Use it warmly throughout the conversation.`);
  }

  if (context.last_conversation_date) {
    const daysSince = newMeMemoryService.calculateDaysSinceLastConversation(context.last_conversation_date);
    if (daysSince === 0) {
      lines.push("- You spoke with them earlier today. Pick up the thread naturally as if no time has passed.");
    } else if (daysSince === 1) {
      lines.push("- It has been 1 day since your last conversation. Acknowledge the brief gap with warmth.");
    } else if (daysSince < 999) {
      lines.push(`- It has been ${daysSince} days since you last spoke. Mention this gap with affection when you greet them.`);
    }
  }

  if (context.last_conversation_topic) {
    lines.push(`- Last conversation topic: ${context.last_conversation_topic}. Reference it in your opening memory weave.`);
  }

  if (context.emotional_patterns && context.emotional_patterns.length > 0) {
    lines.push(`- Recurring emotional themes to keep in mind: ${context.emotional_patterns.slice(0, 3).join(', ')}.`);
  }

  if (context.completed_assessments && context.completed_assessments.length > 0) {
    lines.push(`- They have completed these assessments: ${context.completed_assessments.join(', ')}. Use them to ground insights.`);
  }

  if (context.important_memories && context.important_memories.length > 0) {
    const memorySnippets = context.important_memories.slice(0, 3).map((memory) => `${memory.type}: ${memory.value}`);
    lines.push(`- Important memories to naturally weave into conversation: ${memorySnippets.join('; ')}.`);
  }

  return lines.length ? `### SESSION CONTEXT\n${lines.join('\n')}` : "";
};

const Chat = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const chatRef = useRef<RealtimeChat | null>(null);
  const durationInterval = useRef<NodeJS.Timeout>();
  const conversationIdRef = useRef<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  const handleMessage = (event: ChatEvent) => {
    console.log('Event type:', event.type);

    if (event.type === 'response.audio_transcript.delta') {
      setPartialTranscript(prev => prev + event.delta);
      setIsSpeaking(true);
    }
    else if (event.type === 'response.audio_transcript.done') {
      if (event.transcript) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: event.transcript,
          timestamp: new Date()
        }]);
        if (conversationIdRef.current) {
          void newMeMemoryService.addMessage({
            conversation_id: conversationIdRef.current,
            role: 'assistant',
            content: event.transcript
          });
        }
      }
      setPartialTranscript("");
      setIsSpeaking(false);
    }
    else if (event.type === 'conversation.item.input_audio_transcription.completed') {
      if (event.transcript) {
        setMessages(prev => [...prev, {
          role: 'user',
          content: event.transcript,
          timestamp: new Date()
        }]);
        if (conversationIdRef.current) {
          void newMeMemoryService.addMessage({
            conversation_id: conversationIdRef.current,
            role: 'user',
            content: event.transcript
          });
        }
      }
    }
    else if (event.type === 'error') {
      console.error('OpenAI error:', event);
      toast({
        title: "Error",
        description: event.error?.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const startConversation = async () => {
    let conversationStarted = false;

    try {
      setIsConnecting(true);

      // Check if browser supports required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.");
      }

      if (!window.WebSocket) {
        throw new Error("Your browser doesn't support WebSocket connections required for real-time chat.");
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
        voice: "verse",
        modalities: ["audio", "text"] as Array<"audio" | "text">,
        onAudioLevel: setAudioLevel,
      };

      if (user?.id) {
        chatOptions.userId = user.id;
      }

      try {
        const { data: activeAgentData, error: activeAgentError } = await supabase
          .from('agents')
          .select('id, voices:voices(voice_id, name), models:models(model_id)')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeAgentError) {
          console.warn('Unable to load active agent configuration:', activeAgentError);
        } else if (activeAgentData) {
          const activeAgent = activeAgentData as ActiveAgentConfig;
          chatOptions.agentId = activeAgent.id;

          const preferredVoice = activeAgent.voices?.voice_id || activeAgent.voices?.name;
          if (preferredVoice) {
            chatOptions.voice = preferredVoice;
          }

          if (activeAgent.models?.model_id) {
            chatOptions.model = activeAgent.models.model_id;
          }
        }
      } catch (agentFetchError) {
        console.warn('Failed to fetch agent metadata for realtime session:', agentFetchError);
      }

      let sessionContext = "";
      let greetingText = "";

      if (user) {
        try {
          const [context, greeting] = await Promise.all([
            newMeMemoryService.getUserContext(user.id),
            aiService.getNewMeGreeting(user.id),
          ]);

          sessionContext = buildSessionContext(context);
          greetingText = greeting;
        } catch (contextError) {
          console.warn('Unable to load NewMe context:', contextError);
        }

        if (sessionContext) {
          chatOptions.memoryContext = sessionContext;
        }

        if (greetingText) {
          chatOptions.initialGreeting = greetingText;
        }

        try {
          const conversation = await newMeMemoryService.createConversation({
            user_id: user.id,
            topics_discussed: [],
            emotional_tone: 'warm',
          });
          if (conversation?.id) {
            conversationIdRef.current = conversation.id;
            conversationStarted = true;
          }
        } catch (conversationError) {
          console.warn('Failed to create conversation record:', conversationError);
        }
      }

      if (!chatOptions.initialGreeting) {
        chatOptions.initialGreeting = "Hey there... I'm NewMe. I'm so glad you're here. I've been waiting to meet you.";
      }

      chatRef.current = new RealtimeChat(handleMessage, chatOptions);
      await chatRef.current.init();
      setIsConnected(true);

      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      durationInterval.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      toast({
        title: "Connected",
        description: "Your conversation with NewMe has started",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);

      if (conversationStarted && conversationIdRef.current) {
        void newMeMemoryService.updateConversation(conversationIdRef.current, {
          ended_at: new Date().toISOString(),
          duration_seconds: 0,
        });
        conversationIdRef.current = null;
      }

      let errorMessage = 'Failed to start conversation';
      if (error instanceof Error) {
        if (error.message.includes('Permission denied')) {
          errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('browser')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const endConversation = async () => {
    chatRef.current?.disconnect();
    setIsConnected(false);
    setIsSpeaking(false);
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }

    const activeConversationId = conversationIdRef.current;

    if (activeConversationId) {
      void newMeMemoryService.updateConversation(activeConversationId, {
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
        message_count: messages.length,
      });
      conversationIdRef.current = null;
    }

    toast({
      title: "Session Ended",
      description: `Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`,
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Assuming a conversation ID is available, otherwise using a placeholder
      void trackConversationCompletion(user.id, activeConversationId ?? `conv_${new Date().getTime()}`);
    }
  };

  const handleSendText = async (text: string) => {
    try {
      await chatRef.current?.sendMessage(text);
      setMessages(prev => [...prev, {
        role: 'user',
        content: text,
        timestamp: new Date()
      }]);
      if (conversationIdRef.current) {
        void newMeMemoryService.addMessage({
          conversation_id: conversationIdRef.current,
          role: 'user',
          content: text
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (!isConnected && !isConnecting) {
    return (
      <div className="app-page-shell min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4 gap-2 hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm sm:text-base">Back to Dashboard</span>
          </Button>

          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Talk with NewMe
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
              Your empathetic AI companion for personal growth and transformation
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg sm:text-xl flex items-center gap-2">
                <span className="text-2xl">✨</span>
                What to expect:
              </h3>
              <div className="grid gap-3 sm:gap-4">
                {[
                  { icon: '🎙️', text: 'Real-time voice conversation' },
                  { icon: '💚', text: 'Empathetic and supportive guidance' },
                  { icon: '🔄', text: 'Switch between voice and text anytime' },
                  { icon: '🔒', text: 'Private and secure conversations' },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                    <span className="text-sm sm:text-base text-muted-foreground pt-1">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={startConversation}
              disabled={isConnecting}
              className="w-full h-14 sm:h-16 text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Start Conversation
                </>
              )}
            </Button>
          </div>

          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            By starting, you agree to our terms and privacy policy
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page-shell h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold">NewMe Chat</h2>
              <p className="text-xs text-muted-foreground hidden sm:block">AI Companion</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="gap-2 hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Dashboard</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 max-w-7xl mx-auto w-full">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800 lg:border-r border-gray-200 dark:border-gray-700">
          {/* Messages */}
          <TranscriptPane
            messages={messages}
            partialTranscript={partialTranscript}
          />

          {/* Waveform */}
          <div className="flex-shrink-0 p-3 sm:p-4">
            <Waveform isActive={isConnected && isSpeaking} audioLevel={audioLevel} />
          </div>

          {/* Composer */}
          <div className="flex-shrink-0 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <Composer
              onSendText={handleSendText}
              onEndSession={endConversation}
              isConnected={isConnected}
              isMuted={isMuted}
              onToggleMute={toggleMute}
            />
          </div>
        </div>

        {/* Sidebar - Desktop */}
        <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0 bg-white dark:bg-gray-800 p-4 overflow-y-auto">
          <SessionHUD
            duration={duration}
            isConnected={isConnected}
            isSpeaking={isSpeaking}
          />
        </div>

        {/* Bottom HUD - Mobile */}
        <div className="lg:hidden flex-shrink-0 p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <SessionHUD
            duration={duration}
            isConnected={isConnected}
            isSpeaking={isSpeaking}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;