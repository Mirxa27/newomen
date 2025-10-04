import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const LIFE_AREAS = [
  "Career & Purpose",
  "Relationships",
  "Health & Wellness",
  "Personal Growth",
  "Finance",
  "Recreation & Joy",
  "Environment",
  "Spirituality"
];

const PERSONALITY_QUESTIONS = [
  "I prefer planning ahead rather than being spontaneous",
  "I find it easy to connect with new people",
  "I often worry about what others think of me",
  "I enjoy taking risks and trying new things",
  "I find it important to help others"
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [personalityAnswers, setPersonalityAnswers] = useState<number[]>([]);
  const [balanceScores, setBalanceScores] = useState<Record<string, number>>({});
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const progress = (step / 3) * 100;

  const handlePersonalityAnswer = (score: number) => {
    const newAnswers = [...personalityAnswers, score];
    setPersonalityAnswers(newAnswers);

    if (newAnswers.length === PERSONALITY_QUESTIONS.length) {
      setTimeout(() => setStep(2), 300);
    }
  };

  const handleBalanceScore = (area: string, score: number) => {
    setBalanceScores(prev => ({ ...prev, [area]: score }));
  };

  const completeOnboarding = async () => {
    try {
      // Save user profile
      const { error } = await supabase
        .from("user_memory_profiles")
        .insert({
          user_id: user?.id,
          personality_type: "explorer", // Simplified for now
          balance_wheel_scores: balanceScores,
          narrative_patterns: {},
          emotional_state_history: {}
        });

      if (error) throw error;

      // Initialize user profile with Discovery tier
      await supabase
        .from("user_profiles")
        .insert({
          email: user?.email || "",
          subscription_tier: "discovery",
          remaining_minutes: 10,
          current_level: 1,
          crystal_balance: 0,
          daily_streak: 0
        });

      toast({
        title: "Welcome to NewWomen!",
        description: "Your journey begins now.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl glass-card p-8">
        <Progress value={progress} className="mb-8" />

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Discover Yourself</h2>
              <p className="text-muted-foreground">
                Question {personalityAnswers.length + 1} of {PERSONALITY_QUESTIONS.length}
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-lg">
                {PERSONALITY_QUESTIONS[personalityAnswers.length]}
              </p>

              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((score) => (
                  <Button
                    key={score}
                    onClick={() => handlePersonalityAnswer(score)}
                    variant="outline"
                    className="clay-card hover:scale-105 transition-transform"
                  >
                    {score}
                  </Button>
                ))}
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Disagree</span>
                <span>Agree</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Balance Wheel</h2>
              <p className="text-muted-foreground">
                Rate your satisfaction in each life area (1-10)
              </p>
            </div>

            <div className="space-y-4">
              {LIFE_AREAS.map((area) => (
                <div key={area} className="space-y-2">
                  <div className="flex justify-between">
                    <span>{area}</span>
                    <span className="text-primary">{balanceScores[area] || 0}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={balanceScores[area] || 5}
                    onChange={(e) => handleBalanceScore(area, parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            <Button
              onClick={() => setStep(3)}
              disabled={Object.keys(balanceScores).length < LIFE_AREAS.length}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Journey Awaits</h2>
              <p className="text-muted-foreground">
                Based on your responses, we've identified key areas for growth.
              </p>
            </div>

            <div className="glass-card p-6 space-y-4">
              <h3 className="font-semibold">Top Focus Areas:</h3>
              <ul className="space-y-2">
                {Object.entries(balanceScores)
                  .sort(([, a], [, b]) => a - b)
                  .slice(0, 3)
                  .map(([area]) => (
                    <li key={area} className="clay-card p-3 text-left">
                      {area}
                    </li>
                  ))}
              </ul>
            </div>

            <Button onClick={completeOnboarding} className="w-full">
              Begin My Transformation
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
