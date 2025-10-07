import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCouplesChallenge, createNewChallenge } from '@/hooks/useCouplesChallenge';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Copy, Check, Heart, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function ChallengeInterface() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useUserProfile();
  const { challenge, loading, error, submitResponse } = useCouplesChallenge(id);
  const [currentResponse, setCurrentResponse] = useState('');

  if (loading) return <div className="text-center p-10"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
  if (!challenge || !profile) return <div className="text-center p-10">Challenge not found.</div>;

  const questions = (challenge.question_set as { questions?: Array<{ id: string; text: string }> })?.questions || [];
  const responses = (challenge.responses as Record<string, { initiator_response?: string; partner_response?: string }>) || {};
  const isInitiator = challenge.initiator_id === profile.id;

  const handleResponseSubmit = (questionId: string) => {
    if (!currentResponse.trim()) {
      toast.warning("Please write a response before submitting.");
      return;
    }
    submitResponse(questionId, currentResponse);
    setCurrentResponse('');
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-center gradient-text">Couple's Challenge</h2>
      {questions.map((q: { id: string; text: string }, index: number) => {
        const questionResponses = responses[q.id] || {};
        const initiatorResponse = questionResponses.initiator_response;
        const partnerResponse = questionResponses.partner_response;
        const myResponse = isInitiator ? initiatorResponse : partnerResponse;
        const partnerNickname = isInitiator ? "Partner's" : "Initiator's";
        const bothAnswered = initiatorResponse && partnerResponse;

        return (
          <Card key={q.id} className="glass-card">
            <CardHeader>
              <CardTitle>Question {index + 1}</CardTitle>
              <CardDescription className="text-lg pt-2">{q.text}</CardDescription>
            </CardHeader>
            <CardContent>
              {bothAnswered ? (
                <div className="space-y-4">
                  <Alert className="glass">
                    <Heart className="h-4 w-4" />
                    <AlertTitle>Your Answer</AlertTitle>
                    <AlertDescription>{myResponse}</AlertDescription>
                  </Alert>
                  <Alert className="glass">
                    <Heart className="h-4 w-4" />
                    <AlertTitle>{partnerNickname} Answer</AlertTitle>
                    <AlertDescription>{isInitiator ? partnerResponse : initiatorResponse}</AlertDescription>
                  </Alert>
                  {challenge.ai_analysis && (challenge.ai_analysis as unknown as Record<string, string>)[q.id] && (
                     <Alert variant="default" className="border-primary/50 glass">
                        <AlertTitle className="font-semibold text-primary">AI Analysis</AlertTitle>
                        <AlertDescription>
                          {(challenge.ai_analysis as unknown as Record<string, string>)[q.id]}
                        </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : myResponse ? (
                <div className="text-center p-6 glass rounded-lg">
                  <p className="text-lg font-semibold">Your answer is submitted!</p>
                  <p className="text-muted-foreground mt-2">Waiting for your partner to respond...</p>
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mt-4 text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Your thoughtful response..."
                    value={currentResponse}
                    onChange={(e) => setCurrentResponse(e.target.value)}
                    rows={4}
                    className="glass"
                  />
                  <Button onClick={() => handleResponseSubmit(q.id)} className="clay-button">Submit Answer</Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function CouplesChallengePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreateChallenge = async () => {
    const newChallenge = await createNewChallenge();
    if (newChallenge) {
      const link = `${window.location.origin}/couples-challenge/${newChallenge.id}`;
      setInviteLink(link);
      navigate(`/couples-challenge/${newChallenge.id}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (id) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <ChallengeInterface />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-lg w-full glass-card">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold gradient-text">Couple's Challenge</CardTitle>
          <CardDescription>
            Connect with your partner on a deeper level.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {!inviteLink ? (
            <Button onClick={handleCreateChallenge} className="clay-button">Start a New Challenge</Button>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">Share this link with your partner:</p>
              <div className="flex items-center gap-2 p-2 rounded-lg glass">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="bg-transparent w-full outline-none text-primary"
                  aria-label="Couple's Challenge Invite Link"
                />
                <Button size="icon" variant="ghost" onClick={copyToClipboard}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}