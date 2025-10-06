// src/components/chat/Composer.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send } from 'lucide-react';

interface ComposerProps {
  isConnecting: boolean;
  isConnected: boolean;
  onStart: () => void;
  onStop: () => void;
  // onSendText: (text: string) => void; // For future text input
}

const Composer: React.FC<ComposerProps> = ({
  isConnecting,
  isConnected,
  onStart,
  onStop,
}) => {
  const [text, setText] = useState('');

  const handleMicClick = () => {
    if (isConnected) {
      onStop();
    } else {
      onStart();
    }
  };

  const handleSendClick = () => {
    if (text.trim()) {
      // onSendText(text);
      setText('');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleMicClick}
        disabled={isConnecting}
        size="icon"
        className="rounded-full"
        aria-label={isConnected ? 'Stop recording' : 'Start recording'}
      >
        {isConnected ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message or use the microphone..."
        className="flex-grow"
        rows={1}
      />
      <Button onClick={handleSendClick} size="icon" aria-label="Send message">
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
};

export { Composer };
