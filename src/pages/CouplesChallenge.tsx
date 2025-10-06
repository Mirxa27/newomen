import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Heart, Copy, Check } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type CouplesChallengeRow = Tables<"couples_challenges">;
type CouplesQuestion = {
  text: string;
  options: string[];
};

type CouplesChallengeState = Omit<CouplesChallengeRow, "question_set"> & {
  question_set: CouplesQuestion[];
};

const normalizeQuestionSet = (
  value: CouplesChallengeRow["question_set"],
): CouplesQuestion[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (
        entry &&
        typeof entry === "object" &&
        "text" in entry &&
        "options" in entry &&
        Array.isArray((entry as Record<string, unknown>).options)
      ) {
        return {
          text: String((entry as Record<string, unknown>).text ?? ""),
          options: (entry as Record<string, unknown>).options.map((option) => String(option ?? "")),
        };
      }
      return null;
    })
    .filter((question): question is CouplesQuestion => Boolean(question));
};

export default function CouplesChallenge() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<CouplesChallengeState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!challengeId) {
      setLoading(false);
      return;
    }

    const fetchChallenge = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("couples_challenges")
          .select("*")
          .eq("id", challengeId)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error("Challenge not found");
        }

        setChallenge({
          ...data,
          question_set: normalizeQuestionSet(data.question_set),
        });
      } catch (error) {
        console.error("Error loading challenge:", error);
        toast.error("Failed to load challenge");
      } finally {
        setLoading(false);
      }
    };

    void fetchChallenge();
  }, [challengeId]);

  const createChallenge = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        toast.error("Please sign in to create a challenge");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        toast.error("Profile not found. Complete onboarding first.");
        return;
      }

      const questions: CouplesQuestion[] = [
        {
          text: "What's your ideal way to spend a weekend together?",
          options: ["Adventure outdoors", "Cozy at home", "Exploring the city", "Relaxing at a spa"],
        },
        {
          text: "How do you prefer to communicate during conflicts?",
          options: ["Talk it out immediately", "Take time to think first", "Write it down", "Use humor to diffuse"],
        },
        {
          text: "What's most important in a relationship?",
          options: ["Trust", "Communication", "Fun", "Support"],
        },
      ];

      const { data, error } = await supabase
        .from("couples_challenges")
        .insert({
          initiator_id: profile.id,
          question_set: questions,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("Challenge creation failed");
      }

      const normalizedChallenge: CouplesChallengeState = {
        ...data,
        question_set: normalizeQuestionSet(data.question_set),
      };

      const link = `${window.location.origin}/couples-challenge/${normalizedChallenge.id}`;
      setInviteLink(link);
      setChallenge(normalizedChallenge);
      toast.success("Challenge created! Share the link with your partner.");
    } catch (error) {
      console.error("Error creating challenge:", error);
      toast.error("Failed to create challenge");
    }
  };

  const copyInviteLink = () => {
    if (!inviteLink) {
      return;
    }

    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: value }));
  };

  const handleNext = () => {
    if (!challenge) {
      return;
    }

    if (!answers[currentQuestion]) {
      toast.error("Please select an answer");
      return;
    }

    if (currentQuestion < challenge.question_set.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      void submitAnswers();
    }
  };

  const submitAnswers = async () => {
    if (!challengeId || !challenge) {
      toast.error("Challenge is not ready for submission");
      return;
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        toast.error("You must be signed in to submit answers");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        toast.error("Profile not found. Complete onboarding first.");
        return;
      }

      const isInitiator = challenge.initiator_id === profile.id;
      const updateField = isInitiator ? "initiator_responses" : "partner_responses";

      const { error: updateError } = await supabase
        .from("couples_challenges")
        .update({ [updateField]: answers })
        .eq("id", challengeId);

      if (updateError) {
        throw updateError;
      }

      if (!isInitiator) {
        const { error: partnerError } = await supabase
          .from("couples_challenges")
          .update({ partner_id: profile.id, status: "completed" })
          .eq("id", challengeId);

        if (partnerError) {
          throw partnerError;
        }
      }

      toast.success("Responses submitted!");
      navigate(`/couples-challenge-results/${challengeId}`);
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

  if (challenge && challenge.question_set.length > 0) {
    const question = challenge.question_set[currentQuestion];

    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Couple's Challenge</CardTitle>
                  <CardDescription>Question {currentQuestion + 1} of {challenge.question_set.length}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-6 rounded-lg">
                <p className="text-lg font-medium">{question.text}</p>
              </div>

              <RadioGroup value={answers[currentQuestion] ?? ""} onValueChange={handleAnswerChange}>
                {question.options.map((option, index) => (
                  <Label
                    key={option}
                    htmlFor={`option-${index}`}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer gap-4 ${
                      answers[currentQuestion] === option ? "border-primary bg-primary/10" : "hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <span>{option}</span>
                    </div>
                    {answers[currentQuestion] === option && <Check className="w-5 h-5 text-primary" />}
                  </Label>
                ))}
              </RadioGroup>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}>
                  Previous
                </Button>
                <Button onClick={handleNext}>
                  {currentQuestion === challenge.question_set.length - 1 ? "Submit" : "Next"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Heart className="w-12 h-12 text-primary mx-auto" />
        <p className="text-muted-foreground">No challenge found. Check your invitation link and try again.</p>
        <Button variant="outline" onClick={() => navigate("/couples-challenge")}>Create a new challenge</Button>
      </div>
    </div>
  );
}
