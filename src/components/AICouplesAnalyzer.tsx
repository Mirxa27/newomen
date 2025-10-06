import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, Sparkles, CheckCircle } from "lucide-react";
import { useAIResponse } from "@/hooks/useAIProvider";

interface CouplesChallengeData {
  partner_name: string;
  challenge_question: string;
  challenge_response: string;
  other_partner_response: string;
  relationship_duration?: string;
  previous_challenges?: string[];
}

interface AICouplesAnalyzerProps {
  challengeData: CouplesChallengeData;
  onAnalysisComplete?: (analysis: string) => void;
}

export default function AICouplesAnalyzer({ 
  challengeData, 
  onAnalysisComplete 
}: AICouplesAnalyzerProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  
  const { 
    response, 
    loading, 
    error, 
    generateResponse, 
    clearResponse 
  } = useAIResponse("couples-challenge");

  const handleAnalyze = async () => {
    const variables = {
      partner_name: challengeData.partner_name,
      challenge_question: challengeData.challenge_question,
      challenge_response: challengeData.challenge_response,
      other_partner_response: challengeData.other_partner_response,
      relationship_duration: challengeData.relationship_duration || "Not specified",
      previous_challenges: challengeData.previous_challenges?.join(", ") || "None"
    };

    const userMessage = useCustomPrompt ? customPrompt : "Please analyze this couples challenge and provide relationship insights.";
    
    await generateResponse(userMessage, variables);
  };

  const handleUseResponse = () => {
    if (response && onAnalysisComplete) {
      onAnalysisComplete(response);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>AI Couples Challenge Analysis</CardTitle>
            <CardDescription>
              Get AI-powered relationship insights for your couples challenge
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Challenge Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">Challenge Details</h4>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Partner:</span>
              <span className="ml-2 font-medium">{challengeData.partner_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Question:</span>
              <p className="mt-1 p-2 bg-background rounded border">
                {challengeData.challenge_question}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground">Your Response:</span>
                <p className="mt-1 p-2 bg-background rounded border text-sm">
                  {challengeData.challenge_response}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Partner's Response:</span>
                <p className="mt-1 p-2 bg-background rounded border text-sm">
                  {challengeData.other_partner_response}
                </p>
              </div>
            </div>
            {challengeData.relationship_duration && (
              <div>
                <span className="text-muted-foreground">Relationship Duration:</span>
                <Badge variant="outline" className="ml-2">
                  {challengeData.relationship_duration}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Custom Prompt Option */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="use-custom-couples"
              checked={useCustomPrompt}
              onChange={(e) => setUseCustomPrompt(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="use-custom-couples">Use custom prompt</Label>
          </div>
          
          {useCustomPrompt && (
            <div>
              <Label htmlFor="custom-prompt-couples">Custom Analysis Prompt</Label>
              <Textarea
                id="custom-prompt-couples"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter your custom prompt for the AI relationship analysis..."
                rows={3}
                className="mt-1"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleAnalyze} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {loading ? "Analyzing..." : "Generate Relationship Analysis"}
          </Button>
          
          {response && (
            <Button 
              onClick={handleUseResponse}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Use This Analysis
            </Button>
          )}
          
          {(response || error) && (
            <Button 
              onClick={clearResponse}
              variant="ghost"
              size="sm"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* AI Response Display */}
        {response && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">AI Relationship Analysis</h4>
            </div>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {response}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-muted/50 border border-muted rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                AI is analyzing your relationship dynamics...
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
