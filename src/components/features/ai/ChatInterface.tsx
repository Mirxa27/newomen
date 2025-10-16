import { useNavigate } from "react-router-dom";
import { Button } from "@/components/shared/ui/button";
import { ArrowLeft, Bot, Wifi, WifiOff, Activity } from "lucide-react";
import { TranscriptPane } from "@/components/features/ai/TranscriptPane";
import { SessionHUD } from "@/components/features/ai/SessionHUD";
import { Composer } from "@/components/features/ai/Composer";
import { Waveform } from "@/components/features/ai/Waveform";
import { SuggestionPrompts } from "@/components/features/ai/SuggestionPrompts";
import { Badge } from "@/components/shared/ui/badge";
import { cn } from "@/lib/shared/utils/utils";
import type { Message } from "@/hooks/features/ai/useChat";

interface ChatInterfaceProps {
  isConnected: boolean;
  isConnecting?: boolean;
  isSpeaking: boolean;
  isRecording: boolean;
  isSpeakerMuted: boolean;
  messages: Message[];
  partialTranscript: string;
  duration: number;
  audioLevel: number;
  endConversation: () => void;
  handleSendText: (text: string) => void;
  handleSendImage?: (file: File) => void;
  handleSendDocument?: (file: File, fileType: string) => void;
  toggleRecording: () => void;
  toggleSpeakerMute: () => void;
}

export const ChatInterface = ({
  isConnected,
  isConnecting = false,
  isSpeaking,
  isRecording,
  isSpeakerMuted,
  messages,
  partialTranscript,
  duration,
  audioLevel,
  endConversation,
  handleSendText,
  handleSendImage = async (file: File) => {
    // Enhanced image handling with validation
    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type. Please select an image.');
      return;
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error('File too large. Please select an image under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const message: Message = {
        role: 'user',
        content: `Shared an image: ${file.name}`,
        timestamp: new Date(),
        type: 'image',
        imageUrl: reader.result as string
      };
      messages.push(message);
    };
    reader.readAsDataURL(file);
  },
  handleSendDocument = async (file: File, fileType: string) => {
    // Enhanced document handling
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      console.error('File too large. Please select a document under 25MB.');
      return;
    }

    const message: Message = {
      role: 'user',
      content: `Shared a document: ${file.name}`,
      timestamp: new Date(),
      type: 'document',
      documentData: {
        name: file.name,
        size: file.size,
        type: fileType
      }
    };
    messages.push(message);
  },
  toggleRecording,
  toggleSpeakerMute,
}: ChatInterfaceProps) => {
  const navigate = useNavigate();

  const getConnectionStatus = () => {
    if (isConnecting) return { text: 'Connecting...', color: 'bg-amber-400', icon: Activity };
    if (isConnected) return { text: 'Connected', color: 'bg-emerald-400', icon: Wifi };
    return { text: 'Disconnected', color: 'bg-red-400', icon: WifiOff };
  };

  const status = getConnectionStatus();

  return (
    <div className="app-page-shell min-h-dvh flex flex-col relative">
      {/* Enhanced Fixed Background with better mobile optimization */}
      <div className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat bg-fixed" 
           style={{ backgroundImage: 'url(/fixed-background.jpg)' }} />
      
      {/* Enhanced Glassmorphic Overlay with better gradients */}
      <div className="fixed inset-0 -z-9 bg-gradient-to-br from-black/80 via-purple-900/50 to-black/80 backdrop-blur-md" />
      
      {/* Enhanced Header with better responsive design */}
      <header className="flex-shrink-0 glass border-b border-white/20 sticky top-0 z-20 backdrop-blur-xl shadow-lg">
        <div className="max-w-7xl mx-auto w-full px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-full flex items-center justify-center clay shadow-lg">
                  <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                {/* Activity indicator */}
                {isSpeaking && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse border-2 border-white shadow-sm" />
                )}
              </div>
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  NewMe Chat
                </h2>
                <p className="text-xs sm:text-sm text-purple-200/80 font-medium">
                  AI Companion • {messages.length} messages
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Enhanced connection status */}
              <Badge 
                variant={isConnected ? "default" : "secondary"}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 text-xs font-medium transition-all duration-300",
                  isConnected 
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" 
                    : "bg-red-500/20 text-red-300 border-red-400/30"
                )}
              >
                <status.icon className="w-3 h-3" />
                <span className="hidden sm:inline">{status.text}</span>
              </Badge>
              
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="gap-1 sm:gap-2 hover:gap-2 sm:hover:gap-3 transition-all h-9 sm:h-10 px-3 sm:px-4 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
              </Button>
            </div>
          </div>
          
          {/* Enhanced Connection Status Bar with better visual feedback */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-purple-200/70">
              <div className={cn("h-2 w-2 rounded-full transition-all duration-300", status.color)} />
              <span className="font-medium">
                {isConnecting ? 'Establishing secure connection...' : 
                 isConnected ? `Session active • ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : 
                 'Connection lost'}
              </span>
              {isConnected && (
                <div className="flex items-center gap-1 text-emerald-300">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs">Live</span>
                </div>
              )}
            </div>
            
            {/* Audio level indicator */}
            {isConnected && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-200/60">Audio</span>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1 h-3 rounded-full transition-all duration-150",
                        audioLevel > (i * 20) 
                          ? "bg-emerald-400" 
                          : "bg-white/20"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Enhanced Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6 overflow-hidden">
        {/* Enhanced Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 space-y-4 sm:space-y-6">
          {/* Enhanced Transcript Pane */}
          <div className="flex-1 min-h-0">
            <TranscriptPane 
              messages={messages} 
              partialTranscript={partialTranscript}
            />
          </div>

          {/* Enhanced Suggestion Prompts */}
          {messages.length === 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SuggestionPrompts 
                onSelectPrompt={handleSendText} 
                isConnected={isConnected} 
              />
            </div>
          )}

          {/* Enhanced Waveform Visualization */}
          {isConnected && (
            <div className="h-16 sm:h-20 glass rounded-2xl border border-white/20 p-4 shadow-lg backdrop-blur-xl">
              <Waveform 
                isActive={isRecording || isSpeaking} 
                audioLevel={audioLevel} 
              />
            </div>
          )}

          {/* Enhanced Composer */}
          <div className="flex-shrink-0">
            <Composer
              onSendText={handleSendText}
              onSendImage={handleSendImage}
              onSendDocument={handleSendDocument}
              onEndSession={endConversation}
              isConnected={isConnected}
              isRecording={isRecording}
              onToggleRecording={toggleRecording}
              isSpeakerMuted={isSpeakerMuted}
              onToggleSpeakerMute={toggleSpeakerMute}
            />
          </div>
        </div>

        {/* Enhanced Session HUD - Better responsive positioning */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0">
          <div className="sticky top-24">
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