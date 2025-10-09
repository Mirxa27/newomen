import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Json, Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type UserMemoryProfile = Tables<'user_memory_profiles'>;

const questions = [
  "Describe a peak experience in your life, a high point where you felt most alive and like your true self.",
  "Describe a nadir experience, a low point in your life, and what you learned from it.",
  "What is a significant turning point in your life story? How did it change you?",
  "Who has been the most influential positive figure in your life, and what impact did they have?",
  "What is a central challenge or conflict you have faced in your life, and how are you dealing with it?",
  "What do you hope for in the future? Describe a scene that represents your desired future.",
  "What is your earliest memory, and what does it say about you?",
  "How have your values changed over time? What do you stand for now?",
];

interface NarrativeAnalysis {
  themes: string[];
  emotional_arc: string;
  identity_statements: string[];
  growth_narrative: string;
}

export default function NarrativeIdentityExploration() {
  const { profile, loading: profileLoading } = useUserProfile();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [analysis, setAnalysis] = useState<NarrativeAnalysis | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_memory_profiles')
        .select('*')
        .eq('user_id', profile.user_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const profileData = data as UserMemoryProfile;
        if (profileData.narrative_identity_data) {
          let parsedData: { answers?: Record<number, string>; analysis?: NarrativeAnalysis | string; completed_at?: string } | null = null;
          if (typeof profileData.narrative_identity_data === 'string') {
            try {
              parsedData = JSON.parse(profileData.narrative_identity_data as string);
            } catch (e) { console.error("Failed to parse narrative data", e); }
          } else if (typeof profileData.narrative_identity_data === 'object' && profileData.narrative_identity_data !== null) {
            parsedData = profileData.narrative_identity_data as any;
          }

          if (parsedData) {
            setAnswers(parsedData.answers || {});
            if (parsedData.analysis && typeof parsedData.analysis === 'object') {
              setAnalysis(parsedData.analysis);
            }
            if (parsedData.completed_at) {
              setIsCompleted(true);
            }
          }
        }
      }
    } catch (e) {
      toast.error("Failed to load your narrative data.");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      void loadData();
    }
  }, [profile, loadData]);

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers(prev => ({ ...prev, [index]: value }));
  };

  const handleSubmit = async () => {
    if (!profile) return;
    setSubmitting(true);
    try {
      // In a real app, this would call an AI service to generate the analysis
      const mockAnalysis: NarrativeAnalysis = {
        themes: ["Resilience", "Growth through adversity", "Importance of connection"],
        emotional_arc: "From challenge to empowerment",
        identity_statements: ["I am a survivor.", "I value deep relationships."],
        growth_narrative: "The user demonstrates a strong capacity for learning from difficult experiences and turning them into strengths."
      };
      setAnalysis(mockAnalysis);
      setIsCompleted(true);

      const narrativeDataToSave = {
        answers,
        analysis: mockAnalysis,
        completed_at: new Date().toISOString(),
      };

      const { data: existingData, error: fetchError } = await supabase
        .from('user_memory_profiles')
        .select('id')
        .eq('user_id', profile.user_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (existingData) {
        await supabase
          .from('user_memory_profiles')
          .update({ narrative_identity_data: narrativeDataToSave as unknown as Json } as TablesUpdate<'user_memory_profiles'>)
          .eq('id', existingData.id);
      } else {
        await supabase.from('user_memory_profiles').insert({
          user_id: profile.user_id,
          narrative_identity_data: narrativeDataToSave as unknown as Json,
        } as TablesInsert<'user_memory_profiles'>);
      }

      toast.success("Your narrative has been saved and analyzed!");
    } catch (e) {
      toast.error("Failed to save your narrative.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || profileLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Narrative Identity Exploration</CardTitle>
          <CardDescription>Construct your life story to understand who you are and who you are becoming.</CardDescription>
        </CardHeader>
        <CardContent>
          {isCompleted && analysis ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Your Narrative Analysis</h2>
              <div>
                <h3 className="font-bold">Key Themes</h3>
                <ul className="list-disc list-inside">{analysis.themes.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>
              <div>
                <h3 className="font-bold">Emotional Arc</h3>
                <p>{analysis.emotional_arc}</p>
              </div>
              <div>
                <h3 className="font-bold">Core Identity Statements</h3>
                <ul className="list-disc list-inside">{analysis.identity_statements.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
              <div>
                <h3 className="font-bold">Growth Narrative</h3>
                <p>{analysis.growth_narrative}</p>
              </div>
              <Button onClick={() => setIsCompleted(false)}>Edit Answers</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q, i) => (
                <div key={i}>
                  <label className="font-semibold text-lg">{i + 1}. {q}</label>
                  <Textarea
                    className="mt-2"
                    rows={5}
                    value={answers[i] || ''}
                    onChange={(e) => handleAnswerChange(i, e.target.value)}
                  />
                </div>
              ))}
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit for Analysis
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}