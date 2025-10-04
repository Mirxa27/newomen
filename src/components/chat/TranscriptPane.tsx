import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TranscriptPaneProps {
  messages: Message[];
  partialTranscript: string;
}

export const TranscriptPane = ({ messages, partialTranscript }: TranscriptPaneProps) => {
  return (
    <ScrollArea className="flex-1 p-6">
      <div className="space-y-4 max-w-3xl mx-auto">
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'clay-card bg-primary/20' 
                  : 'glass-card'
              }`}
            >
              <p className="text-sm text-muted-foreground mb-1">
                {msg.role === 'user' ? 'You' : 'NewMe'}
              </p>
              <p>{msg.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {partialTranscript && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-4 rounded-2xl glass-card opacity-60">
              <p className="text-sm text-muted-foreground mb-1">NewMe</p>
              <p className="italic">{partialTranscript}</p>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
