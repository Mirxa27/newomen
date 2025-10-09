import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Tables } from '@/integrations/supabase/types';
import { submitAssessmentResponses } from '@/lib/ai-assessment-utils';

type Assessment = Tables<'assessments_enhanced'>;
interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'text';
  options?: string[];
}

export default function AssessmentTest() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useUserProfile();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadAssessment = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assessments_enhanced')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setAssessment(data);
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions as Question[]);
      }
    } catch (err) {
      console.error('Error loading assessment:', err);
      toast({
        title: 'Error',
        description: 'Failed to load the assessment.',
        variant: 'destructive',
      });
      navigate('/assessments');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    void loadAssessment();
  }, [loadAssessment]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!profile || !assessment) return;
    setSubmitting(true);
    try {
      const result = await submitAssessmentResponses(assessment.id, profile.user_id, answers);
      if (result.success) {
        toast({
          title: 'Assessment Submitted!',
          description: 'Your results are being analyzed.',
        });
        navigate(`/assessments/results/${result.result?.attempt_id}`);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error submitting assessment:', err);
      toast({
        title: 'Submission Failed',
        description: err instanceof Error ? err.message : 'An unknown error occurred.',
        variant: 'destructive',
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

  if (!assessment || questions.length === 0) {
    return <div>Assessment not found or has no questions.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{assessment.title}</CardTitle>
            <CardDescription>{assessment.description}</CardDescription>
            <div className="pt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <h3 className="font-semibold text-lg">{currentQuestion.text}</h3>
              {currentQuestion.type === 'multiple-choice' && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                >
                  {currentQuestion.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${currentQuestion.id}-${index}`} />
                      <Label htmlFor={`${currentQuestion.id}-${index}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              {currentQuestion.type === 'text' && (
                <Textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Your answer..."
                  rows={5}
                />
              )}
            </div>
          </CardContent>
        </Card>
        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={currentQuestionIndex === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {currentQuestionIndex < questions.length - 1 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Submit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}