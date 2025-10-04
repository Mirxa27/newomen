import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Heart, Copy, Check } from "lucide-react";

export default function CouplesChallenge() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (challengeId) {
      loadChallenge();
    } else {
      setLoading(false);
    }
  }, [challengeId]);

  const loadChallenge = async () => {
    try {
      const { data, error } = await supabase
        .from("couples_challenges")
        .select("*")
        .eq("id", challengeId)
        .single();

      if (error) throw error;
      setChallenge(data);
    } catch (error) {
      console.error("Error loading challenge:", error);
      toast.error("Failed to load challenge");
    } finally {
      setLoading(false);
    }
  };

  const createChallenge = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const questions = [
        { text: "What's your ideal way to spend a weekend together?", options: ["Adventure outdoors", "Cozy at home", "Exploring the city", "Relaxing at a spa"] },
        { text: "How do you prefer to communicate during conflicts?", options: ["Talk it out immediately", "Take time to think first", "Write it down", "Use humor to diffuse"] },
        { text: "What's most important in a relationship?", options: ["Trust", "Communication", "Fun", "Support"] }
      ];

      const { data, error } = await supabase
        .from("couples_challenges")
        .insert({
          initiator_id: profile?.id,
          question_set: questions,
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/couples-challenge/${data.id}`;
      setInviteLink(link);
      setChallenge(data);
      toast.success("Challenge created! Share the link with your partner.");
    } catch (error) {
      console.error("Error creating challenge:", error);
      toast.error("Failed to create challenge");
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAnswerChange = (value: string) => {
    setAnswers({ ...answers, [currentQuestion]: value });
  };

  const handleNext = () => {
    if (!answers[currentQuestion]) {
      toast.error("Please select an answer");
      return;
    }

    if (challenge && currentQuestion < challenge.question_set.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitAnswers();
    }
  };

  const submitAnswers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const isInitiator = challenge.initiator_id === profile?.id;
      const updateField = isInitiator ? "initiator_responses" : "partner_responses";

      await supabase
        .from("couples_challenges")
        .update({ [updateField]: answers })
        .eq("id", challengeId);

      if (!isInitiator) {
        await supabase
          .from("couples_challenges")
          .update({ partner_id: profile?.id, status: "completed" })
          .eq("id", challengeId);
      }

      toast.success("Responses submitted!");
      navigate("/couples-challenge-results/" + challengeId);
    } catch (error) {
      console.error("Error submitting answers:", error);
      toast.error("Failed to submit answers");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!challenge && !challengeId) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Heart className="w-16 h-16 text-primary mx-auto mb-4" />
              <CardTitle>Couple's Challenge</CardTitle>
              <CardDescription>
                Connect deeper with your partner by answering questions together
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="font-semibold mb-2">How it works:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Create a challenge and get a unique link</li>
                  <li>Share the link with your partner</li>
                  <li>Both answer the questions privately</li>
                  <li>Reveal answers together and see AI compatibility insights</li>
                </ol>
              </div>

              {inviteLink ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly />
                    <Button onClick={copyInviteLink} size="icon">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Share this link with your partner to start the challenge
                  </p>
                </div>
              ) : (
                <Button onClick={createChallenge} className="w-full" size="lg">
                  Create Challenge
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (challenge && challenge.question_set) {
    const question = challenge.question_set[currentQuestion];
    
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <Heart className="w-6 h-6 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestion + 1} of {challenge.question_set.length}
                </span>
              </div>
              <CardTitle>Couple's Challenge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{question.text}</h3>
                <RadioGroup value={answers[currentQuestion] || ""} onValueChange={handleAnswerChange}>
                  {question.options.map((option: string, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted transition-colors">
                      <RadioGroupItem value={option} id={`option-${idx}`} />
                      <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button onClick={handleNext} className="w-full">
                {currentQuestion === challenge.question_set.length - 1 ? "Submit Answers" : "Next Question"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
