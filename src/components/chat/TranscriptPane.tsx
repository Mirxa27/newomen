// src/components/chat/TranscriptPane.tsx
import React, { useEffect, useRef } from 'react';
import { User, Bot } from 'lucide-react';

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (messages.length === 0 && !partialTranscript) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Ready to begin?</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Start speaking and NewMe will listen. Your conversation will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 scroll-smooth"
      aria-live="polite"
      aria-atomic="false"
    >
      {messages.map((message, index) => {
        const isUser = message.role === 'user';
        return (
          <div
            key={`${message.timestamp.getTime()}-${index}`}
            className={`flex gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
              isUser 
                ? 'bg-blue-500 text-white' 
                : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
            }`}>
              {isUser ? (
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 min-w-0 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 ${
                isUser
                  ? 'bg-blue-500 text-white rounded-tr-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
              }`}>
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
              <span className="text-xs text-muted-foreground mt-1 px-1">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        );
      })}

      {partialTranscript && (
        <div className="flex gap-2 sm:gap-3 flex-row animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl rounded-tl-sm px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words italic opacity-75">
                {partialTranscript}
              </p>
              <div className="flex gap-1 mt-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0ms]"></span>
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:150ms]"></span>
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:300ms]"></span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground mt-1 px-1">
              Speaking...
            </span>
          </div>
        </div>
      )}

      <div ref={endOfMessagesRef} />
    </div>
  );
};

export { TranscriptPane };

