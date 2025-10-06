// src/components/chat/TranscriptPane.tsx
import React, { useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TranscriptPaneProps {
  messages?: Message[];
  partialTranscript?: string;
}

const TranscriptPane: React.FC<TranscriptPaneProps> = ({ 
  messages = [], 
  partialTranscript = '' 
}) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partialTranscript]);

  return (
    <div
      className="flex-grow p-4 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow"
      aria-live="polite"
      aria-atomic="false"
    >
      {messages.map((message, index) => (
        <div
          key={`${message.timestamp.getTime()}-${index}`}
          className={`mb-4 ${
            message.role === 'user' 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-900 dark:text-gray-100'
          }`}
        >
          <div className="font-semibold mb-1">
            {message.role === 'user' ? 'You' : 'NewMe'}
          </div>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      ))}
      
      {partialTranscript && (
        <div className="mb-4 text-gray-500 dark:text-gray-400" aria-live="polite">
          <div className="font-semibold mb-1">NewMe (speaking...)</div>
          <p className="whitespace-pre-wrap italic">{partialTranscript}</p>
        </div>
      )}
      
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export { TranscriptPane };
