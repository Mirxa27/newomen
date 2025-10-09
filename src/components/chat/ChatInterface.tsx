import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Mic, Square, Loader2 } from "lucide-react";
import { UIMessage as Message } from "@/hooks/useChat"; // Corrected import for Message type

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isSending: boolean;
}

export default function ChatInterface({ messages, onSendMessage, isSending }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef as any}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender !== 'user' && (
                <Avatar>
                  <AvatarImage src="/ai-avatar.png" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div className={`rounded-lg p-3 max-w-xs lg:max-w-md ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p>{msg.content}</p>
                <p className="text-xs text-right opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex items-center justify-start p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="ml-2">Thinking...</p>
            </div>
          )}
        </div>
      </ScrollArea>
      <footer className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            disabled={isSending}
          />
          <Button onClick={handleSend} disabled={isSending}>
            <Send className="w-4 h-4" />
          </Button>
          <Button variant="outline" disabled={isSending}>
            <Mic className="w-4 h-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}