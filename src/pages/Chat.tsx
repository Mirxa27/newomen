// src/pages/Chat.tsx
import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Send, MessageSquare, Mic, MicOff, Loader2 } from 'lucide-react';
import { useLiveAPI } from '@/contexts/LiveAPIContext';
import { useConversationStore, ConversationTurn } from '@/lib/state';
import { useProgramStore } from '@/lib/programStore';
import { assessmentDB } from '@/lib/assessments';
import ControlTray from '@/components/console/control-tray/ControlTray';
import AssessmentReport from '@/components/console/AssessmentReport';
import { useToast } from '@/hooks/use-toast';

const formatTimestamp = (date: Date) => {
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const renderContent = (text: string) => {
  return text.split('\n').map((line, i) => <p key={i}>{line}</p>);
};

const headlines = ["What stories are you telling yourself today?"];

const MAX_TEXT_INPUT_LENGTH = 1000;

export default function Chat() {
  const { client, setConfig, connected, connect, disconnect, isConnecting, error, transcript, audioLevel, clearTranscript } = useLiveAPI();
  const turns = useConversationStore(state => state.turns);
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [headline] = useState(headlines[0]);
  const [textInputValue, setTextInputValue] = useState('');
  const [isTextMode, setIsTextMode] = useState(false);
  const prevTurnsLengthRef = useRef(turns.length);
  const textInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isProgramActive = activeProgram !== null;
  const currentQuestion = isProgramActive ? assessmentDB.assessments[activeProgram.id].questions[currentQuestionIndex] : null;
  const progress = isProgramActive ? ((currentQuestionIndex + 1) / assessmentDB.assessments[activeProgram.id].questions.length) * 100 : 0;

  // Auto-start a demo assessment for new users
  useEffect(() => {
    if (!isProgramActive && !finalReport && turns.length === 0) {
      startProgram('personality-discovery');
    }
  }, [isProgramActive, finalReport, turns.length, startProgram]);

  // Update AI configuration when program changes
  useEffect(() => {
    if (isProgramActive) {
      setConfig({
        systemInstruction: `You are facilitating the "${activeProgram.title}" assessment. Be encouraging and stay focused on the task. Ask one question at a time and wait for the user's response.`,
      });
    } else {
      setConfig({
        systemInstruction: 'You are NewMe, a wise and compassionate AI companion. Engage in natural conversation and be genuinely helpful.',
      });
    }
  }, [setConfig, isProgramActive, activeProgram]);

  // Auto-scroll to bottom when new turns are added
  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
    prevTurnsLengthRef.current = turns.length;
  }, [turns]);

  const handleSendTextMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInputValue.trim() || !connected || isProgramActive) return;

    const userInput = textInputValue;
    setTextInputValue('');
    textInputRef.current?.focus();

    useConversationStore.getState().addTurn({
      role: 'user',
      text: userInput,
      isFinal: true
    });

    if (client) {
      client.send([{ text: userInput }]);
    }
  }, [textInputValue, connected, isProgramActive, client]);

  const handleAnswerSubmit = useCallback(async (answer: string | number) => {
    if (!currentQuestion || !isProgramActive) return;

    addAnswer(currentQuestion.id, answer);

    useConversationStore.getState().addTurn({
      role: 'user',
      text: typeof answer === 'number' ? answer.toString() : answer,
      isFinal: true
    });

    // Check if this was the last question
    const isLastQuestion = currentQuestionIndex >= assessmentDB.assessments[activeProgram.id].questions.length - 1;

    if (isLastQuestion) {
      // Show analyzing message
      useConversationStore.getState().addTurn({
        role: 'system',
        text: `Thank you for completing the ${activeProgram.title}! NewMe is now analyzing your responses...`,
        isFinal: true,
      });

      try {
        await generateAIReport();
        toast({
          title: "Analysis Complete",
          description: "Your personalized assessment report is ready!",
        });
      } catch (error) {
        toast({
          title: "Analysis Failed",
          description: "There was an error generating your report. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Show next question
      const nextQuestion = assessmentDB.assessments[activeProgram.id].questions[currentQuestionIndex + 1];
      useConversationStore.getState().addTurn({
        role: 'agent',
        text: `Great! Here's your next question:\n\n${nextQuestion.text}`,
        isFinal: true,
      });
    }
  }, [currentQuestion, isProgramActive, currentQuestionIndex, activeProgram, addAnswer, generateAIReport, toast]);

  const toggleTextMode = useCallback(() => setIsTextMode(prev => !prev), []);

  const getAvatarIcon = (role: 'user' | 'agent' | 'system') => {
    if (role === 'user') return 'person';
    if (role === 'agent') return 'smart_toy';
    return 'hub';
  };

  if (finalReport) {
    return <AssessmentReport report={finalReport} />;
  }

  return (
    <div className="chat-page-container min-h-screen bg-background">
      <div className="mx-auto max-w-4xl h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4">
          <h1 className="text-2xl font-bold text-foreground">
            {isProgramActive ? activeProgram.title : (turns.length > 0 ? "Your conversation with NewMe" : headline)}
          </h1>
          {isProgramActive && (
            <div className="mt-2">
              <Badge variant="secondary" className="mb-2">
                Question {currentQuestionIndex + 1} of {assessmentDB.assessments[activeProgram.id].questions.length}
              </Badge>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className={`bg-primary h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Program Question Banner */}
        {isProgramActive && currentQuestion && (
          <Card className="m-4">
            <CardContent className="p-6">
              <p className="text-lg font-medium mb-4">{currentQuestion.text}</p>

              {/* Render answer options based on question type */}
              {currentQuestion.type === 'single' && currentQuestion.options && (
                <div className="grid gap-2">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start text-left h-auto p-3 whitespace-normal"
                      onClick={() => handleAnswerSubmit(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'scale' && currentQuestion.scale && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{currentQuestion.scale.labels[0]}</span>
                    <span>{currentQuestion.scale.labels[1]}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: currentQuestion.scale.max - currentQuestion.scale.min + 1 }, (_, i) => {
                      const value = currentQuestion.scale!.min + i;
                      return (
                        <Button
                          key={value}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAnswerSubmit(value)}
                        >
                          {value}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentQuestion.type === 'multiple' && currentQuestion.options && (
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => (
                    <label key={index} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleAnswerSubmit(option);
                          }
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'text' && (
                <div className="space-y-2">
                  <Input
                    placeholder="Type your answer here..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const value = (e.target as HTMLInputElement).value;
                        if (value.trim()) {
                          handleAnswerSubmit(value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {isConnecting && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting to voice session...</span>
            </div>
          )}

          {turns.map((turn, i) => (
            <div key={i} className={`flex gap-3 ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[80%] ${turn.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  turn.role === 'user' ? 'bg-primary text-primary-foreground' :
                  turn.role === 'agent' ? 'bg-secondary text-secondary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  <span className="text-sm">
                    {turn.role === 'user' ? 'U' : turn.role === 'agent' ? 'AI' : 'S'}
                  </span>
                </div>

                <Card className={`${
                  turn.role === 'user' ? 'bg-primary text-primary-foreground' :
                  turn.role === 'agent' ? 'bg-card' : 'bg-muted'
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {turn.role === 'user' ? 'You' : turn.role === 'agent' ? 'NewMe' : 'System'}
                      </span>
                      <span className="text-xs opacity-70">
                        {formatTimestamp(turn.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm">
                      {renderContent(turn.text)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Controls */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-4">
            {isTextMode && !isProgramActive && (
              <form onSubmit={handleSendTextMessage} className="flex-1 flex gap-2">
                <Input
                  ref={textInputRef}
                  value={textInputValue}
                  onChange={(e) => setTextInputValue(e.target.value)}
                  placeholder="Type your message..."
                  maxLength={MAX_TEXT_INPUT_LENGTH}
                  disabled={!connected}
                />
                <Button type="submit" disabled={!textInputValue.trim() || !connected}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}

            <ControlTray
              isTextMode={isTextMode}
              onToggleTextMode={toggleTextMode}
              isProgramActive={isProgramActive}
              onQuitProgram={quitProgram}
              onGenerateInsight={() => {
                toast({
                  title: "Insight Generation",
                  description: "This feature is available during assessments.",
                });
              }}
              isGeneratingInsight={isAnalyzing}
              isConnected={connected}
              onConnect={connect}
              onDisconnect={disconnect}
              isConnecting={isConnecting}
            />
          </div>

          {error && (
            <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}