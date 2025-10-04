import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Send, PhoneOff } from "lucide-react";

interface ComposerProps {
  onSendText: (text: string) => void;
  onEndSession: () => void;
  isConnected: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Composer = ({ 
  onSendText, 
  onEndSession, 
  isConnected,
  isMuted,
  onToggleMute
}: ComposerProps) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (text.trim()) {
      onSendText(text);
      setText("");
    }
  };

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="clay-card"
          disabled={!isConnected}
        />
        <Button 
          onClick={handleSend} 
          disabled={!text.trim() || !isConnected}
          size="icon"
          className="clay-card"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-2 justify-center">
        <Button
          onClick={onToggleMute}
          disabled={!isConnected}
          variant={isMuted ? "destructive" : "default"}
          size="lg"
          className="clay-card"
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        <Button
          onClick={onEndSession}
          disabled={!isConnected}
          variant="destructive"
          size="lg"
        >
          <PhoneOff className="w-5 h-5 mr-2" />
          End Session
        </Button>
      </div>
    </div>
  );
};
