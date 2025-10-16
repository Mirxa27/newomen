import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/shared/ui/button";
import { Card } from "@/components/shared/ui/card";
import { Input } from "@/components/shared/ui/input";
import { Badge } from "@/components/shared/ui/badge";
import { Alert, AlertDescription } from "@/components/shared/ui/alert";
import { Loader2, Copy, Check, Send, Heart, Users, ArrowLeft, Sparkles, Brain } from "lucide-react";
import { useToast } from "@/hooks/shared/ui/use-toast";
import { Avatar } from "@/components/shared/ui/avatar";
import { aiCouplesChallengeService } from "@/services/features/ai/AICouplesChallengeService";
import { enhancedConflictResolutionService, type ConflictExercise } from "@/services/features/ai/EnhancedConflictResolutionService";
import type { AIQuestionGeneration, AICouplesAnalysis } from "@/services/features/ai/AICouplesChallengeService";
import ConflictDetectionAlert from "@/components/features/community/ConflictDetectionAlert";
import ConflictResolutionExercise from "@/components/features/community/ConflictResolutionExercise";

interface Message {
  id: string;
  sender: "ai" | "user" | "partner" | "system";
  content: string;
  timestamp: string;
}

function toJsonMessages(arr: Message[]): Record<string, Json>[] {
  return arr.map((m) => ({
    id: m.id,
    sender: m.sender,
    content: m.content,
    timestamp: m.timestamp,
  }));
}

interface QuestionSet {
  title: string;
  description: string;
  questions: string[];
}

interface ChallengeData {
  id: string;
  initiator_id: string;
  partner_id: string | null;
  status: string;
  question_set: QuestionSet;
  messages: Message[];
  current_question_index: number;
}

function isMessage(v: unknown): v is Message {
  const m = v as Record<string, unknown> | null;
  return !!m &&
    typeof m.id === "string" &&
    (m.sender === "ai" || m.sender === "user" || m.sender === "partner" || m.sender === "system") &&
    typeof m.content === "string" &&
    typeof m.timestamp === "string";
}

export default function CouplesChallengeChat() {
  const { id: challengeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [partnerJoined, setPartnerJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState<AIQuestionGeneration | null>(null);
  const [showAIInsight, setShowAIInsight] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<ConflictExercise | null>(null);
  const [conflictDetectionEnabled, setConflictDetectionEnabled] = useState(true);

  const shareUrl = `${window.location.origin}/couples-challenge/join/${challengeId}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChallenge = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || null;
      setUserId(currentUserId);

      const { data, error } = await supabase
        .from("couples_challenges")
        .select("*")
        .eq("id", challengeId)
        .single();

      if (error) throw error;

      const challengeRow = data as Database["public"]["Tables"]["couples_challenges"]["Row"];

      const qsRaw = challengeRow.question_set;
      let qsTitle = "Couple's Challenge";
      let qsDescription = "";
      let qsQuestions: string[] = [];
      if (qsRaw && typeof qsRaw === "object" && !Array.isArray(qsRaw)) {
        const obj = qsRaw as Record<string, unknown>;
        if (typeof obj.title === "string") qsTitle = obj.title;
        if (typeof obj.description === "string") qsDescription = obj.description;
        const qv = obj.questions as unknown;
        if (Array.isArray(qv) && qv.every((x) => typeof x === "string")) {
          qsQuestions = qv as string[];
        } else if (typeof qv === "string") {
          try { qsQuestions = JSON.parse(qv) as string[]; } catch { qsQuestions = []; }
        }
      }
      const questionSet: QuestionSet = {
        title: qsTitle,
        description: qsDescription,
        questions: qsQuestions,
      };
      
      setChallenge({
        id: challengeRow.id,
        initiator_id: challengeRow.initiator_id,
        partner_id: challengeRow.partner_id,
        status: challengeRow.status,
        question_set: questionSet,
        messages: [],
        current_question_index: challengeRow.current_question_index || 0,
      });

      const rawMessages = (challengeRow.messages ?? []) as unknown[];
      const loadedMessages = Array.isArray(rawMessages) ? rawMessages.filter(isMessage) as Message[] : [];
      console.log('Loaded messages:', loadedMessages);
      setMessages(loadedMessages);
      setIsInitiator(currentUserId === challengeRow.initiator_id);
      // Partner joined if they have partner_id OR partner_name (for guests)
      setPartnerJoined(!!(challengeRow.partner_id || challengeRow.partner_name));

      // Initialize chat if no messages yet
      if (!loadedMessages || loadedMessages.length === 0) {
        console.log('No messages found, initializing chat...');
        await initializeChat(
          {
            id: challengeRow.id,
            initiator_id: challengeRow.initiator_id,
            partner_id: challengeRow.partner_id,
            status: challengeRow.status,
            question_set: questionSet,
            messages: [],
            current_question_index: challengeRow.current_question_index || 0,
          },
          questionSet
        );
      }

    } catch (err) {
      console.error("Error loading challenge:", err);
      toast({
        title: "Error",
        description: "Failed to load challenge",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [challengeId, toast]);

  useEffect(() => {
    loadChallenge();

    // Subscribe to realtime updates (UPDATE events for this challenge row)
    const channel = supabase
      .channel(`challenge-${challengeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'couples_challenges',
          filter: `id=eq.${challengeId}`
        },
        (payload) => {
          console.log('Realtime update:', payload);
          loadChallenge();
        }
      )
      .subscribe();

    // Fallback polling to guarantee UI freshness in case realtime is blocked
    const pollingId = window.setInterval(() => {
      void loadChallenge();
    }, 4000);

    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(pollingId);
    };
  }, [challengeId, loadChallenge]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async (challengeData: ChallengeData, questionSet: ChallengeData["question_set"]) => {
    const welcomeMessages: Message[] = [
      {
        id: crypto.randomUUID(),
        sender: "ai",
        content: `Welcome to ${questionSet?.title || "Couple's Challenge"}! 💕`,
        timestamp: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        sender: "ai",
        content: questionSet?.description || "Answer questions together and discover your compatibility!",
        timestamp: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        sender: "system",
        content: "Share the link with your partner to get started!",
        timestamp: new Date().toISOString(),
      },
    ];

    console.log('Creating welcome messages:', welcomeMessages);

    const { error } = await supabase
      .from("couples_challenges")
      .update({ messages: toJsonMessages(welcomeMessages) })
      .eq("id", challengeData.id);

    if (error) {
      console.error('Error initializing chat:', error);
    } else {
      console.log('Chat initialized successfully');
      setMessages(welcomeMessages);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Share this link with your partner",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !challenge || sending) return;

    setSending(true);
    try {
      const newMessage: Message = {
        id: crypto.randomUUID(),
        sender: isInitiator ? "user" : "partner",
        content: input.trim(),
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messages, newMessage];
      
      // Save message to database
      const { error } = await supabase
        .from("couples_challenges")
        .update({ messages: toJsonMessages(updatedMessages) })
        .eq("id", challengeId);

      if (error) throw error;

      setMessages(updatedMessages);
      setInput("");

      // Real-time conflict detection
      if (conflictDetectionEnabled && partnerJoined) {
        try {
          const conflictAlert = await enhancedConflictResolutionService.detectRealTimeConflict(
            challengeId!,
            newMessage
          );
          
          if (conflictAlert) {
            console.log('Conflict pattern detected:', conflictAlert);
            // The ConflictDetectionAlert component will handle displaying the alert
          }
        } catch (error) {
          console.error('Error in conflict detection:', error);
        }
      }

      // Check if we need to ask next question or generate analysis
      await handleNextStep(updatedMessages);

    } catch (err) {
      console.error("Error sending message:", err);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleNextStep = async (currentMessages: Message[]) => {
    if (!challenge) return;

    const { questions } = challenge.question_set;
    const currentIndex = challenge.current_question_index;

    // Count responses for current question
    const userMessages = currentMessages.filter(m => m.sender === "user");
    const partnerMessages = currentMessages.filter(m => m.sender === "partner");

    // If both answered current question, move to next
    if (partnerJoined && userMessages.length > currentIndex && partnerMessages.length > currentIndex) {
      // Generate AI insight after each completed question
      await generateRealTimeInsight(currentMessages);

      if (currentIndex < questions.length - 1) {
        // Generate dynamic AI question based on their responses
        const dynamicQuestion = await generateDynamicQuestion(currentMessages);
        
        const nextQuestion: Message = {
          id: crypto.randomUUID(),
          sender: "ai",
          content: dynamicQuestion.question,
          timestamp: new Date().toISOString(),
        };

        const newMessages = [...currentMessages, nextQuestion];
        
        await supabase
          .from("couples_challenges")
          .update({ 
            messages: toJsonMessages(newMessages),
            current_question_index: currentIndex + 1,
          })
          .eq("id", challengeId);

      } else {
        // Check if ALL questions have been answered by BOTH partners
        const totalQuestions = questions.length;
        const userResponses = userMessages.length;
        const partnerResponses = partnerMessages.length;
        
        console.log('Checking completion:', {
          totalQuestions,
          userResponses,
          partnerResponses,
          currentIndex
        });

        if (userResponses >= totalQuestions && partnerResponses >= totalQuestions) {
          // All questions answered by both partners, generate analysis
          console.log('All questions completed, generating analysis');
          await generateAnalysis();
        } else {
          console.log('Not all questions completed yet');
        }
      }
    }
  };

  const generateDynamicQuestion = async (currentMessages: Message[]): Promise<AIQuestionGeneration> => {
    try {
      setIsGeneratingAI(true);
      
      // Extract previous question-answer pairs
      const previousResponses = extractQuestionResponsePairs(currentMessages);
      const currentContext = challenge?.question_set.description || "Couples challenge";
      const progress = challenge ? (challenge.current_question_index / challenge.question_set.questions.length) * 100 : 0;

      const dynamicQuestion = await aiCouplesChallengeService.generateDynamicQuestion(
        previousResponses,
        currentContext,
        progress
      );

      setAiQuestion(dynamicQuestion);
      return dynamicQuestion;
    } catch (err) {
      console.error("Error generating dynamic question:", err);
      // Fallback to static question
      return {
        question: challenge?.question_set.questions[challenge.current_question_index + 1] || "What's something you'd like to know about each other?",
        context: "Continuing the challenge",
        psychologicalIntent: "Understanding each other better",
        expectedInsight: "Deeper connection"
      };
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generateRealTimeInsight = async (currentMessages: Message[]): Promise<void> => {
    try {
      // Get recent messages (last 4-6 exchanges)
      const recentMessages = currentMessages.slice(-6).map(msg => ({
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.timestamp
      }));

      const progress = challenge ? (challenge.current_question_index / challenge.question_set.questions.length) * 100 : 0;

      const insight = await aiCouplesChallengeService.generateRealTimeInsight(
        recentMessages,
        progress
      );

      setAiInsight(insight.insight);
      setShowAIInsight(true);
    } catch (err) {
      console.error("Error generating real-time insight:", err);
      // Silently fail - insights are optional
    }
  };

  const handleExerciseStart = (exercise: ConflictExercise) => {
    setCurrentExercise(exercise);
  };

  const handleExerciseComplete = async (exerciseId: string, effectivenessScore: number) => {
    try {
      await enhancedConflictResolutionService.completeConflictExercise(
        exerciseId,
        { userResponse: 'completed' },
        { partnerResponse: 'completed' },
        effectivenessScore
      );
      
      toast({
        title: "Exercise Completed",
        description: "Great job working through the conflict resolution exercise!",
      });
    } catch (error) {
      console.error('Error completing exercise:', error);
    } finally {
      setCurrentExercise(null);
    }
  };

  const handleExerciseClose = () => {
    setCurrentExercise(null);
  };

  const handleAlertDismiss = (alertId: string) => {
    // Remove alert from the service
    enhancedConflictResolutionService.clearRealTimeAlerts();
  };

  const generateAnalysis = async () => {
    try {
      const analysisMessage: Message = {
        id: crypto.randomUUID(),
        sender: "ai",
        content: "Thank you both for completing the challenge! 🎉 Analyzing your responses...",
        timestamp: new Date().toISOString(),
      };

      await supabase
        .from("couples_challenges")
        .update({ 
          messages: toJsonMessages([...messages, analysisMessage]),
          status: "completed",
        })
        .eq("id", challengeId);

      // Call edge function to generate AI analysis
      const { data, error } = await supabase.functions.invoke('couples-challenge-analyzer-minimal', {
        body: { challengeId },
      });

      if (error) throw error;

      // Add analysis results to chat
      const resultMessage: Message = {
        id: crypto.randomUUID(),
        sender: "ai",
        content: `Your Compatibility Score: ${data.analysis.overall_alignment}%\n\n${data.analysis.summary}`,
        timestamp: new Date().toISOString(),
      };

      await supabase
        .from("couples_challenges")
        .update({ 
          messages: toJsonMessages([...messages, analysisMessage, resultMessage]),
          ai_analysis: data.analysis,
        })
        .eq("id", challengeId);

    } catch (err) {
      console.error("Error generating analysis:", err);
      toast({
        title: "Error",
        description: "Failed to generate analysis",
        variant: "destructive",
      });
    }
  };

  interface ResponsePair { question: string; userResponse: string; partnerResponse: string }

  const extractQuestionResponsePairs = (messages: Message[]): ResponsePair[] => {
    const pairs: ResponsePair[] = [];
    let currentQuestion = "";
    let userResponse = "";
    let partnerResponse = "";

    for (const message of messages) {
      if (message.sender === "ai" && message.content.includes("?")) {
        // Save previous pair if complete
        if (currentQuestion && userResponse && partnerResponse) {
          pairs.push({ question: currentQuestion, userResponse, partnerResponse });
        }
        // Start new pair
        currentQuestion = message.content;
        userResponse = "";
        partnerResponse = "";
      } else if (message.sender === "user" && currentQuestion) {
        userResponse = message.content;
      } else if (message.sender === "partner" && currentQuestion) {
        partnerResponse = message.content;
      }
    }

    // Save last pair if complete
    if (currentQuestion && userResponse && partnerResponse) {
      pairs.push({ question: currentQuestion, userResponse, partnerResponse });
    }

    return pairs;
  };


  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-pink-800 to-blue-900">
        <div className="absolute inset-0 bg-[url('/fixed-background.jpg')] bg-cover bg-center bg-no-repeat opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-purple-900/40 to-black/60 backdrop-blur-sm" />
        <div className="relative h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-pink-800 to-blue-900">
        <div className="absolute inset-0 bg-[url('/fixed-background.jpg')] bg-cover bg-center bg-no-repeat opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-purple-900/40 to-black/60 backdrop-blur-sm" />
        <div className="relative h-screen flex items-center justify-center p-4">
          <Card className="p-6 max-w-md bg-white/10 backdrop-blur-md border-white/20">
            <h2 className="text-xl font-bold mb-4 text-white">Challenge Not Found</h2>
            <Button onClick={() => navigate("/couples-challenge")}>
              Start New Challenge
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-pink-800 to-blue-900">
      <div className="absolute inset-0 bg-[url('/fixed-background.jpg')] bg-cover bg-center bg-no-repeat opacity-30" />
      {/* Dark Liquid Glassmorphic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-purple-900/40 to-black/60 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="relative h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Back button - only show for authenticated users (initiators) */}
                {isInitiator && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/dashboard")}
                    className="text-white hover:bg-white/20"
                    title="Back to Dashboard"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}
                <Heart className="w-6 h-6 text-pink-400" />
                <div>
                  <h1 className="text-lg font-bold text-white">{challenge.question_set.title}</h1>
                  <p className="text-sm text-gray-300 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {partnerJoined ? "Both partners connected" : "Waiting for partner..."}
                  </p>
                </div>
              </div>
              {challenge.status !== "completed" && (
                <Badge variant={partnerJoined ? "default" : "secondary"} className="bg-white/20 backdrop-blur border-white/30 text-white">
                  {partnerJoined ? "Active" : "Pending"}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* AI Insight Alert */}
        {showAIInsight && aiInsight && (
          <Alert className="max-w-4xl mx-auto mt-4 mx-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md border-purple-400/30">
            <AlertDescription className="flex items-start gap-3 text-white">
              <Brain className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">AI Relationship Insight</p>
                <p className="text-sm opacity-90">{aiInsight}</p>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowAIInsight(false)}
                className="text-white/70 hover:text-white p-1 h-6 w-6"
              >
                ×
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Share Link Alert */}
        {!partnerJoined && isInitiator && (
          <Alert className="max-w-4xl mx-auto mt-4 mx-4 bg-white/10 backdrop-blur-md border-white/20">
            <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
              <span className="text-sm">Share this link with your partner to start the challenge</span>
              <Button size="sm" variant="outline" onClick={handleCopyLink} className="bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30 shrink-0">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl w-full mx-auto">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-white/70 py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Loading messages...</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "ai" || message.sender === "system"
                      ? "justify-center"
                      : message.sender === "user" && isInitiator || message.sender === "partner" && !isInitiator
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {message.sender === "ai" || message.sender === "system" ? (
                    <div className="max-w-2xl">
                      <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                            {message.sender === "ai" ? (
                              <Sparkles className="w-4 h-4 text-white" />
                            ) : (
                              <Heart className="w-4 h-4 text-white" />
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <div className="max-w-2xl">
                      <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                            <Heart className="w-4 h-4 text-white" />
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        {challenge.status !== "completed" && partnerJoined && (
          <div className="bg-white/10 backdrop-blur-md border-t border-white/20 shadow-lg sticky bottom-0">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    placeholder="Type your answer..."
                    className="w-full bg-white/10 backdrop-blur border-white/30 text-white placeholder:text-white/50 min-h-[44px]"
                    aria-label="Message input"
                    disabled={sending}
                  />
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={sending || !input.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 min-h-[44px] min-w-[44px]"
                  aria-label={sending ? "Sending message" : "Send message"}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <div className="mt-2 text-xs text-white/50 text-center">
                Press Enter to send • Shift+Enter for new line
              </div>
            </div>
          </div>
        )}

        {challenge.status === "completed" && (
          <div className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-md text-white border-t border-white/20">
            <div className="max-w-4xl mx-auto px-4 py-6 text-center">
              <Heart className="w-12 h-12 mx-auto mb-2" />
              <p className="text-lg font-bold">Challenge Completed!</p>
              <p className="text-sm opacity-90">Check the messages above for your compatibility results</p>
              <Button variant="secondary" className="mt-4 bg-white/20 backdrop-blur border-white/30 hover:bg-white/30" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* Conflict Detection Alert */}
        {conflictDetectionEnabled && partnerJoined && (
          <ConflictDetectionAlert
            challengeId={challengeId!}
            onExerciseStart={handleExerciseStart}
            onAlertDismiss={handleAlertDismiss}
          />
        )}

        {/* Conflict Resolution Exercise Modal */}
        {currentExercise && (
          <ConflictResolutionExercise
            exercise={currentExercise}
            challengeId={challengeId!}
            onComplete={handleExerciseComplete}
            onClose={handleExerciseClose}
          />
        )}
      </div>
    </div>
  );
}
