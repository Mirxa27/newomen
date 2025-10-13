import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Copy, Check, Send, Heart, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "@/components/ui/avatar";

type Message = {
  id: string;
  sender: "ai" | "user" | "partner" | "system";
  content: string;
  timestamp: string;
};

type ChallengeData = {
  id: string;
  initiator_id: string;
  partner_id: string | null;
  status: string;
  question_set: {
    title: string;
    description: string;
    questions: string[];
  };
  messages: Message[];
  current_question_index: number;
};

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

  const shareUrl = `${window.location.origin}/couples-challenge/join/${challengeId}`;

  useEffect(() => {
    loadChallenge();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`challenge-${challengeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [challengeId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChallenge = async () => {
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

      const challengeData = data as any;
      const questionSet = challengeData.question_set;
      
      setChallenge({
        id: challengeData.id,
        initiator_id: challengeData.initiator_id,
        partner_id: challengeData.partner_id,
        status: challengeData.status,
        question_set: {
          title: questionSet.title || "Couple's Challenge",
          description: questionSet.description || "",
          questions: Array.isArray(questionSet.questions) ? questionSet.questions : JSON.parse(questionSet.questions || "[]"),
        },
        messages: challengeData.messages || [],
        current_question_index: challengeData.current_question_index || 0,
      });

      setMessages(challengeData.messages || []);
      setIsInitiator(currentUserId === challengeData.initiator_id);
      setPartnerJoined(!!challengeData.partner_id);

      // Initialize chat if no messages yet
      if (!challengeData.messages || challengeData.messages.length === 0) {
        await initializeChat(challengeData, questionSet);
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
  };

  const initializeChat = async (challengeData: any, questionSet: any) => {
    const welcomeMessages: Message[] = [
      {
        id: crypto.randomUUID(),
        sender: "ai",
        content: `Welcome to ${questionSet.title}! 💕`,
        timestamp: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        sender: "ai",
        content: questionSet.description,
        timestamp: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        sender: "system",
        content: "Share the link with your partner to get started!",
        timestamp: new Date().toISOString(),
      },
    ];

    await supabase
      .from("couples_challenges")
      .update({ messages: welcomeMessages })
      .eq("id", challengeData.id);
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
      await supabase
        .from("couples_challenges")
        .update({ messages: updatedMessages })
        .eq("id", challengeId);

      setMessages(updatedMessages);
      setInput("");

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
    const questionResponses = currentMessages.filter(m => 
      (m.sender === "user" || m.sender === "partner") && 
      m.content.length > 0
    );

    // If both answered current question, move to next
    if (partnerJoined && questionResponses.length >= (currentIndex + 1) * 2) {
      if (currentIndex < questions.length - 1) {
        // Ask next question
        const nextQuestion: Message = {
          id: crypto.randomUUID(),
          sender: "ai",
          content: questions[currentIndex + 1],
          timestamp: new Date().toISOString(),
        };

        const newMessages = [...currentMessages, nextQuestion];
        
        await supabase
          .from("couples_challenges")
          .update({ 
            messages: newMessages,
            current_question_index: currentIndex + 1,
          })
          .eq("id", challengeId);

      } else {
        // All questions answered, generate analysis
        await generateAnalysis();
      }
    } else if (!partnerJoined) {
      // Ask first question when partner joins
      if (currentMessages.length === 3) { // Only initial messages
        const firstQuestion: Message = {
          id: crypto.randomUUID(),
          sender: "ai",
          content: questions[0],
          timestamp: new Date().toISOString(),
        };

        await supabase
          .from("couples_challenges")
          .update({ messages: [...currentMessages, firstQuestion] })
          .eq("id", challengeId);
      }
    }
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
          messages: [...messages, analysisMessage],
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", challengeId);

      // Call edge function to generate AI analysis
      const { data, error } = await supabase.functions.invoke('couples-challenge-analyzer', {
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
          messages: [...messages, analysisMessage, resultMessage],
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md">
          <h2 className="text-xl font-bold mb-4">Challenge Not Found</h2>
          <Button onClick={() => navigate("/couples-challenge")}>
            Start New Challenge
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-pink-500" />
              <div>
                <h1 className="text-lg font-bold">{challenge.question_set.title}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {partnerJoined ? "Both partners connected" : "Waiting for partner..."}
                </p>
              </div>
            </div>
            {challenge.status !== "completed" && (
              <Badge variant={partnerJoined ? "default" : "secondary"}>
                {partnerJoined ? "Active" : "Pending"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Share Link Alert */}
      {!partnerJoined && isInitiator && (
        <Alert className="max-w-4xl mx-auto mt-4 mx-4">
          <AlertDescription className="flex items-center justify-between gap-4">
            <span className="text-sm">Share this link with your partner to start the challenge</span>
            <Button size="sm" variant="outline" onClick={handleCopyLink}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl w-full mx-auto">
        <div className="space-y-4">
          {messages.map((message) => (
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
                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400">
                        <Heart className="w-4 h-4 text-white m-auto" />
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary">
                          {message.sender === "ai" ? "NewWomen AI" : "System"}
                        </p>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="max-w-xs md:max-w-md">
                  <Card
                    className={`p-3 ${
                      message.sender === "user" && isInitiator || message.sender === "partner" && !isInitiator
                        ? "bg-primary text-primary-foreground"
                        : "bg-white dark:bg-gray-700"
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {message.sender === "user" && isInitiator || message.sender === "partner" && !isInitiator
                        ? "You"
                        : "Partner"}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </Card>
                  <p className="text-xs text-muted-foreground mt-1 px-2">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      {challenge.status !== "completed" && partnerJoined && (
        <div className="bg-white dark:bg-gray-800 border-t shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="Type your answer..."
                className="flex-1"
                disabled={sending}
              />
              <Button onClick={handleSendMessage} disabled={sending || !input.trim()}>
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {challenge.status === "completed" && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="max-w-4xl mx-auto px-4 py-6 text-center">
            <Heart className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-bold">Challenge Completed!</p>
            <p className="text-sm opacity-90">Check the messages above for your compatibility results</p>
            <Button variant="secondary" className="mt-4" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

