import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChat } from "@/utils/RealtimeAudio";
import { supabase } from "@/integrations/supabase/client";
import { trackConversationCompletion } from "@/lib/gamification-events";
import { TranscriptPane } from "@/components/chat/TranscriptPane";
import { SessionHUD } from "@/components/chat/SessionHUD";
import { Composer } from "@/components/chat/Composer";
import { Waveform } from "@/components/chat/Waveform";

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

const Chat = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [duration, setDuration] = useState(0);
  const chatRef = useRef<RealtimeChat | null>(null);
  const durationInterval = useRef<NodeJS.Timeout>();
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
    try {
      setIsConnecting(true);

      // Check if browser supports required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.");
      }

      if (!window.WebSocket) {
        throw new Error("Your browser doesn't support WebSocket connections required for real-time chat.");
      }

      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init();
      setIsConnected(true);

      durationInterval.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      toast({
        title: "Connected",
        description: "Your conversation with NewMe has started",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);

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
    toast({
      title: "Session Ended",
      description: `Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`,
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Assuming a conversation ID is available, otherwise using a placeholder
      void trackConversationCompletion(user.id, `conv_${new Date().getTime()}`);
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
      <div className="min-h-screen flex items-center justify-center space-responsive-md">
        <div className="card-responsive max-w-2xl w-full space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4 btn-responsive"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="text-center space-y-4">
            <h1 className="heading-responsive gradient-text">Talk with NewMe</h1>
            <p className="text-responsive-lg text-muted-foreground">
              Your empathetic AI companion for personal growth
            </p>
          </div>

          <div className="card-responsive space-y-3">
            <h3 className="font-semibold text-responsive-base">What to expect:</h3>
            <ul className="space-y-2 text-responsive-sm text-muted-foreground">
              <li>• Real-time voice conversation</li>
              <li>• Empathetic and supportive guidance</li>
              <li>• Switch between voice and text anytime</li>
              <li>• Your conversation is private and secure</li>
            </ul>
          </div>

          <Button 
            onClick={startConversation}
            disabled={isConnecting}
            className="w-full py-8 text-responsive-xl glow-effect btn-responsive"
            size="lg"
          >
            {isConnecting ? "Connecting..." : "🎙️ Start Conversation"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-responsive">
      {/* Header */}
      <div className="chat-header-responsive">
        <div className="flex items-center justify-between">
          <h2 className="heading-responsive">Conversation with NewMe</h2>
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="btn-responsive flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="chat-content-responsive">
            <TranscriptPane
              messages={messages}
              partialTranscript={partialTranscript}
            />
          </div>

          {/* Mobile Session Info */}
          <div className="tablet-up:hidden space-responsive-sm border-t">
            <SessionHUD
              duration={duration}
              isConnected={isConnected}
              isSpeaking={isSpeaking}
            />
          </div>

          <Waveform isActive={isConnected && isSpeaking} />

          {/* Composer */}
          <div className="chat-footer-responsive">
            <Composer
              onSendText={handleSendText}
              onEndSession={endConversation}
              isConnected={isConnected}
              isMuted={isMuted}
              onToggleMute={toggleMute}
            />
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="desktop-up:block desktop-up:w-80 border-l">
          <div className="space-responsive-md h-full">
            <SessionHUD
              duration={duration}
              isConnected={isConnected}
              isSpeaking={isSpeaking}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;