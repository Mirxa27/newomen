import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Send, Heart, Users, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trackCouplesChallengeCompletion } from "@/lib/gamification-events";
import type { Json, TablesUpdate, TablesInsert } from "@/integrations/supabase/types";
import { CouplesChallenges } from "@/integrations/supabase/tables/couples_challenges";
import { ChallengeTemplates } from "@/integrations/supabase/tables/challenge_templates";
import { UserProfiles } from "@/integrations/supabase/tables/user_profiles"; // Import UserProfiles

interface ChallengeTemplate extends ChallengeTemplates['Row'] {
  questions: Json; // Assuming questions is JSON
}

interface Challenge extends CouplesChallenges['Row'] {
  responses: Json;
}

export default function CouplesChallenge() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [template, setTemplate] = useState<ChallengeTemplate | null>(null);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const loadChallenge = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);

      const { data: challengeData, error: challengeError } = await supabase
        .from("couples_challenges")
        .select("*, challenge_templates(*)")
        .eq("id", id)
        .single();

      if (challengeError) throw challengeError;
      if (!challengeData) {
        setError("Challenge data not found.");
        return;
      }

      setChallenge(challengeData as unknown as Challenge);
      setTemplate(challengeData.challenge_templates as unknown as ChallengeTemplate);
      setResponses((challengeData.responses as Record<string, unknown>) || {});
    } catch (err) {
      console.error("Error loading challenge:", err);
      setError("Failed to load the challenge. It might not exist or you may not have access.");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  const handleResponseChange = (questionIndex: string, value: string) => {
    const isInitiator = userId === challenge?.initiator_id;
    const responseKey = isInitiator ? "initiator_response" : "partner_response";

    setResponses(prev => ({
      ...prev,
      [questionIndex]: {
        ...(prev[questionIndex] as Record<string, string> || {}),
        [responseKey]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!challenge) return;
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from("couples_challenges")
        .update({ responses: responses as Json } as TablesUpdate<'couples_challenges'>)
        .eq("id", challenge.id);

      if (updateError) throw updateError;

      // Check if both partners have responded to all questions
      const allAnswered = template?.questions && Array.isArray(template.questions) && template.questions.every((_q, index) => {
        const res = responses[String(index)] as Record<string, string> | undefined;
        return res?.initiator_response && res?.partner_response;
      });

      if (allAnswered && challenge.status !== 'completed') {
        const { error: completeError } = await supabase
          .from("couples_challenges")
          .update({ status: 'completed', completed_at: new Date().toISOString() } as TablesUpdate<'couples_challenges'>)
          .eq("id", challenge.id);
        if (completeError) throw completeError;
        
        // Track completion for gamification
        if (challenge.initiator_id) {
          trackCouplesChallengeCompletion(challenge.initiator_id, challenge.id); // Removed extra argument
        }
        if (challenge.partner_id) {
          trackCouplesChallengeCompletion(challenge.partner_id, challenge.id); // Removed extra argument
        }

        toast({
          title: "Challenge Complete!",
          description: "You've both answered all questions. Time to see the results!",
        });
        // Refresh data to show completion screen
        loadChallenge();
      } else {
        toast({
          title: "Responses Saved!",
          description: "Your answers have been saved. Waiting for your partner.",
        });
      }
    } catch (err) {
      console.error("Error submitting responses:", err);
      toast({
        title: "Error",
        description: "Failed to save your responses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !challenge || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isInitiator = userId === challenge.initiator_id;
  const questionsArray = Array.isArray(template.questions) ? template.questions : [];
  const progress = (Object.keys(responses).length / questionsArray.length) * 100;

  if (challenge.status === 'completed') {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader className="text-center">
              <Heart className="w-12 h-12 mx-auto text-primary" />
              <CardTitle className="text-3xl mt-4">Challenge Complete!</CardTitle>
              <CardDescription>{template.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {questionsArray.map((question: any, index) => {
                const questionResponses = (responses[String(index)] as { initiator_response?: string; partner_response?: string }) || {};
                const initiatorResponse = questionResponses.initiator_response;
                const partnerResponse = questionResponses.partner_response;

                return (
                  <div key={index}>
                    <h3 className="font-semibold text-lg mb-4">
                      {index + 1}. {question.text || question}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-muted/50">
                        <CardHeader>
                          <CardTitle className="text-base">Your Answer</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">
                            {isInitiator ? initiatorResponse : partnerResponse}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/50">
                        <CardHeader>
                          <CardTitle className="text-base">Partner's Answer</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">
                            {isInitiator ? partnerResponse : initiatorResponse}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })}
              <div className="text-center pt-4">
                <Button onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">{template.title}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </div>
              <Badge variant="secondary" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Couples Challenge
              </Badge>
            </div>
            <div className="pt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {Object.keys(responses).length} of {questionsArray.length} questions answered.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {questionsArray.map((question: any, index) => {
              const questionResponses = (responses[String(index)] as { initiator_response?: string; partner_response?: string }) || {};
              const initiatorResponse = questionResponses.initiator_response;
              const partnerResponse = questionResponses.partner_response;
              const myResponse = isInitiator ? initiatorResponse : partnerResponse;
              const partnerHasResponded = isInitiator ? !!partnerResponse : !!initiatorResponse;

              return (
                <div key={index}>
                  <h3 className="font-semibold text-lg mb-2">
                    {index + 1}. {question.text || question}
                  </h3>
                  <Textarea
                    value={myResponse || ""}
                    onChange={(e) => handleResponseChange(String(index), e.target.value)}
                    placeholder="Your answer..."
                    rows={4}
                  />
                  {!partnerHasResponded && (
                    <Alert variant="default" className="mt-2">
                      <Lock className="h-4 w-4" />
                      <AlertDescription>
                        Your partner hasn't answered this question yet. Your answers will be revealed to each other once you've both responded.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })}
            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Save Responses
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}