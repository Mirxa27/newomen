import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface ZaiChatCompletion {
    choices: {
        message: {
            content: string;
        };
    }[];
}

export interface PartnerQualityData {
  userId: string;
  partnerName: string;
  desiredQualities: string[];
  relationshipGoals: string;
  communicationStyle: string;
  values: string[];
}

export interface PsychologicalPerspective {
  attachmentStyle: string;
  loveLanguage: string;
  conflictResolution: string;
  emotionalNeeds: string[];
  growthAreas: string[];
}

export interface AIQuestionGeneration {
  question: string;
  context: string;
  psychologicalIntent: string;
  expectedInsight: string;
}

export interface AICouplesAnalysis {
  compatibilityScore: number;
  strengths: string[];
  growthOpportunities: string[];
  communicationPatterns: string[];
  psychologicalInsights: PsychologicalPerspective;
  nextSteps: string[];
  conversationStarters: string[];
}

export class AICouplesChallengeService {
  private static instance: AICouplesChallengeService;

  private constructor() {}

  static getInstance(): AICouplesChallengeService {
    if (!AICouplesChallengeService.instance) {
      AICouplesChallengeService.instance = new AICouplesChallengeService();
    }
    return AICouplesChallengeService.instance;
  }

  private async callEdgeFunction<T>(functionName: string, payload: unknown): Promise<T> {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });

    if (error) throw error;
    if (!data) throw new Error(`Edge function ${functionName} returned no data`);

    if (data.success === false) {
      throw new Error(data.error || `Edge function ${functionName} failed`);
    }

    return data.data;
  }

  async generateDynamicQuestion(
    previousResponses: Array<{ question: string; userResponse: string; partnerResponse: string }>,
    currentContext: string,
    challengeProgress: number
  ): Promise<AIQuestionGeneration> {
    return this.callEdgeFunction<AIQuestionGeneration>('couples-challenge-ai', {
      type: 'generateDynamicQuestion',
      payload: { previousResponses, currentContext, challengeProgress }
    });
  }

  async analyzePartnerQualities(
    userQualities: PartnerQualityData,
    partnerQualities: PartnerQualityData
  ): Promise<{
    userPerspective: PsychologicalPerspective;
    partnerPerspective: PsychologicalPerspective;
    compatibilityAnalysis: string;
    alignmentScore: number;
  }> {
    return this.callEdgeFunction('couples-challenge-ai', {
      type: 'analyzePartnerQualities',
      payload: { userQualities, partnerQualities }
    });
  }

  async generateQualityApprovalQuestion(
    userPerspective: PsychologicalPerspective,
    partnerPerspective: PsychologicalPerspective,
    originalQualities: PartnerQualityData
  ): Promise<{
    question: string;
    context: string;
    approvalOptions: string[];
    psychologicalRationale: string;
  }> {
    return this.callEdgeFunction('couples-challenge-ai', {
      type: 'generateQualityApprovalQuestion',
      payload: { userPerspective, partnerPerspective, originalQualities }
    });
  }

  async generateQualityApprovalQuestionOld(
    userPerspective: PsychologicalPerspective,
    partnerPerspective: PsychologicalPerspective,
    originalQualities: PartnerQualityData
  ): Promise<{
    question: string;
    context: string;
    approvalOptions: string[];
    psychologicalRationale: string;
  }> {
    // This method is kept for reference but not used
    throw new Error('This method is deprecated');

    const systemPrompt = `You are a relationship counselor. Create a question that asks one partner to approve or disapprove of the psychological analysis of their desired qualities, fostering deeper understanding.

Your response must be a valid JSON object with this structure:
{
  "question": "The question asking for approval/disapproval of the psychological analysis",
  "context": "Explanation of why this question matters for their relationship",
  "approvalOptions": ["I agree with this analysis", "This is partially accurate", "I disagree with this analysis", "I need to think more about this"],
  "psychologicalRationale": "Why getting their approval/disapproval is important for relationship growth"
}`;

    const userPrompt = `Based on these psychological perspectives, create an approval question:

User's Psychological Perspective:
${JSON.stringify(userPerspective, null, 2)}

Partner's Psychological Perspective:
${JSON.stringify(partnerPerspective, null, 2)}

Original Desired Qualities:
${JSON.stringify(originalQualities, null, 2)}

Create a question that:
1. Presents the psychological analysis to the partner
2. Asks for their approval or disapproval
3. Provides meaningful response options
4. Explains why their perspective matters
5. Encourages open dialogue about the analysis

This should help both partners understand if the psychological insights resonate with their self-perception.`;

    const response = await fetch(`${this.zaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US,en',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: this.zaiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 1500,
        stream: false,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Z.AI API error: ${errorText}`);
    }

    const result: ZaiChatCompletion = await response.json();
    return JSON.parse(result.choices[0].message.content);
  }

  async generateRealTimeInsight(
    recentMessages: Array<{ sender: string; content: string; timestamp: string }>,
    challengeProgress: number
  ): Promise<{
    insight: string;
    relevance: string;
    conversationStarter: string;
    psychologicalDepth: string;
  }> {
    return this.callEdgeFunction('couples-challenge-ai', {
      type: 'generateRealTimeInsight',
      payload: { recentMessages, challengeProgress }
    });
  }

  async generateRealTimeInsightOld(
    recentMessages: Array<{ sender: string; content: string; timestamp: string }>,
    challengeProgress: number
  ): Promise<{
    insight: string;
    relevance: string;
    conversationStarter: string;
    psychologicalDepth: string;
  }> {
    // This method is kept for reference but not used
    throw new Error('This method is deprecated');

    const systemPrompt = `You are a relationship coach providing real-time insights during couples challenges. Analyze the conversation and provide meaningful, actionable insights.

Your response must be a valid JSON object with this structure:
{
  "insight": "A meaningful insight about their communication or relationship dynamics",
  "relevance": "Why this insight is relevant right now",
  "conversationStarter": "A suggestion for deepening their conversation",
  "psychologicalDepth": "The deeper psychological principle behind this insight"
}`;

    const userPrompt = `Analyze this recent conversation from a couples challenge:

Recent Messages:
${JSON.stringify(recentMessages, null, 2)}

Challenge Progress: ${challengeProgress}%

Provide:
1. A meaningful insight about their interaction
2. Why this insight matters at this point
3. A conversation starter to deepen their understanding
4. The psychological principle behind your insight

Keep it supportive, constructive, and focused on growth.`;

    const response = await fetch(`${this.zaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US,en',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: this.zaiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 1000,
        stream: false,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Z.AI API error: ${errorText}`);
    }

    const result: ZaiChatCompletion = await response.json();
    return JSON.parse(result.choices[0].message.content);
  }

  async synthesizeChallengeAnalysis(
    allResponses: Array<{ question: string; userResponse: string; partnerResponse: string }>,
    partnerQualities?: {
      user: PartnerQualityData;
      partner: PartnerQualityData;
    }
  ): Promise<AICouplesAnalysis> {
    return this.callEdgeFunction('couples-challenge-ai', {
      type: 'synthesizeChallengeAnalysis',
      payload: { allResponses, partnerQualities }
    });
  }

  async synthesizeChallengeAnalysisOld(
    allResponses: Array<{ question: string; userResponse: string; partnerResponse: string }>,
    partnerQualities?: {
      user: PartnerQualityData;
      partner: PartnerQualityData;
    }
  ): Promise<AICouplesAnalysis> {
    // This method is kept for reference but not used
    throw new Error('This method is deprecated');

    const systemPrompt = `You are an expert relationship counselor. Synthesize all responses from a couples challenge into a comprehensive analysis.

Your response must be a valid JSON object with this structure:
{
  "compatibilityScore": 85,
  "strengths": ["strength1", "strength2", "strength3"],
  "growthOpportunities": ["opportunity1", "opportunity2"],
  "communicationPatterns": ["pattern1", "pattern2"],
  "psychologicalInsights": {
    "attachmentStyle": "Combined attachment style analysis",
    "loveLanguage": "Primary love languages and compatibility",
    "conflictResolution": "How they handle conflicts together",
    "emotionalNeeds": ["shared need1", "shared need2"],
    "growthAreas": ["area for growth1", "area for growth2"]
  },
  "nextSteps": ["suggestion1", "suggestion2", "suggestion3"],
  "conversationStarters": ["starter1", "starter2", "starter3"]
}`;

    const userPrompt = `Synthesize this complete couples challenge:

All Challenge Responses:
${JSON.stringify(allResponses, null, 2)}

${partnerQualities ? `
Partner Quality Analysis:
User Qualities: ${JSON.stringify(partnerQualities.user, null, 2)}
Partner Qualities: ${JSON.stringify(partnerQualities.partner, null, 2)}
` : ''}

Create a comprehensive analysis that includes:
1. Overall compatibility score (0-100)
2. Relationship strengths
3. Growth opportunities
4. Communication patterns observed
5. Psychological insights about their dynamic
6. Specific next steps for their relationship
7. Conversation starters for future discussions

Make it supportive, actionable, and focused on growth.`;

    const response = await fetch(`${this.zaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US,en',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: this.zaiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 2500,
        stream: false,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Z.AI API error: ${errorText}`);
    }

    const result: ZaiChatCompletion = await response.json();
    return JSON.parse(result.choices[0].message.content);
  }
}

export const aiCouplesChallengeService = AICouplesChallengeService.getInstance();
