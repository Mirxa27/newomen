// src/components/chat/TranscriptPane.tsx
import React, { useEffect, useRef } from 'react';
import { User, Bot } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TranscriptPaneProps {
  messages?: Message[];
  partialTranscript?: string;
}

export const TranscriptPane = ({ messages = [], partialTranscript }: TranscriptPaneProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, partialTranscript]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4" ref={scrollRef}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-3",
              message.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
              {message.role === 'assistant' ? (
                <>
                  <AvatarImage src="/newme-avatar.png" />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                    <Bot className="w-5 h-5 text-white" />
                  </AvatarFallback>
                </>
              ) : (
                <>
                  <AvatarImage src="/user-avatar.png" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500">
                    <User className="w-5 h-5 text-white" />
                  </AvatarFallback>
                </>
              )}
            </Avatar>

            <div
              className={cn(
                "glass rounded-2xl px-4 py-2 sm:px-6 sm:py-3 max-w-[75%] sm:max-w-[70%]",
                message.role === 'user'
                  ? "bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20"
                  : "bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
              )}
            >
              <p className="text-sm sm:text-base whitespace-pre-wrap break-words">
                {message.content}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {partialTranscript && (
          <div className="flex items-start gap-3">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
              <AvatarImage src="/user-avatar.png" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500">
                <User className="w-5 h-5 text-white" />
              </AvatarFallback>
            </Avatar>
            <div className="glass rounded-2xl px-4 py-2 sm:px-6 sm:py-3 max-w-[75%] sm:max-w-[70%] bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
              <p className="text-sm sm:text-base text-muted-foreground italic">
                {partialTranscript}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
