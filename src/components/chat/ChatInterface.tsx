import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Mic, Volume2, VolumeX, StopCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message } from "@/hooks/useChat"; // Corrected import for Message type

interface ChatInterfaceProps {
  conversation: { id: string; title: string | null } | null;
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  sendMessage: () => Promise<void>;
  loading: boolean;
  error: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  isConnected: boolean;
  isSpeaking: boolean;
  isRecording: boolean;
  isSpeakerMuted: boolean;
  toggleSpeakerMute: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  audioLevel: number;
}

export function ChatInterface({
  conversation,
  messages,
  input,
  setInput,
  sendMessage,
  loading,
  error,
  messagesEndRef,
  isConnected,
  isSpeaking,
  isRecording,
  isSpeakerMuted,
  toggleSpeakerMute,
  startRecording,
  stopRecording,
  audioLevel,
}: ChatInterfaceProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      void sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-lg">
        <h1 className="text-xl font-bold">{conversation?.title || "NewMe Chat"}</h1>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={toggleSpeakerMute}>
            {isSpeakerMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {loading && messages.length > 0 && (
            <div className="flex justify-start">
              <div className="max-w-[70%] p-3 rounded-lg bg-muted text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background/80 backdrop-blur-lg flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading || isSpeaking}
          className={isRecording ? "text-red-500 animate-pulse" : ""}
        >
          {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading || isRecording || !isConnected}
          className="flex-1"
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim() || !isConnected}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
      {error && <p className="text-red-500 text-center text-sm mt-2">{error}</p>}
    </div>
  );
}