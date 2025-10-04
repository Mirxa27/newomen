import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Trophy } from "lucide-react";

interface Assessment {
  id: string;
  title: string;
  assessment_type: string;
  questions: any;
}

export default function MemberAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [completedAssessments, setCompletedAssessments] = useState<string[]>([]);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const [assessmentsData, resultsData] = await Promise.all([
        supabase.from("assessments").select("*"),
        supabase.from("assessment_results").select("assessment_id").eq("user_id", profile?.id)
      ]);

      if (assessmentsData.error) throw assessmentsData.error;
      setAssessments(assessmentsData.data || []);
      setCompletedAssessments(resultsData.data?.map(r => r.assessment_id) || []);
    } catch (error) {
      console.error("Error loading assessments:", error);
      toast.error("Failed to load assessments");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (value: string) => {
    setAnswers({ ...answers, [currentQuestion]: value });
  };

  const handleNext = () => {
    if (!answers[currentQuestion]) {
      toast.error("Please select an answer");
      return;
    }
    if (selectedAssessment && currentQuestion < selectedAssessment.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      saveResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const saveResults = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id, crystal_balance")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      await supabase.from("assessment_results").insert({
        user_id: profile.id,
        assessment_id: selectedAssessment!.id,
        answers,
        score: { completed: true, totalQuestions: selectedAssessment!.questions.length }
      });

      const crystalReward = 10;
      await supabase
        .from("user_profiles")
        .update({ crystal_balance: profile.crystal_balance + crystalReward })
        .eq("id", profile.id);

      setShowResults(true);
      toast.success(`Assessment complete! You earned ${crystalReward} crystals!`);
    } catch (error) {
      console.error("Error saving results:", error);
      toast.error("Failed to save results");
    }
  };

  const resetAssessment = () => {
    setSelectedAssessment(null);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    loadAssessments();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!selectedAssessment) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Member Assessments</h1>
            <p className="text-xl text-muted-foreground">Exclusive assessments with detailed insights</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment) => {
              const isCompleted = completedAssessments.includes(assessment.id);
              return (
                <Card key={assessment.id} className="hover:shadow-lg transition-shadow cursor-pointer relative" onClick={() => setSelectedAssessment(assessment)}>
                  {isCompleted && (
                    <Badge className="absolute top-4 right-4" variant="secondary">
                      <Trophy className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle>{assessment.title}</CardTitle>
                    <CardDescription>{assessment.assessment_type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {assessment.questions.length} questions • +10 crystals
                    </p>
                    <Button className="w-full">
                      {isCompleted ? "Retake Assessment" : "Start Assessment"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Complete!</CardTitle>
              <CardDescription>{selectedAssessment.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
                <div className="text-4xl font-bold text-primary mb-2">+10 Crystals</div>
                <p className="text-muted-foreground">You've earned rewards for completing this assessment!</p>
              </div>

              <Button onClick={resetAssessment} className="w-full" size="lg">
                Take Another Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const question = selectedAssessment.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / selectedAssessment.questions.length) * 100;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={resetAssessment}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {selectedAssessment.questions.length}
              </span>
            </div>
            <Progress value={progress} className="mb-4" />
            <CardTitle>{selectedAssessment.title}</CardTitle>
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

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button onClick={handleNext}>
                {currentQuestion === selectedAssessment.questions.length - 1 ? "Finish" : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
