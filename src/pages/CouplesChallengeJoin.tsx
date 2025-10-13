import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Heart, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CouplesChallengeJoin() {
  const { id: challengeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChallenge();
  }, [challengeId]);

  const loadChallenge = async () => {
    try {
      const { data, error } = await supabase
        .from("couples_challenges")
        .select("*, user_profiles!couples_challenges_initiator_id_fkey(nickname, frontend_name)")
        .eq("id", challengeId)
        .single();

      if (error) throw error;

      if (data.partner_id) {
        setError("This challenge already has a partner joined.");
        return;
      }

      if (data.status === "completed") {
        setError("This challenge has already been completed.");
        return;
      }

      setChallenge(data);
    } catch (err) {
      console.error("Error loading challenge:", err);
      setError("Challenge not found or has expired.");
    } finally {
      setLoading(false);
    }
  };

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
      // Create a temporary guest user profile for the partner
      const { data: guestProfile, error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          email: `guest_${Date.now()}@temp.newomen.app`,
          nickname: partnerName.trim(),
          frontend_name: partnerName.trim(),
          role: "guest",
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Update challenge with partner ID
      const { error: updateError } = await supabase
        .from("couples_challenges")
        .update({
          partner_id: guestProfile.id,
          status: "in_progress",
        })
        .eq("id", challengeId);

      if (updateError) throw updateError;

      // Add system message that partner joined
      const joinMessage = {
        id: crypto.randomUUID(),
        sender: "system",
        content: `${partnerName} has joined the challenge! 🎉`,
        timestamp: new Date().toISOString(),
      };

      const { data: currentChallenge } = await supabase
        .from("couples_challenges")
        .select("messages")
        .eq("id", challengeId)
        .single();

      const currentMessages = currentChallenge?.messages || [];
      
      await supabase
        .from("couples_challenges")
        .update({
          messages: [...currentMessages, joinMessage],
        })
        .eq("id", challengeId);

      toast({
        title: "Welcome!",
        description: "You've joined the challenge successfully",
      });

      // Navigate to chat page
      navigate(`/couples-challenge/chat/${challengeId}`);
    } catch (err) {
      console.error("Error joining challenge:", err);
      toast({
        title: "Error",
        description: "Failed to join challenge. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Oops!</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/")}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questionSet = challenge.question_set || {};
  const initiatorName = challenge.user_profiles?.nickname || challenge.user_profiles?.frontend_name || "Your partner";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-4">
              <Heart className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">You've Been Invited!</CardTitle>
          <CardDescription className="text-base">
            {initiatorName} invites you to join a couple's challenge
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{questionSet.title || "Couple's Challenge"}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {questionSet.description || "Answer questions together and discover your compatibility!"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {Array.isArray(questionSet.questions) ? questionSet.questions.length : 0} questions
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleJoin()}
              disabled={joining}
            />
            <p className="text-xs text-muted-foreground">
              No account needed - just enter your name to start
            </p>
          </div>

          <Button
            onClick={handleJoin}
            disabled={joining || !partnerName.trim()}
            className="w-full"
            size="lg"
          >
            {joining ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Joining...</>
            ) : (
              <><Heart className="w-4 h-4 mr-2" /> Join Challenge</>
            )}
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Powered by <span className="font-semibold text-primary">NewWomen</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

