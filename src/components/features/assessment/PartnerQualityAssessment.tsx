import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Badge } from "@/components/shared/ui/badge";
import { Textarea } from "@/components/shared/ui/textarea";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { Alert, AlertDescription } from "@/components/shared/ui/alert";
import { Loader2, Heart, Brain, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/shared/ui/use-toast";
import { aiCouplesChallengeService } from "@/services/features/ai/AICouplesChallengeService";
import type { PartnerQualityData, PsychologicalPerspective } from "@/services/features/ai/AICouplesChallengeService";

interface QualityAnalysis {
  userPerspective: PsychologicalPerspective;
  partnerPerspective: PsychologicalPerspective;
  compatibilityAnalysis: string;
  alignmentScore: number;
}

interface PartnerQualityAssessmentProps {
  challengeId: string;
  userId: string;
  partnerName: string;
  isUserInitiator: boolean;
  onComplete: (analysis: QualityAnalysis | null) => void;
}

type AssessmentStage = 'input' | 'analysis' | 'approval' | 'complete';

export default function PartnerQualityAssessment({ 
  challengeId, 
  userId, 
  partnerName, 
  isUserInitiator, 
  onComplete 
}: PartnerQualityAssessmentProps) {
  const { toast } = useToast();
  const [stage, setStage] = useState<AssessmentStage>('input');
  const [loading, setLoading] = useState(false);
  
  // Input states
  const [desiredQualities, setDesiredQualities] = useState<string[]>([]);
  const [newQuality, setNewQuality] = useState("");
  const [relationshipGoals, setRelationshipGoals] = useState("");
  const [communicationStyle, setCommunicationStyle] = useState("");
  const [coreValues, setCoreValues] = useState<string[]>([]);
  const [newValue, setNewValue] = useState("");

  // Analysis states
  const [userPerspective, setUserPerspective] = useState<PsychologicalPerspective | null>(null);
  const [partnerPerspective, setPartnerPerspective] = useState<PsychologicalPerspective | null>(null);
  const [compatibilityAnalysis, setCompatibilityAnalysis] = useState("");
  const [alignmentScore, setAlignmentScore] = useState(0);

  // Approval states
  interface ApprovalQuestion {
    question: string;
    context: string;
    approvalOptions: string[];
    psychologicalRationale: string;
  }
  
  const [approvalQuestion, setApprovalQuestion] = useState<ApprovalQuestion | null>(null);
  const [approvalResponse, setApprovalResponse] = useState("");
  const [showApprovalForm, setShowApprovalForm] = useState(false);

  const addQuality = () => {
    if (newQuality.trim() && !desiredQualities.includes(newQuality.trim())) {
      setDesiredQualities([...desiredQualities, newQuality.trim()]);
      setNewQuality("");
    }
  };

  const removeQuality = (quality: string) => {
    setDesiredQualities(desiredQualities.filter(q => q !== quality));
  };

  const addValue = () => {
    if (newValue.trim() && !coreValues.includes(newValue.trim())) {
      setCoreValues([...coreValues, newValue.trim()]);
      setNewValue("");
    }
  };

  const removeValue = (value: string) => {
    setCoreValues(coreValues.filter(v => v !== value));
  };

  const handleSubmitQualities = async () => {
    if (desiredQualities.length === 0 || !relationshipGoals || !communicationStyle || coreValues.length === 0) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all fields before continuing.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const userQualityData: PartnerQualityData = {
        userId,
        partnerName,
        desiredQualities,
        relationshipGoals,
        communicationStyle,
        values: coreValues
      };

      // Store user qualities in localStorage for now (in a real app, you'd store in database)
      const storageKey = `partner_qualities_${challengeId}_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(userQualityData));

      // Check if partner has submitted their qualities
      const partnerStorageKey = `partner_qualities_${challengeId}_${isUserInitiator ? 'partner' : 'initiator'}`;
      const partnerQualitiesJson = localStorage.getItem(partnerStorageKey);

      if (partnerQualitiesJson) {
        // Both have submitted, analyze together
        const partnerQualities: PartnerQualityData = JSON.parse(partnerQualitiesJson);
        
        const analysis = await aiCouplesChallengeService.analyzePartnerQualities(
          isUserInitiator ? userQualityData : partnerQualities,
          isUserInitiator ? partnerQualities : userQualityData
        );

        setUserPerspective(analysis.userPerspective);
        setPartnerPerspective(analysis.partnerPerspective);
        setCompatibilityAnalysis(analysis.compatibilityAnalysis);
        setAlignmentScore(analysis.alignmentScore);
        
        setStage('analysis');
      } else {
        // Partner hasn't submitted yet
        toast({
          title: "Response Recorded",
          description: "Waiting for your partner to complete their assessment...",
        });
        
        // Show a waiting message
        setStage('approval');
        setShowApprovalForm(false);
      }
    } catch (error) {
      console.error("Error submitting qualities:", error);
      toast({
        title: "Error",
        description: "Failed to process your responses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateApprovalQuestion = async () => {
    if (!userPerspective || !partnerPerspective) return;

    setLoading(true);
    try {
      const userQualityData: PartnerQualityData = {
        userId,
        partnerName,
        desiredQualities,
        relationshipGoals,
        communicationStyle,
        values: coreValues
      };

      const approvalQ = await aiCouplesChallengeService.generateQualityApprovalQuestion(
        userPerspective,
        partnerPerspective,
        userQualityData
      );

      setApprovalQuestion(approvalQ);
      setShowApprovalForm(true);
    } catch (error) {
      console.error("Error generating approval question:", error);
      toast({
        title: "Error",
        description: "Failed to generate approval question.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalResponse = async () => {
    if (!approvalResponse.trim()) {
      toast({
        title: "Response Required",
        description: "Please provide your thoughts on the analysis.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Store approval response
      const approvalData = {
        userId,
        response: approvalResponse,
        timestamp: new Date().toISOString(),
        agreesWithAnalysis: approvalResponse.toLowerCase().includes('agree') || approvalResponse.toLowerCase().includes('accurate')
      };

      const storageKey = `approval_response_${challengeId}_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(approvalData));

      toast({
        title: "Response Recorded",
        description: "Thank you for your feedback on the analysis!",
      });

      // Complete the assessment
      const finalAnalysis = {
        userPerspective,
        partnerPerspective,
        compatibilityAnalysis,
        alignmentScore,
        userApproval: approvalData
      };

      onComplete(finalAnalysis);
      setStage('complete');
    } catch (error) {
      console.error("Error submitting approval response:", error);
      toast({
        title: "Error",
        description: "Failed to submit your response.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAttachmentStyleColor = (style: string) => {
    if (style.includes('Secure')) return 'bg-green-100 text-green-800';
    if (style.includes('Anxious')) return 'bg-yellow-100 text-yellow-800';
    if (style.includes('Avoidant')) return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getLoveLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      'Words of Affirmation': 'bg-pink-100 text-pink-800',
      'Acts of Service': 'bg-blue-100 text-blue-800',
      'Receiving Gifts': 'bg-purple-100 text-purple-800',
      'Quality Time': 'bg-green-100 text-green-800',
      'Physical Touch': 'bg-orange-100 text-orange-800'
    };
    return colors[language] || 'bg-gray-100 text-gray-800';
  };

  if (stage === 'input') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-pink-500" />
            <div>
              <CardTitle>Partner Quality Assessment</CardTitle>
              <CardDescription>
                Help us understand what you value in a partner and relationship
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Desired Qualities */}
          <div className="space-y-3">
            <Label>Desired Qualities in a Partner</Label>
            <div className="flex gap-2">
              <Input
                value={newQuality}
                onChange={(e) => setNewQuality(e.target.value)}
                placeholder="e.g., Kind, Ambitious, Funny"
                onKeyPress={(e) => e.key === 'Enter' && addQuality()}
              />
              <Button onClick={addQuality} size="sm">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {desiredQualities.map((quality) => (
                <Badge key={quality} variant="secondary" className="gap-1">
                  {quality}
                  <button
                    onClick={() => removeQuality(quality)}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Relationship Goals */}
          <div className="space-y-3">
            <Label>Your Relationship Goals</Label>
            <Textarea
              value={relationshipGoals}
              onChange={(e) => setRelationshipGoals(e.target.value)}
              placeholder="What are you looking for in a relationship? (e.g., Long-term commitment, growth, adventure...)"
              rows={3}
            />
          </div>

          {/* Communication Style */}
          <div className="space-y-3">
            <Label>Preferred Communication Style</Label>
            <Textarea
              value={communicationStyle}
              onChange={(e) => setCommunicationStyle(e.target.value)}
              placeholder="How do you prefer to communicate? (e.g., Direct, thoughtful, frequent check-ins...)"
              rows={3}
            />
          </div>

          {/* Core Values */}
          <div className="space-y-3">
            <Label>Core Values</Label>
            <div className="flex gap-2">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="e.g., Honesty, Family, Growth"
                onKeyPress={(e) => e.key === 'Enter' && addValue()}
              />
              <Button onClick={addValue} size="sm">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {coreValues.map((value) => (
                <Badge key={value} variant="secondary" className="gap-1">
                  {value}
                  <button
                    onClick={() => removeValue(value)}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleSubmitQualities} 
            disabled={loading || desiredQualities.length === 0 || !relationshipGoals || !communicationStyle || coreValues.length === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Continue to Analysis'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (stage === 'analysis' && userPerspective && partnerPerspective) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-500" />
            <div>
              <CardTitle>Psychological Analysis</CardTitle>
              <CardDescription>
                AI-generated insights about your relationship compatibility
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Compatibility Score */}
          <div className="text-center p-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
            <h3 className="text-2xl font-bold text-purple-800">Compatibility Score</h3>
            <div className="text-4xl font-bold text-purple-600 mt-2">{alignmentScore}%</div>
            <p className="text-purple-700 mt-2">{compatibilityAnalysis}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* User Perspective */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Your Psychological Profile</h4>
              
              <div className="space-y-3">
                <div>
                  <Label>Attachment Style</Label>
                  <Badge className={getAttachmentStyleColor(userPerspective.attachmentStyle)}>
                    {userPerspective.attachmentStyle}
                  </Badge>
                </div>
                
                <div>
                  <Label>Primary Love Language</Label>
                  <Badge className={getLoveLanguageColor(userPerspective.loveLanguage)}>
                    {userPerspective.loveLanguage}
                  </Badge>
                </div>
                
                <div>
                  <Label>Conflict Resolution</Label>
                  <p className="text-sm text-gray-600">{userPerspective.conflictResolution}</p>
                </div>
                
                <div>
                  <Label>Core Emotional Needs</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {userPerspective.emotionalNeeds.map((need) => (
                      <Badge key={need} variant="outline">{need}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Growth Areas</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {userPerspective.growthAreas.map((area) => (
                      <Badge key={area} variant="secondary">{area}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Partner Perspective */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">{partnerName}'s Psychological Profile</h4>
              
              <div className="space-y-3">
                <div>
                  <Label>Attachment Style</Label>
                  <Badge className={getAttachmentStyleColor(partnerPerspective.attachmentStyle)}>
                    {partnerPerspective.attachmentStyle}
                  </Badge>
                </div>
                
                <div>
                  <Label>Primary Love Language</Label>
                  <Badge className={getLoveLanguageColor(partnerPerspective.loveLanguage)}>
                    {partnerPerspective.loveLanguage}
                  </Badge>
                </div>
                
                <div>
                  <Label>Conflict Resolution</Label>
                  <p className="text-sm text-gray-600">{partnerPerspective.conflictResolution}</p>
                </div>
                
                <div>
                  <Label>Core Emotional Needs</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {partnerPerspective.emotionalNeeds.map((need) => (
                      <Badge key={need} variant="outline">{need}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Growth Areas</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {partnerPerspective.growthAreas.map((area) => (
                      <Badge key={area} variant="secondary">{area}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleGenerateApprovalQuestion} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Share Analysis with Partner'
              )}
            </Button>
            <Button variant="outline" onClick={() => onComplete({ userPerspective, partnerPerspective, compatibilityAnalysis, alignmentScore })}>
              Skip Approval Process
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stage === 'approval') {
    if (!showApprovalForm) {
      return (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Analysis Complete</CardTitle>
            <CardDescription>
              {partnerPerspective ? 
                "Both assessments are complete! View the psychological analysis." : 
                "Waiting for your partner to complete their assessment..."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {partnerPerspective ? (
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-lg font-medium">Ready for Analysis</p>
                <p className="text-gray-600">
                  Both you and {partnerName} have completed the assessment. 
                  The AI has generated psychological insights about your compatibility.
                </p>
                <Button onClick={() => setStage('analysis')} className="w-full">
                  View Psychological Analysis
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
                <p className="text-lg font-medium">Waiting for Partner</p>
                <p className="text-gray-600">
                  {partnerName} hasn't completed their assessment yet. 
                  You'll be notified when both assessments are complete.
                </p>
                <Button onClick={() => onComplete(null)} variant="outline" className="w-full">
                  Continue to Challenge
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-pink-500" />
            <div>
              <CardTitle>Analysis Approval</CardTitle>
              <CardDescription>
                Does this psychological analysis resonate with you?
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {approvalQuestion && (
            <>
              <Alert>
                <AlertDescription>
                  <p className="font-medium mb-2">{approvalQuestion.question}</p>
                  <p className="text-sm text-gray-600">{approvalQuestion.context}</p>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Label>Your Response</Label>
                <Textarea
                  value={approvalResponse}
                  onChange={(e) => setApprovalResponse(e.target.value)}
                  placeholder="Share your thoughts on this analysis..."
                  rows={4}
                />
                <p className="text-xs text-gray-500">
                  {approvalQuestion.psychologicalRationale}
                </p>
              </div>

              <Button 
                onClick={handleApprovalResponse} 
                disabled={loading || !approvalResponse.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Response'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (stage === 'complete') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <div>
              <CardTitle>Assessment Complete</CardTitle>
              <CardDescription>
                Thank you for completing the partner quality assessment
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-lg font-medium text-green-600">✓ Successfully Completed</p>
            <p className="text-gray-600">
              Your responses have been recorded and will contribute to a more personalized couples challenge experience.
            </p>
            <Button onClick={() => onComplete(null)} className="w-full">
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
