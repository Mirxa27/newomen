import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCouplesChallenge } from '@/hooks/useCouplesChallenge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Json, TablesUpdate } from '@/integrations/supabase/types';

export default function CouplesChallenge() {
  const { profile } = useUserProfile();
  const { activeChallenges, loading, acceptChallenge, declineChallenge } = useCouplesChallenge();
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const submitResponses = async () => {
    if (!selectedChallenge || !profile) return;

    const isInitiator = selectedChallenge.initiator_id === profile.user_id;
    const userType = isInitiator ? 'initiator_response' : 'partner_response';

    const newResponses = { ...selectedChallenge.responses };
    Object.keys(responses).forEach(questionId => {
      if (!newResponses[questionId]) {
        newResponses[questionId] = {};
      }
      newResponses[questionId][userType] = responses[questionId];
    });

    try {
      const { error } = await supabase
        .from("couples_challenges")
        .update({ responses: newResponses as Json } as TablesUpdate<'couples_challenges'>)
        .eq("id", selectedChallenge.id);

      if (error) throw error;
      toast.success("Responses submitted!");

      // Check if both have responded to all questions
      const allAnswered = selectedChallenge.question_set.every((q: any) =>
        newResponses[q.id]?.initiator_response && newResponses[q.id]?.partner_response
      );

      if (allAnswered) {
        await supabase
          .from("couples_challenges")
          .update({ status: 'completed', updated_at: new Date().toISOString() } as TablesUpdate<'couples_challenges'>)
          .eq("id", selectedChallenge.id);
        toast.info("Challenge complete! View your insights soon.");
      }

      // Refetch or update local state
      setSelectedChallenge((prev: any) => ({ ...prev, responses: newResponses }));
      setResponses({});

    } catch (e) {
      console.error("Error submitting responses:", e);
      toast.error("Failed to submit responses.");
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Couples Challenges</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Active Challenges</CardTitle>
            </CardHeader>
            <CardContent>
              {activeChallenges.map(challenge => (
                <div key={challenge.id} className="p-2 border-b">
                  <p>Challenge with {challenge.initiator_id === profile?.user_id ? 'your partner' : 'your partner'}</p>
                  <p className="text-sm text-muted-foreground">Status: {challenge.status}</p>
                  {challenge.status === 'pending' && challenge.partner_id === profile?.user_id && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => acceptChallenge(challenge.id)}>Accept</Button>
                      <Button size="sm" variant="destructive" onClick={() => declineChallenge(challenge.id)}>Decline</Button>
                    </div>
                  )}
                  {challenge.status === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => setSelectedChallenge(challenge)}>View</Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          {selectedChallenge ? (
            <Card>
              <CardHeader>
                <CardTitle>Challenge Questions</CardTitle>
                <CardDescription>Answer the questions below.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(selectedChallenge.question_set as any[]).map((q: any) => (
                  <div key={q.id}>
                    <label className="font-semibold">{q.text}</label>
                    <Textarea
                      className="mt-2"
                      value={responses[q.id] || ''}
                      onChange={(e) => handleResponseChange(q.id, e.target.value)}
                    />
                  </div>
                ))}
                <Button onClick={submitResponses}>Submit Responses</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex justify-center items-center h-full bg-muted rounded-lg">
              <p>Select a challenge to view questions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}