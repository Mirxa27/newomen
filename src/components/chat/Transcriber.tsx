import React, { useEffect, useRef } from 'react';
import { Volume2, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

interface TranscriberProps {
  conversation: Message[];
  className?: string;
}

export const Transcriber: React.FC<TranscriberProps> = ({ conversation, className = '' }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  return (
    <div className={`flex flex-col h-full w-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-black animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Live Transcription</h3>
            <p className="text-xs text-white/60">Real-time conversation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {conversation.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
              <Volume2 className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-white/60 text-sm">Waiting for conversation to start...</p>
            <p className="text-white/40 text-xs mt-2">Speak to begin transcription</p>
          </div>
        ) : (
          <>
            {conversation.map((message, index) => {
              const isUser = message.role === 'user';
              const isSystem = message.role === 'system';

              if (isSystem) return null;

              return (
                <div
                  key={index}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  {!isUser && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Volume2 className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] ${
                      isUser
                        ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                        : 'glass border border-white/10 text-white'
                    } rounded-2xl px-4 py-3 shadow-lg`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    {message.timestamp && (
                      <span className={`text-xs mt-1 block ${isUser ? 'text-white/70' : 'text-white/50'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>

                  {isUser && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>{conversation.filter(m => m.role !== 'system').length} messages</span>
          <span>Powered by OpenAI Realtime API</span>
        </div>
      </div>
    </div>
  );
};

export default Transcriber;

