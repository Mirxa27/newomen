import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
          <TranscriptPane messages={messages} partialTranscript={partialTranscript} />
          <div className="flex-shrink-0 p-3 sm:p-4">
            <Waveform isActive={isConnected && isSpeaking} audioLevel={audioLevel} />
          </div>
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
          <SessionHUD duration={duration} isConnected={isConnected} isSpeaking={isSpeaking} />
        </div>

        {/* Bottom HUD - Mobile */}
        <div className="lg:hidden flex-shrink-0 p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <SessionHUD duration={duration} isConnected={isConnected} isSpeaking={isSpeaking} />
        </div>
      </div>
    </div>
  );
};