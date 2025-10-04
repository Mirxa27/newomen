import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Assessment {
  id: string;
  title: string;
  assessment_type: string;
  questions: any;
  is_public: boolean;
}

export default function PublicAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPublicAssessments();
  }, []);

  const loadPublicAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("is_public", true);

      if (error) throw error;
      setAssessments(data || []);
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
      calculateResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = () => {
    setShowResults(true);
    toast.success("Assessment complete! Sign up to save your results.");
  };

  const resetAssessment = () => {
    setSelectedAssessment(null);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading assessments...</p>
        </div>
      </div>
    );
  }

  if (!selectedAssessment) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Free Assessments</h1>
            <p className="text-xl text-muted-foreground">Discover insights about yourself - no signup required</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment) => (
              <Card key={assessment.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedAssessment(assessment)}>
                <CardHeader>
                  <CardTitle>{assessment.title}</CardTitle>
                  <CardDescription>{assessment.assessment_type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {assessment.questions.length} questions
                  </p>
                  <Button className="w-full">Start Assessment</Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Want More?</CardTitle>
                <CardDescription>Sign up to access 20+ member-only assessments and save your results</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/auth")} size="lg">Sign Up Free</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = Math.round((Object.keys(answers).length / selectedAssessment.questions.length) * 100);
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
                <div className="text-6xl font-bold text-primary mb-2">{score}%</div>
                <p className="text-muted-foreground">Completion Score</p>
              </div>
              
              <div className="bg-muted p-6 rounded-lg">
                <p className="text-center mb-4">Sign up to get detailed analysis and save your results!</p>
                <Button onClick={() => navigate("/auth")} className="w-full" size="lg">Create Free Account</Button>
              </div>

              <Button onClick={resetAssessment} variant="outline" className="w-full">Take Another Assessment</Button>
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
                Back to Assessments
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
