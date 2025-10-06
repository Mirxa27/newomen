import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  CheckCircle, 
  Clock, 
  Loader2, 
  ArrowRight, 
  ArrowLeft,
  Send,
  TestTube
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processAssessmentWithAI, createAssessmentAttempt, submitAssessmentResponses } from "@/lib/ai-assessment-utils";

interface TestAssessment {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty_level: string;
  time_limit_minutes: number;
  questions: Array<{
    id: string;
    type: 'multiple_choice' | 'text' | 'rating' | 'boolean';
    question: string;
    options?: string[];
    required: boolean;
  }>;
  ai_config_id?: string;
}

export default function AssessmentTest() {
  const [assessment, setAssessment] = useState<TestAssessment | null>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const { toast } = useToast();

  // Create a test assessment
  const createTestAssessment = async () => {
    setLoading(true);
    try {
      const testAssessment: TestAssessment = {
        id: 'test-assessment-1',
        title: 'AI-Powered Personality Test',
        description: 'A comprehensive personality assessment with AI analysis',
        type: 'assessment',
        difficulty_level: 'medium',
        time_limit_minutes: 10,
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice',
            question: 'How do you typically handle stress?',
            options: ['I avoid stressful situations', 'I face challenges head-on', 'I seek help from others', 'I take time to think through problems'],
            required: true
          },
          {
            id: 'q2',
            type: 'text',
            question: 'Describe a time when you had to work with a difficult team member. How did you handle it?',
            required: true
          },
          {
            id: 'q3',
            type: 'rating',
            question: 'Rate your communication skills (1-5)',
            options: ['1', '2', '3', '4', '5'],
            required: true
          },
          {
            id: 'q4',
            type: 'boolean',
            question: 'Do you prefer working in teams or individually?',
            required: true
          }
        ],
        ai_config_id: 'test-ai-config'
      };

      setAssessment(testAssessment);
      setTimeRemaining(testAssessment.time_limit_minutes * 60);
      
      // Simulate creating an attempt
      const mockAttempt = {
        id: 'test-attempt-1',
        assessment_id: testAssessment.id,
        user_id: 'test-user',
        attempt_number: 1,
        started_at: new Date().toISOString(),
        status: 'in_progress',
        raw_responses: {}
      };
      setAttempt(mockAttempt);

      toast({
        title: "Test Assessment Created",
        description: "You can now test the AI assessment system",
      });
    } catch (error) {
      console.error("Error creating test assessment:", error);
      toast({
        title: "Error",
        description: "Failed to create test assessment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const nextQuestion = () => {
    if (assessment && currentQuestion < assessment.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const submitTestAssessment = async () => {
    if (!assessment || !attempt) return;

    setSubmitting(true);
    try {
      // Simulate AI processing
      setAiProcessing(true);
      
      // Simulate AI analysis
      setTimeout(() => {
        const mockAIResult = {
          score: Math.floor(Math.random() * 40) + 60, // 60-100
          feedback: "Based on your responses, you demonstrate strong emotional intelligence and effective communication skills. Your approach to problem-solving shows both analytical thinking and empathy.",
          explanation: "Your answers indicate a balanced personality with strengths in interpersonal relationships and stress management. You show good self-awareness and adaptability.",
          insights: [
            "High emotional intelligence",
            "Strong communication skills",
            "Good problem-solving approach",
            "Effective stress management"
          ],
          recommendations: [
            "Continue developing your leadership skills",
            "Practice active listening in conversations",
            "Consider mentoring others to share your insights"
          ],
          strengths: [
            "Emotional awareness",
            "Communication effectiveness",
            "Team collaboration",
            "Adaptability"
          ],
          areas_for_improvement: [
            "Time management under pressure",
            "Delegation skills",
            "Conflict resolution techniques"
          ]
        };

        setAiResults(mockAIResult);
        setAiProcessing(false);
        setSubmitting(false);

        toast({
          title: "Assessment Complete!",
          description: "AI analysis has been generated for your responses.",
        });
      }, 3000);

    } catch (error) {
      console.error("Error submitting assessment:", error);
      setAiProcessing(false);
      setSubmitting(false);
      toast({
        title: "Error",
        description: "Failed to submit assessment",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0 || !attempt) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          submitTestAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, attempt]);

  const currentQuestionData = assessment?.questions[currentQuestion];
  const isLastQuestion = assessment ? currentQuestion === assessment.questions.length - 1 : false;
  const isFirstQuestion = currentQuestion === 0;
  const progress = assessment ? ((currentQuestion + 1) / assessment.questions.length) * 100 : 0;

  if (!assessment) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <TestTube className="w-8 h-8 text-primary" />
                AI Assessment System Test
              </CardTitle>
              <CardDescription>
                Test the AI-powered assessment system with a sample assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Test Features</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Multiple question types (multiple choice, text, rating, boolean)</li>
                  <li>Real-time timer with auto-submission</li>
                  <li>AI-powered analysis and feedback</li>
                  <li>Comprehensive scoring and insights</li>
                  <li>Personalized recommendations</li>
                </ul>
              </div>

              <div className="flex justify-center">
                <Button onClick={createTestAssessment} disabled={loading} size="lg">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Test Assessment...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      Start Test Assessment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (aiResults) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
                Test Assessment Complete!
              </CardTitle>
              <CardDescription>
                AI analysis results for your test assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-6 bg-primary/5 rounded-lg">
                <div className="text-4xl font-bold text-primary mb-2">{aiResults.score}%</div>
                <div className="text-lg text-muted-foreground">Overall Score</div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">AI Feedback</h3>
                  <p className="text-muted-foreground">{aiResults.feedback}</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Explanation</h3>
                  <p className="text-muted-foreground">{aiResults.explanation}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Your Strengths</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {aiResults.strengths.map((strength: string, index: number) => (
                        <li key={index} className="text-muted-foreground">{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Areas for Improvement</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {aiResults.areas_for_improvement.map((area: string, index: number) => (
                        <li key={index} className="text-muted-foreground">{area}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Recommendations</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {aiResults.recommendations.map((recommendation: string, index: number) => (
                      <li key={index} className="text-muted-foreground">{recommendation}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button onClick={() => window.location.reload()} variant="outline">
                  <TestTube className="w-4 h-4 mr-2" />
                  Run Another Test
                </Button>
                <Button onClick={() => window.location.href = '/dashboard'}>
                  Go to Dashboard
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
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">{assessment.title}</h1>
              <p className="text-muted-foreground">{assessment.description}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
              </div>
              <Badge variant="outline">Test Mode</Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>Question {currentQuestion + 1} of {assessment.questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Question */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQuestionData?.question}
            </CardTitle>
            {currentQuestionData?.required && (
              <Badge variant="destructive">Required</Badge>
            )}
          </CardHeader>
          <CardContent>
            {currentQuestionData?.type === 'multiple_choice' && (
              <RadioGroup
                value={responses[currentQuestionData.id] || ''}
                onValueChange={(value) => handleResponseChange(currentQuestionData.id, value)}
              >
                {currentQuestionData.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${currentQuestionData.id}-${index}`} />
                    <Label htmlFor={`${currentQuestionData.id}-${index}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestionData?.type === 'text' && (
              <Textarea
                value={responses[currentQuestionData.id] || ''}
                onChange={(e) => handleResponseChange(currentQuestionData.id, e.target.value)}
                placeholder="Enter your response..."
                rows={4}
              />
            )}

            {currentQuestionData?.type === 'rating' && (
              <div className="space-y-2">
                <Label>Rate from 1 to 5:</Label>
                <RadioGroup
                  value={responses[currentQuestionData.id] || ''}
                  onValueChange={(value) => handleResponseChange(currentQuestionData.id, value)}
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <RadioGroupItem value={rating.toString()} id={`${currentQuestionData.id}-${rating}`} />
                      <Label htmlFor={`${currentQuestionData.id}-${rating}`}>{rating}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {currentQuestionData?.type === 'boolean' && (
              <RadioGroup
                value={responses[currentQuestionData.id] || ''}
                onValueChange={(value) => handleResponseChange(currentQuestionData.id, value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id={`${currentQuestionData.id}-true`} />
                  <Label htmlFor={`${currentQuestionData.id}-true`}>Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id={`${currentQuestionData.id}-false`} />
                  <Label htmlFor={`${currentQuestionData.id}-false`}>No</Label>
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevQuestion}
            disabled={isFirstQuestion}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {!isLastQuestion ? (
              <Button onClick={nextQuestion}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={submitTestAssessment}
                disabled={submitting || aiProcessing}
                className="bg-primary hover:bg-primary/90"
              >
                {submitting || aiProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {aiProcessing ? 'AI Processing...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Assessment
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* AI Processing Status */}
        {aiProcessing && (
          <Alert className="mt-4">
            <Brain className="h-4 w-4" />
            <AlertDescription>
              AI is analyzing your responses. This may take a few moments...
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
