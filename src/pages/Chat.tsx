import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Mic, Square, Loader2 } from 'lucide-react';
import { useLiveAPI } from '@/contexts/LiveAPIContext';
import { useAssessmentStore } from '@/lib/state';
import { useProgramStore } from '@/lib/programStore';
import AssessmentReport from '@/components/console/AssessmentReport';

interface ConversationTurn {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function Chat() {
  const [input, setInput] = useState('');
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const { isConnected, connect, disconnect, sendMessage, onMessage } = useLiveAPI();
  const {
    activeProgram,
    currentQuestionIndex,
    finalReport,
    addAnswer,
    completeProgram,
    quitProgram,
    startProgram,
    generateAIReport,
    isAnalyzing,
  } = useProgramStore();

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Example of connecting to a session
    if (!isConnected) {
      connect('some-session-id');
    }

    onMessage((message) => {
      if (message.type === 'text') {
        setConversation(prev => [...prev, { sender: 'ai', text: message.text, timestamp: new Date().toISOString() }]);
      }
    });

    return () => disconnect();
  }, [connect, disconnect, isConnected, onMessage]);

  useEffect(() => {
    scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
  }, [conversation]);

  const handleSend = () => {
    if (input.trim() === '') return;
    const userMessage: ConversationTurn = { sender: 'user', text: input, timestamp: new Date().toISOString() };
    setConversation(prev => [...prev, userMessage]);
    sendMessage({ type: 'text', text: input });
    setInput('');
  };

  if (finalReport) {
    return <AssessmentReport report={finalReport} />;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">AI Companion</h1>
      </header>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef as any}>
        <div className="space-y-4">
          {conversation.map((turn, index) => (
            <div key={index} className={`flex items-end gap-2 ${turn.sender === 'user' ? 'justify-end' : ''}`}>
              {turn.sender === 'ai' && (
                <Avatar>
                  <AvatarImage src="/ai-avatar.png" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div className={`rounded-lg p-3 max-w-xs lg:max-w-md ${turn.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p>{turn.text}</p>
              </div>
            </div>
          ))}
          {isAnalyzing && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="ml-2">Analyzing your responses...</p>
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
          />
          <Button onClick={handleSend}><Send className="w-4 h-4" /></Button>
          <Button variant="outline"><Mic className="w-4 h-4" /></Button>
        </div>
      </footer>
    </div>
  );
}