import { useState } from "react";
import { Button } from "@/components/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Textarea } from "@/components/shared/ui/textarea";
import { Label } from "@/components/shared/ui/label";
import { Badge } from "@/components/shared/ui/badge";
import { Loader2, Brain, Sparkles, CheckCircle } from "lucide-react";
import { useAIResponse } from "@/hooks/features/ai/useAIProvider";

interface AssessmentResult {
  user_name: string;
  assessment_type: string;
  assessment_scores: Record<string, number>;
  key_insights: string;
  responses: string[];
}

interface AIAssessmentAnalyzerProps {
  assessmentResult: AssessmentResult;
  onAnalysisComplete?: (analysis: string) => void;
}

export default function AIAssessmentAnalyzer({ 
  assessmentResult, 
  onAnalysisComplete 
}: AIAssessmentAnalyzerProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  
  const { 
    response, 
    loading, 
    error, 
    generateResponse, 
    clearResponse 
  } = useAIResponse("assessment-completion");

  const handleAnalyze = async () => {
    const variables = {
      user_name: assessmentResult.user_name,
      assessment_type: assessmentResult.assessment_type,
      assessment_scores: JSON.stringify(assessmentResult.assessment_scores),
      key_insights: assessmentResult.key_insights,
      user_responses: assessmentResult.responses.join(", ")
    };

    const userMessage = useCustomPrompt ? customPrompt : "Please analyze this assessment result and provide insights.";
    
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
          <Brain className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>AI Assessment Analysis</CardTitle>
            <CardDescription>
              Get AI-powered insights for {assessmentResult.assessment_type} assessment
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Assessment Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Assessment Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">User:</span>
              <span className="ml-2 font-medium">{assessmentResult.user_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="outline" className="ml-2">
                {assessmentResult.assessment_type}
              </Badge>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Key Insights:</span>
              <p className="mt-1 text-sm">{assessmentResult.key_insights}</p>
            </div>
          </div>
        </div>

        {/* Custom Prompt Option */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="use-custom"
              checked={useCustomPrompt}
              onChange={(e) => setUseCustomPrompt(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="use-custom">Use custom prompt</Label>
          </div>
          
          {useCustomPrompt && (
            <div>
              <Label htmlFor="custom-prompt">Custom Analysis Prompt</Label>
              <Textarea
                id="custom-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter your custom prompt for the AI analysis..."
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
            {loading ? "Analyzing..." : "Generate AI Analysis"}
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
              <Brain className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">AI Analysis</h4>
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
                AI is analyzing the assessment results...
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
