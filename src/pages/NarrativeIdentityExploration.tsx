import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { AIService } from '@/services/ai/aiService';
import { UserMemoryProfiles } from '@/integrations/supabase/tables/user_memory_profiles';
import { Json, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

interface NarrativeAnalysis {
  themes: string[];
  patterns: string[];
  coreBeliefs: string[];
  growthOpportunities: string[];
}

export default function NarrativeIdentityExploration() {
  const { profile, loading: profileLoading } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [narrativeInput, setNarrativeInput] = useState('');
  const [analysis, setAnalysis] = useState<NarrativeAnalysis | null>(null);
  const [existingData, setExistingData] = useState<UserMemoryProfiles['Row'] | null>(null);

  const aiService = AIService.getInstance();

  const loadNarrativeData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_memory_profiles')
        .select('*')
        .eq('user_id', profile.user_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found, which is fine

      setExistingData(data);

      if (data?.narrative_identity_data) {
        let parsedData: { answers?: Record<number, string>; analysis?: NarrativeAnalysis | string; completed_at?: string } | null = null;
        if (typeof data.narrative_identity_data === 'string') {
          try {
            parsedData = JSON.parse(data.narrative_identity_data as string);
          } catch (e) {
            console.error("Error parsing narrative_identity_data string:", e);
          }
        } else if (typeof data.narrative_identity_data === 'object' && data.narrative_identity_data !== null) {
          parsedData = data.narrative_identity_data as { answers?: Record<number, string>; analysis?: NarrativeAnalysis | string; completed_at?: string };
        }

        if (parsedData?.analysis && typeof parsedData.analysis !== 'string') {
          setAnalysis(parsedData.analysis);
        }
      }
    } catch (e) {
      console.error('Error loading narrative data:', e);
      setError(e instanceof Error ? e.message : 'Failed to load narrative data.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (!profileLoading) {
      void loadNarrativeData();
    }
  }, [profileLoading, loadNarrativeData]);

  const generateAnalysis = async () => {
    if (!profile || !narrativeInput.trim()) {
      toast.error('Please enter your narrative before generating an analysis.');
      return;
    }
    setSubmitting(true);
    try {
      const aiResponse = await aiService.callAIProvider(
        aiService.getDefaultConfiguration()!, // Assuming default config is always available
        [
          {
            role: 'system',
            content: `You are an expert AI in narrative psychology. Analyze the user's personal narrative to identify recurring themes, patterns, core beliefs, and potential growth opportunities. Provide a structured JSON output.`,
          },
          {
            role: 'user',
            content: `Here is my personal narrative: "${narrativeInput}". Please provide an analysis in the following JSON format:
            {
              "themes": ["list of themes"],
              "patterns": ["list of recurring patterns"],
              "coreBeliefs": ["list of core beliefs"],
              "growthOpportunities": ["list of growth opportunities"]
            }`,
          },
        ],
        { response_format: 'json_object' }
      );

      if (aiResponse.error) {
        throw new Error(aiResponse.error);
      }

      const parsedAnalysis = aiResponse.json as NarrativeAnalysis;
      setAnalysis(parsedAnalysis);
      toast.success('Narrative analysis generated!');

      // Save to Supabase
      const narrativeDataToSave = {
        answers: { narrative: narrativeInput },
        analysis: parsedAnalysis,
        completed_at: new Date().toISOString(),
      };

      if (existingData) {
        await supabase
          .from('user_memory_profiles')
          .update({ narrative_identity_data: narrativeDataToSave as Json } as TablesUpdate<'user_memory_profiles'>)
          .eq('id', existingData.id);
      } else {
        await supabase.from('user_memory_profiles').upsert({
          user_id: profile.user_id,
          narrative_identity_data: narrativeDataToSave as Json,
        } as TablesInsert<'user_memory_profiles'>);
      }
    } catch (e) {
      console.error('Error generating analysis:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to generate analysis.');
    } finally {
      setSubmitting(false);
    }
  };

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive text-center mt-8">{error}</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-4xl font-bold gradient-text">Narrative Identity Exploration</h1>
            <CardDescription>
              Explore your personal story and uncover deeper insights with AI-powered analysis.
            </CardDescription>
          </div>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Your Personal Narrative</CardTitle>
            <CardDescription>
              Write about your life experiences, key moments, challenges, and aspirations. The more detail, the better the analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={narrativeInput}
              onChange={(e) => setNarrativeInput(e.target.value)}
              placeholder="Start writing your story here..."
              rows={10}
              className="glass"
            />
            <Button onClick={generateAnalysis} disabled={submitting} className="clay-button">
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate AI Analysis
            </Button>
          </CardContent>
        </Card>

        {analysis && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>AI-Powered Narrative Analysis</CardTitle>
              <CardDescription>Insights into your story.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Themes</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {analysis.themes.map((theme, index) => (
                    <li key={index}>{theme}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Patterns</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {analysis.patterns.map((pattern, index) => (
                    <li key={index}>{pattern}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Core Beliefs</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {analysis.coreBeliefs.map((belief, index) => (
                    <li key={index}>{belief}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Growth Opportunities</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {analysis.growthOpportunities.map((opportunity, index) => (
                    <li key={index}>{opportunity}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}