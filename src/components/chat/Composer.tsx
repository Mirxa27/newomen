// src/components/chat/Composer.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send, PhoneOff, Volume2, VolumeX } from 'lucide-react';

interface ComposerProps {
  onSendText: (text: string) => void;
  onEndSession: () => void;
  isConnected: boolean;
  isRecording: boolean;
  onToggleRecording: () => void;
  isSpeakerMuted: boolean;
  onToggleSpeakerMute: () => void;
}

const Composer: React.FC<ComposerProps> = ({
  onSendText,
  onEndSession,
  isConnected,
  isRecording,
  onToggleRecording,
  isSpeakerMuted,
  onToggleSpeakerMute,
}) => {
  const [text, setText] = useState('');

  const handleSendClick = () => {
    if (text.trim()) {
      onSendText(text);
      setText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  return (
    <div className="space-y-3">
      {/* Text Input */}
      <div className="flex items-end gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          className="flex-1 min-h-[44px] max-h-32 resize-none text-sm sm:text-base"
          rows={1}
          disabled={!isConnected}
        />
        <Button 
          onClick={handleSendClick} 
          size="icon"
          disabled={!isConnected || !text.trim()}
          className="h-11 w-11 flex-shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-2">
            <Button
                onClick={onToggleSpeakerMute}
                variant="secondary"
                size="icon"
                disabled={!isConnected}
                aria-label={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
                className="h-11 w-11"
            >
                {isSpeakerMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Button
                onClick={onEndSession}
                variant="destructive"
                size="default"
                disabled={!isConnected}
                className="gap-2 min-h-[44px]"
                aria-label="End conversation"
            >
                <PhoneOff className="h-5 w-5" />
                <span className="hidden sm:inline">End Call</span>
            </Button>
        </div>
        
        <Button
            onClick={onToggleRecording}
            size="lg"
            disabled={!isConnected}
            className={`gap-2 min-h-[44px] rounded-full px-6 transition-all duration-300 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'}`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
            {isRecording ? (
                <>
                    <MicOff className="h-5 w-5" />
                    <span>Stop</span>
                </>
            ) : (
                <>
                    <Mic className="h-5 w-5" />
                    <span>Speak</span>
                </>
            )}
        </Button>
      </div>
    </div>
  );
};

export { Composer };