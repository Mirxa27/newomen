import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Heart, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ChallengeWithProfile = {
  id: string;
  initiator_id: string;
  partner_id: string | null;
  status: string;
  question_set: {
    title: string;
    description: string;
    questions: string[];
  };
  messages: Array<{
    id: string;
    sender: string;
    content: string;
    timestamp: string;
  }>;
  user_profiles?: {
    nickname: string | null;
    frontend_name: string | null;
  };
};

export default function CouplesChallengeJoin() {
  const { id: challengeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [challenge, setChallenge] = useState<ChallengeWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadChallenge = useCallback(async () => {
    try {
      // Using explicit type bypass since couples_challenges table isn't in the limited TypeScript types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("couples_challenges")
        .select("*, user_profiles!couples_challenges_initiator_id_fkey(nickname, frontend_name)")
        .eq("id", challengeId)
        .single();

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      if (!data) {
        console.error("Challenge not found:", challengeId);
        setError("This challenge link is invalid or the challenge no longer exists. Please ask your partner for a new link.");
        setLoading(false);
        return;
      }

      // Check if partner already joined (either registered user or guest)
      if (data.partner_id || data.partner_name) {
        setError("This challenge already has a partner joined.");
        return;
      }

      if (data.status === "completed") {
        setError("This challenge has already been completed.");
        return;
      }

      setChallenge(data as ChallengeWithProfile);
    } catch (err) {
      console.error("Error loading challenge:", err);
      setError("Challenge not found. Please check the link and try again, or ask your partner for a new invitation.");
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  const handleJoin = async () => {
    if (!partnerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to continue",
        variant: "destructive",
      });
      return;
    }

    setJoining(true);
    try {
      console.log('Starting join process for challenge:', challengeId);
      
      // Fetch current challenge data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: currentChallenge, error: fetchError } = await (supabase as any)
        .from("couples_challenges")
        .select("messages, question_set, status, partner_id, partner_name")
        .eq("id", challengeId)
        .single();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw new Error(`Failed to fetch challenge: ${fetchError.message}`);
      }

      if (!currentChallenge) {
        throw new Error('Challenge not found');
      }

      // Check if already joined (either by registered user or guest)
      if (currentChallenge.partner_id || currentChallenge.partner_name) {
        throw new Error('This challenge already has a partner');
      }

      console.log('Challenge data loaded:', currentChallenge);

      const currentMessages = currentChallenge?.messages || [];
      const questionSet = currentChallenge?.question_set as { title?: string; description?: string; questions?: string[] | string };
      const questions = Array.isArray(questionSet?.questions) 
        ? questionSet.questions 
        : (questionSet?.questions ? JSON.parse(questionSet.questions as string) : []);

      // Add system message and first question
      const joinMessage = {
        id: crypto.randomUUID(),
        sender: "system",
        content: `${partnerName.trim()} has joined the challenge! 🎉`,
        timestamp: new Date().toISOString(),
      };

      const firstQuestion = {
        id: crypto.randomUUID(),
        sender: "ai",
        content: questions[0] || "Let's get started!",
        timestamp: new Date().toISOString(),
      };

      // Update challenge with partner name and status
      // Note: We DON'T set partner_id for guests (leave it NULL)
      // We only use partner_name to identify guest partners
      console.log('Updating challenge with partner info...');
      const updateData = {
        partner_name: partnerName.trim(),
        // partner_id stays NULL for guest partners
        status: "in_progress",
        messages: [...currentMessages, joinMessage, firstQuestion],
      };
      console.log('Update data:', updateData);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updateResult, error: updateError } = await (supabase as any)
        .from("couples_challenges")
        .update(updateData)
        .eq("id", challengeId)
        .select();

      if (updateError) {
        console.error("Update error details:", updateError);
        throw new Error(`Failed to update challenge: ${updateError.message}. ${updateError.hint || ''}`);
      }

      console.log('Challenge updated successfully:', updateResult);

      toast({
        title: "Welcome!",
        description: "You've joined the challenge successfully",
      });

      // Navigate to chat page
      navigate(`/couples-challenge/chat/${challengeId}`);
    } catch (err) {
      console.error("Error joining challenge:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to join challenge. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-pink-800 to-blue-900">
        <div className="absolute inset-0 bg-[url('/fixed-background.jpg')] bg-cover bg-center bg-no-repeat opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-purple-900/40 to-black/60 backdrop-blur-sm" />
        <div className="relative min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-pink-800 to-blue-900">
        <div className="absolute inset-0 bg-[url('/fixed-background.jpg')] bg-cover bg-center bg-no-repeat opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-purple-900/40 to-black/60 backdrop-blur-sm" />
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <Heart className="w-12 h-12 text-pink-400 mx-auto mb-4" />
              <CardTitle className="text-white">Oops!</CardTitle>
              <CardDescription className="text-gray-300">{error}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate("/")} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const questionSet = challenge.question_set || { title: "Couple's Challenge", description: "", questions: [] };
  const initiatorName = challenge.user_profiles?.nickname || challenge.user_profiles?.frontend_name || "Your partner";

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-pink-800 to-blue-900">
      <div className="absolute inset-0 bg-[url('/fixed-background.jpg')] bg-cover bg-center bg-no-repeat opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-purple-900/40 to-black/60 backdrop-blur-sm" />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-4">
                <Heart className="w-12 h-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">You've Been Invited!</CardTitle>
            <CardDescription className="text-base text-gray-300">
              {initiatorName} invites you to join a couple's challenge
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white/5 backdrop-blur rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-pink-400" />
                <h3 className="font-semibold text-white">{questionSet.title}</h3>
              </div>
              <p className="text-sm text-gray-300">
                {questionSet.description}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {Array.isArray(questionSet.questions) ? questionSet.questions.length : 0} questions
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleJoin()}
                disabled={joining}
                className="bg-white/10 backdrop-blur border-white/30 text-white placeholder:text-white/50"
              />
              <p className="text-xs text-gray-400">
                No account needed - just enter your name to start
              </p>
            </div>

            <Button
              onClick={handleJoin}
              disabled={joining || !partnerName.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              size="lg"
            >
              {joining ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Joining...</>
              ) : (
                <><Heart className="w-4 h-4 mr-2" /> Join Challenge</>
              )}
            </Button>

            <div className="text-center">
              <p className="text-xs text-gray-400">
                Powered by <span className="font-semibold text-pink-400">NewWomen</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
