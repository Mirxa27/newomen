import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, ArrowLeft, Sparkles, BookOpen, Target, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Question {
  id: number;
  category: string;
  question: string;
  prompt: string;
  icon: LucideIcon;
}

const questions: Question[] = [
  {
    id: 1,
    category: "Origin Story",
    question: "What is your earliest memory that shaped who you are today?",
    prompt: "Think about a moment from childhood that still influences you. What happened, and why does it matter?",
    icon: BookOpen
  },
  {
    id: 2,
    category: "Turning Points",
    question: "Describe a moment when your life direction changed significantly.",
    prompt: "This could be a decision you made, an event that happened, or a realization you had. What shifted?",
    icon: Target
  },
  {
    id: 3,
    category: "Core Values",
    question: "What principle or belief do you hold that you would never compromise?",
    prompt: "Think about what matters most to you. Why is this value so important?",
    icon: Heart
  },
  {
    id: 4,
    category: "Overcoming Adversity",
    question: "Tell me about a time you overcame something that seemed impossible.",
    prompt: "What was the challenge? How did you get through it? What did you learn?",
    icon: Sparkles
  },
  {
    id: 5,
    category: "Relationships",
    question: "Who has had the most significant impact on your life story, and how?",
    prompt: "This could be someone you know personally, or even someone you've never met. How did they influence you?",
    icon: Heart
  },
  {
    id: 6,
    category: "Identity Formation",
    question: "When did you first realize who you truly are (or want to be)?",
    prompt: "Describe the moment of self-discovery or the journey toward understanding yourself.",
    icon: Sparkles
  },
  {
    id: 7,
    category: "Limiting Beliefs",
    question: "What story do you tell yourself that might be holding you back?",
    prompt: "We all have narratives that limit us. What's one you've noticed in your own thinking?",
    icon: BookOpen
  },
  {
    id: 8,
    category: "Aspirational Self",
    question: "If you could write the next chapter of your life, what would it look like?",
    prompt: "Dream big. What would be happening? Who would you be? How would you feel?",
    icon: Target
  },
  {
    id: 9,
    category: "Resilience Patterns",
    question: "Looking back, how have you consistently handled difficult situations?",
    prompt: "What patterns do you notice in the way you cope, adapt, or overcome challenges?",
    icon: Sparkles
  },
  {
    id: 10,
    category: "Legacy & Meaning",
    question: "What do you want your life story to mean? What impact do you want to leave?",
    prompt: "Think about how you want to be remembered and what matters most to you in the long run.",
    icon: Heart
  }
];

interface TransformationStep {
  title: string;
  description: string;
  actions?: string[];
}

interface NarrativeAnalysis {
  coreThemes: string[];
  limitingBeliefs: string[];
  strengthPatterns: string[];
  transformationOpportunities: string[];
  personalityArchetype: string;
  narrativeCoherence: number;
  transformationRoadmap: TransformationStep[];
}

export default function NarrativeIdentityExploration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<NarrativeAnalysis | null>(null);
  const [hasExistingExploration, setHasExistingExploration] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void checkExistingExploration();
  }, [checkExistingExploration]);

  useEffect(() => {
    // Load saved answer for current question
    setCurrentAnswer(answers[currentQuestionIndex + 1] || '');
  }, [currentQuestionIndex, answers]);

  const checkExistingExploration = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: existingData } = await supabase
        .from('user_memory_profiles')
        .select('narrative_identity_data')
        .eq('user_id', user.id)
        .single();

      if (existingData?.narrative_identity_data) {
        setHasExistingExploration(true);
      }
    } catch (error) {
      console.error('Error checking existing exploration:', error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const handleNext = () => {
    if (currentAnswer.trim().length < 50) {
      toast({
        title: "Please provide more detail",
        description: "Your answer should be at least 50 characters to help us understand your story.",
        variant: "destructive"
      });
      return;
    }

    // Save current answer
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex + 1]: currentAnswer
    }));

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions answered, proceed to analysis
      analyzeNarrative({
        ...answers,
        [currentQuestionIndex + 1]: currentAnswer
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const analyzeNarrative = async (allAnswers: Record<number, string>) => {
    setIsAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Prepare narrative data for AI analysis
      const narrativeText = questions.map((q, idx) => 
        `${q.category}: ${q.question}\nAnswer: ${allAnswers[idx + 1]}`
      ).join('\n\n');

      // Call AI analysis function
      const { data, error } = await supabase.functions.invoke('ai-content-builder', {
        body: {
          topic: 'narrative-identity-analysis',
          context: narrativeText,
          analysisType: 'comprehensive'
        }
      });

      if (error) throw error;

      // Parse AI response
      const coherence = typeof data?.narrativeCoherence === 'number' ? data.narrativeCoherence : 0;

      const analysis: NarrativeAnalysis = {
        coreThemes: Array.isArray(data?.coreThemes) ? data.coreThemes.map((item: unknown) => String(item)) : [],
        limitingBeliefs: Array.isArray(data?.limitingBeliefs) ? data.limitingBeliefs.map((item: unknown) => String(item)) : [],
        strengthPatterns: Array.isArray(data?.strengthPatterns) ? data.strengthPatterns.map((item: unknown) => String(item)) : [],
        transformationOpportunities: Array.isArray(data?.transformationOpportunities)
          ? data.transformationOpportunities.map((item: unknown) => String(item))
          : [],
        personalityArchetype:
          typeof data?.personalityArchetype === 'string' ? data.personalityArchetype : 'Explorer',
        narrativeCoherence: Math.min(100, Math.max(0, coherence)),
        transformationRoadmap: Array.isArray(data?.transformationRoadmap)
          ? data.transformationRoadmap
              .map((step: unknown) => {
                if (
                  step &&
                  typeof step === 'object' &&
                  'title' in step &&
                  'description' in step
                ) {
                  const stepRecord = step as Record<string, unknown>;
                  const rawActions = stepRecord.actions;
                  const actions = Array.isArray(rawActions)
                    ? rawActions.map((action) => String(action))
                    : undefined;

                  return {
                    title: String(stepRecord.title ?? ''),
                    description: String(stepRecord.description ?? ''),
                    actions,
                  };
                }
                return null;
              })
              .filter((step): step is TransformationStep => Boolean(step))
          : [],
      };

      // Save to database
      const { error: saveError } = await supabase
        .from('user_memory_profiles')
        .upsert({
          user_id: user.id,
          narrative_identity_data: {
            answers: allAnswers,
            analysis: analysis,
            completed_at: new Date().toISOString()
          }
        });

      if (saveError) throw saveError;

      setAnalysisResult(analysis);

      toast({
        title: "Analysis Complete!",
        description: "Your narrative identity has been analyzed. Discover your transformation roadmap below.",
      });

    } catch (error) {
      console.error('Error analyzing narrative:', error);
      toast({
        title: "Analysis Error",
        description: "We couldn't complete the analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (analysisResult) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold gradient-text">Your Narrative Identity</h1>
            <p className="text-muted-foreground">
              Based on your answers, we've identified key patterns and opportunities for growth
            </p>
          </div>

          {/* Personality Archetype */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Your Archetype: {analysisResult.personalityArchetype}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Narrative Coherence:</span>
                <Progress value={analysisResult.narrativeCoherence} className="flex-1" />
                <span className="text-sm font-medium">{analysisResult.narrativeCoherence}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Core Themes */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Core Themes in Your Story
              </CardTitle>
              <CardDescription>
                These recurring patterns shape your identity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysisResult.coreThemes.map((theme: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="clay-button">
                    {theme}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strength Patterns */}
          <Card className="glass-card border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-green-500" />
                Your Strength Patterns
              </CardTitle>
              <CardDescription>
                Capabilities you've demonstrated across your life story
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysisResult.strengthPatterns.map((strength: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Limiting Beliefs */}
          <Card className="glass-card border-yellow-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-yellow-500" />
                Limiting Beliefs to Challenge
              </CardTitle>
              <CardDescription>
                Stories you tell yourself that may be holding you back
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysisResult.limitingBeliefs.map((belief: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">⚠</span>
                    <span>{belief}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Transformation Roadmap */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Your Transformation Roadmap
              </CardTitle>
              <CardDescription>
                Personalized steps based on your narrative identity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisResult.transformationRoadmap.map((step, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </div>
                      <h4 className="font-semibold">{step.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground ml-10">{step.description}</p>
                    <div className="ml-10 flex flex-wrap gap-2">
                      {step.actions?.map((action, actionIdx) => (
                        <Badge key={actionIdx} variant="outline" className="text-xs">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button 
              onClick={() => navigate('/dashboard')} 
              variant="outline" 
              className="flex-1 glass-card"
            >
              Return to Dashboard
            </Button>
            <Button 
              onClick={() => navigate('/chat')} 
              className="flex-1 clay-button bg-gradient-to-r from-primary to-accent"
            >
              Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const Icon = currentQuestion.icon;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-text">Narrative Identity Exploration</h1>
          <p className="text-muted-foreground">
            Discover the stories that shape who you are
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Question Card */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="secondary">{currentQuestion.category}</Badge>
            </div>
            <CardTitle className="text-2xl">{currentQuestion.question}</CardTitle>
            <CardDescription className="text-base pt-2">
              {currentQuestion.prompt}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Share your story here... Take your time and be as detailed as you'd like."
              className="min-h-[200px] glass-card resize-none"
            />
            <div className="flex items-center justify-between text-sm">
              <span className={currentAnswer.length < 50 ? "text-yellow-500" : "text-green-500"}>
                {currentAnswer.length} characters
                {currentAnswer.length < 50 && ` (minimum 50)`}
              </span>
            </div>

            <Separator />

            {/* Navigation */}
            <div className="flex gap-4">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="glass-card"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentAnswer.trim().length < 50 || isAnalyzing}
                className="flex-1 clay-button bg-gradient-to-r from-primary to-accent"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : currentQuestionIndex === questions.length - 1 ? (
                  <>
                    Complete & Analyze
                    <Sparkles className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next Question
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx <= currentQuestionIndex
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
