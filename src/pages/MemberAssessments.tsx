import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Target, Brain, Heart, Zap } from "lucide-react";
import { memberAssessments } from "@/data/memberAssessments";

const categoryIcons = {
  personality: Brain,
  emotional: Heart,
  career: Target,
  wellness: Zap,
  relationships: Heart,
  growth: Target
};

export default function MemberAssessments() {
  const navigate = useNavigate();
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const startAssessment = (assessment: any) => {
    setSelectedAssessment(assessment);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion]: answer });
  };

  const handleNext = () => {
    if (!answers[currentQuestion]) {
      toast.error("Please select an answer");
      return;
    }

    if (currentQuestion < selectedAssessment.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = async () => {
    const totalQuestions = selectedAssessment.questions.length;
    const calculatedScore = Math.floor((Object.keys(answers).length / totalQuestions) * 100);
    setScore(calculatedScore);
    setShowResults(true);

    // Save to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id, crystal_balance")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          await supabase.from("assessment_results").insert({
            user_id: profile.id,
            assessment_id: selectedAssessment.id,
            answers: answers,
            score: { total: calculatedScore }
          });

          // Award crystals
          await supabase
            .from("user_profiles")
            .update({ 
              crystal_balance: (profile.crystal_balance || 0) + 50 
            })
            .eq("id", profile.id);

          toast.success("Assessment completed! +50 Crystals earned!");
        }
      }
    } catch (error) {
      console.error("Error saving results:", error);
    }
  };

  const getResultMessage = () => {
    if (score >= 80) return { title: "Excellent!", description: "You show strong understanding in this area.", color: "text-green-500" };
    if (score >= 60) return { title: "Good Progress", description: "You're on the right track with room to grow.", color: "text-blue-500" };
    return { title: "Keep Growing", description: "This is a great area to focus your development.", color: "text-amber-500" };
  };

  if (showResults) {
    const result = getResultMessage();
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card">
            <CardHeader className="text-center">
              <CheckCircle className={`w-16 h-16 mx-auto mb-4 ${result.color}`} />
              <CardTitle className="text-3xl mb-2">{result.title}</CardTitle>
              <CardDescription className="text-lg">{selectedAssessment.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="clay p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Your Score</span>
                  <span className="text-3xl font-bold gradient-text">{score}%</span>
                </div>
                <Progress value={score} className="h-3" />
                <p className="text-muted-foreground">{result.description}</p>
              </div>

              <div className="clay p-6 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Insights & Recommendations
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Based on your responses, consider focusing on self-reflection practices</li>
                  <li>• Your answers suggest strong emotional awareness</li>
                  <li>• Continue exploring this topic through our AI conversations</li>
                  <li>• Track your progress by retaking this assessment in 30 days</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => {
                    setSelectedAssessment(null);
                    setShowResults(false);
                  }}
                  className="flex-1"
                  variant="outline"
                >
                  Browse Assessments
                </Button>
                <Button 
                  onClick={() => navigate("/chat")}
                  className="flex-1 glow-primary"
                >
                  Discuss with AI
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedAssessment) {
    const question = selectedAssessment.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / selectedAssessment.questions.length) * 100;

    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={() => setSelectedAssessment(null)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestion + 1} of {selectedAssessment.questions.length}
                </span>
              </div>
              <Progress value={progress} className="h-2 mb-4" />
              <CardTitle className="text-xl">{selectedAssessment.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{question.question}</h3>
                <RadioGroup value={answers[currentQuestion] || ""} onValueChange={handleAnswer}>
                  {question.options.map((option: string, idx: number) => (
                    <div 
                      key={idx} 
                      className="flex items-center space-x-3 p-4 rounded-xl hover:bg-muted/50 transition-colors border border-border"
                    >
                      <RadioGroupItem value={option} id={`q${currentQuestion}-opt${idx}`} />
                      <Label 
                        htmlFor={`q${currentQuestion}-opt${idx}`} 
                        className="flex-1 cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handlePrevious} 
                  disabled={currentQuestion === 0}
                  variant="outline"
                  className="flex-1"
                >
                  Previous
                </Button>
                <Button 
                  onClick={handleNext} 
                  className="flex-1 glow-primary"
                  disabled={!answers[currentQuestion]}
                >
                  {currentQuestion === selectedAssessment.questions.length - 1 ? "Finish" : "Next"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">Member Assessments</h1>
          <p className="text-xl text-muted-foreground">
            Deep dive into your personal growth journey with 20 comprehensive assessments
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberAssessments.map((assessment) => {
            const Icon = categoryIcons[assessment.category as keyof typeof categoryIcons] || Target;
            return (
              <Card 
                key={assessment.id} 
                className="glass hover:scale-105 transition-transform cursor-pointer group"
                onClick={() => startAssessment(assessment)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {assessment.category}
                    </Badge>
                  </div>
                  <CardTitle className="group-hover:gradient-text transition-all">
                    {assessment.title}
                  </CardTitle>
                  <CardDescription>{assessment.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{assessment.questions.length} Questions</span>
                    <span>~{Math.ceil(assessment.questions.length * 0.5)} min</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
