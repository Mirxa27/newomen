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
    <div className="space-y-3">
      {/* Text Input */}
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 h-12 text-base"
          disabled={!isConnected}
        />
        <Button
          onClick={handleSend}
          disabled={!text.trim() || !isConnected}
          size="lg"
          className="h-12 px-4"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={onToggleMute}
          disabled={!isConnected}
          variant={isMuted ? "destructive" : "default"}
          size="lg"
          className="flex-1 max-w-[120px] h-12"
        >
          {isMuted ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
          {isMuted ? "Unmute" : "Mute"}
        </Button>

        <Button
          onClick={onEndSession}
          disabled={!isConnected}
          variant="destructive"
          size="lg"
          className="flex-1 max-w-[140px] h-12"
        >
          <PhoneOff className="w-5 h-5 mr-2" />
          End Chat
        </Button>
      </div>
    </div>
  );
};
