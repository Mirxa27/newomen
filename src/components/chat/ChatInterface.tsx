import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot } from "lucide-react";
import { TranscriptPane } from "@/components/chat/TranscriptPane";
import { SessionHUD } from "@/components/chat/SessionHUD";
import { Composer } from "@/components/chat/Composer";
import { Waveform } from "@/components/chat/Waveform";
import type { Message } from "@/hooks/useChat";

interface ChatInterfaceProps {
  isConnected: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  messages: Message[];
  partialTranscript: string;
  duration: number;
  audioLevel: number;
  endConversation: () => void;
  handleSendText: (text: string) => void;
  toggleMute: () => void;
}

export const ChatInterface = ({
  isConnected,
  isSpeaking,
  isMuted,
  messages,
  partialTranscript,
  duration,
  audioLevel,
  endConversation,
  handleSendText,
  toggleMute,
}: ChatInterfaceProps) => {
  const navigate = useNavigate();

  return (
    <div className="app-page-shell h-dvh flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 glass p-3 sm:p-4 border-b border-white/10 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center clay">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 max-w-7xl mx-auto w-full p-2 sm:p-4 gap-2 sm:gap-4">
        {/* Chat Area */}
        <main className="flex-1 flex flex-col min-h-0 gap-2 sm:gap-4">
          <div className="flex-1 glass rounded-3xl border border-white/10 flex flex-col overflow-hidden">
            <TranscriptPane messages={messages} partialTranscript={partialTranscript} />
          </div>
          <div className="flex-shrink-0">
            <Waveform isActive={isConnected && isSpeaking} audioLevel={audioLevel} />
          </div>
          <div className="flex-shrink-0">
            <Composer
              onSendText={handleSendText}
              onEndSession={endConversation}
              isConnected={isConnected}
              isMuted={isMuted}
              onToggleMute={toggleMute}
            />
          </div>
        </main>

        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-80 xl:w-96 flex-shrink-0">
          <SessionHUD duration={duration} isConnected={isConnected} isSpeaking={isSpeaking} />
        </aside>

        {/* Bottom HUD - Mobile */}
        <div className="lg:hidden flex-shrink-0">
          <SessionHUD duration={duration} isConnected={isConnected} isSpeaking={isSpeaking} />
        </div>
      </div>
    </div>
  );
};