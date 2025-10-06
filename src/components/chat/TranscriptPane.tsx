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
    <ScrollArea className="flex-1 h-full">
      <div className="p-3 md:p-6 space-y-3 md:space-y-4 max-w-none">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] md:max-w-[75%] p-3 md:p-4 rounded-2xl break-words overflow-wrap-anywhere ${
                msg.role === 'user'
                  ? 'clay-card bg-primary/20 ml-auto'
                  : 'glass-card'
              }`}
            >
              <p className="text-xs md:text-sm text-muted-foreground mb-1 font-medium">
                {msg.role === 'user' ? 'You' : 'NewMe'}
              </p>
              <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-2 opacity-70">
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {partialTranscript && (
          <div className="flex justify-start">
            <div className="max-w-[85%] sm:max-w-[80%] md:max-w-[75%] p-3 md:p-4 rounded-2xl glass-card opacity-60 break-words">
              <p className="text-xs md:text-sm text-muted-foreground mb-1 font-medium">NewMe</p>
              <p className="italic text-sm md:text-base leading-relaxed">{partialTranscript}</p>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
