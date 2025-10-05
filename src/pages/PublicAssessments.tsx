import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Clock, CheckCircle } from "lucide-react";
import { publicAssessments } from "@/data/publicAssessments";

interface Assessment {
  id: string;
  title: string;
  assessment_type: string;
  questions: any;
  is_public: boolean;
}

export default function PublicAssessments() {
  const { assessmentId } = useParams();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPublicAssessments();
    if (assessmentId) {
      const staticAssessment = publicAssessments.find(a => a.id === assessmentId);
      if (staticAssessment) {
        setSelectedAssessment(staticAssessment);
        setLoading(false);
      }
    }
  }, [assessmentId]);

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
            <div className="mb-8 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Free Self-Discovery Assessments
              </h1>
              <p className="text-muted-foreground text-lg">No signup required - Start your journey today</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicAssessments.map((assessment, index) => (
                <Card 
                  key={assessment.id} 
                  className="hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => navigate(`/assessments/${assessment.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="capitalize">
                        {assessment.category}
                      </Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        {assessment.duration}
                      </div>
                    </div>
                    <CardTitle className="text-xl">{assessment.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{assessment.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {assessment.questions.length} insightful questions
                    </p>
                    <Button className="w-full group">
                      Start Assessment
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {assessments.map((assessment) => (
                <Card key={assessment.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedAssessment(assessment)}>
                  <CardHeader>
                    <Badge variant="outline" className="w-fit mb-2">AI Generated</Badge>
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

            <Card className="mt-12 bg-gradient-to-r from-primary/10 to-accent/10 border-none">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Want More In-Depth Insights?</h2>
                <p className="text-muted-foreground mb-6">
                  Sign up for access to 20+ advanced assessments, personalized AI coaching, and track your growth journey
                </p>
                <Button size="lg" onClick={() => navigate("/auth")}>
                  Get Started Free
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
    );
  }

  if (showResults) {
    const score = Math.round((Object.keys(answers).length / selectedAssessment.questions.length) * 100);
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 animate-fade-in">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Assessment Complete!</CardTitle>
              <CardDescription>{selectedAssessment.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  {score}%
                </div>
                <p className="text-muted-foreground">Completion Score</p>
              </div>
              
              <div className="bg-muted p-6 rounded-lg space-y-4">
                <h3 className="font-semibold text-center">Unlock Your Full Potential</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-2" />
                    Get detailed analysis and personalized insights
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-2" />
                    Track your progress over time
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-2" />
                    Access 20+ advanced assessments
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-2" />
                    AI-powered coaching and recommendations
                  </li>
                </ul>
                <Button onClick={() => navigate("/auth")} className="w-full" size="lg">
                  Create Free Account
                </Button>
              </div>

              <Button onClick={resetAssessment} variant="outline" className="w-full">
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
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={resetAssessment}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assessments
              </Button>
              <span className="text-sm text-muted-foreground font-medium">
                Question {currentQuestion + 1} of {selectedAssessment.questions.length}
              </span>
            </div>
            <Progress value={progress} className="mb-4 h-2" />
            <CardTitle className="text-xl">{selectedAssessment.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-6">{question.text}</h3>
              <RadioGroup value={answers[currentQuestion] || ""} onValueChange={handleAnswerChange}>
                {question.options.map((option: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-3 p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                    <RadioGroupItem value={option} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer font-medium">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button onClick={handleNext} size="lg">
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
