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
  isRecording: boolean;
  isSpeakerMuted: boolean;
  messages: Message[];
  partialTranscript: string;
  duration: number;
  audioLevel: number;
  endConversation: () => void;
  handleSendText: (text: string) => void;
  toggleRecording: () => void;
  toggleSpeakerMute: () => void;
}

export const ChatInterface = ({
  isConnected,
  isSpeaking,
  isRecording,
  isSpeakerMuted,
  messages,
  partialTranscript,
  duration,
  audioLevel,
  endConversation,
  handleSendText,
  toggleRecording,
  toggleSpeakerMute,
}: ChatInterfaceProps) => {
  const navigate = useNavigate();

  return (
    <div className="app-page-shell min-h-dvh flex flex-col bg-fixed bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/src/assets/fixed-background.jpg)' }}>
      {/* Header */}
      <header className="flex-shrink-0 glass border-b border-white/10 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto w-full px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center clay">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">NewMe Chat</h2>
                <p className="text-sm text-muted-foreground hidden sm:block">AI Companion</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="gap-2 hover:gap-3 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 max-w-7xl mx-auto w-full p-4 sm:p-6 gap-4 sm:gap-6">
        {/* Chat Area */}
        <main className="flex-1 flex flex-col min-h-0 gap-4">
          <div className="flex-1 glass rounded-3xl border border-white/10 shadow-lg flex flex-col overflow-hidden backdrop-blur-xl">
            <TranscriptPane messages={messages} partialTranscript={partialTranscript} />
          </div>
          <div className="flex-shrink-0 glass rounded-3xl border border-white/10 p-4 shadow-lg backdrop-blur-xl">
            <Waveform isActive={isConnected && isSpeaking} audioLevel={audioLevel} />
          </div>
          <div className="flex-shrink-0 glass rounded-3xl border border-white/10 p-4 shadow-lg backdrop-blur-xl">
            <Composer
              onSendText={handleSendText}
              onEndSession={endConversation}
              isConnected={isConnected}
              isRecording={isRecording}
              onToggleRecording={toggleRecording}
              isSpeakerMuted={isSpeakerMuted}
              onToggleSpeakerMute={toggleSpeakerMute}
            />
          </div>
        </main>

        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex w-80 xl:w-96 flex-shrink-0">
          <div className="w-full glass rounded-3xl border border-white/10 p-6 shadow-lg backdrop-blur-xl">
            <SessionHUD duration={duration} isConnected={isConnected} isSpeaking={isSpeaking} />
          </div>
        </aside>

        {/* Bottom HUD - Mobile */}
        <div className="lg:hidden flex-shrink-0 glass rounded-3xl border border-white/10 p-4 shadow-lg backdrop-blur-xl">
          <SessionHUD duration={duration} isConnected={isConnected} isSpeaking={isSpeaking} />
        </div>
      </div>
    </div>
  );
};