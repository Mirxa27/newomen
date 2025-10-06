import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChat } from "@/utils/RealtimeAudio";
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
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : 'Failed to start conversation',
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const endConversation = () => {
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-2xl w-full space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold gradient-text">Talk with NewMe</h1>
            <p className="text-lg text-muted-foreground">
              Your empathetic AI companion for personal growth
            </p>
          </div>

          <div className="clay-card p-6 space-y-3">
            <h3 className="font-semibold">What to expect:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Real-time voice conversation</li>
              <li>• Empathetic and supportive guidance</li>
              <li>• Switch between voice and text anytime</li>
              <li>• Your conversation is private and secure</li>
            </ul>
          </div>

          <Button 
            onClick={startConversation}
            disabled={isConnecting}
            className="w-full py-8 text-xl glow-effect"
            size="lg"
          >
            {isConnecting ? "Connecting..." : "🎙️ Start Conversation"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row gap-6 p-6">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Conversation with NewMe</h2>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>

        <TranscriptPane 
          messages={messages} 
          partialTranscript={partialTranscript}
        />

        <div className="lg:hidden">
          <SessionHUD 
            duration={duration}
            isConnected={isConnected}
            isSpeaking={isSpeaking}
          />
        </div>

        <Waveform isActive={isConnected && isSpeaking} />

        <Composer
          onSendText={handleSendText}
          onEndSession={endConversation}
          isConnected={isConnected}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      </div>

      <div className="hidden lg:block lg:w-80">
        <SessionHUD 
          duration={duration}
          isConnected={isConnected}
          isSpeaking={isSpeaking}
        />
      </div>
    </div>
  );
};

export default Chat;