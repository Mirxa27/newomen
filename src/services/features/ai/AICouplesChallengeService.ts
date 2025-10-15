import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

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
  private zaiApiKey: string | null = null;
  private zaiBaseUrl = 'https://api.z.ai/api/coding/paas/v4';
  private zaiModel = 'GLM-4.6';

  private constructor() {}

  static getInstance(): AICouplesChallengeService {
    if (!AICouplesChallengeService.instance) {
      AICouplesChallengeService.instance = new AICouplesChallengeService();
    }
    return AICouplesChallengeService.instance;
  }

  private async getZaiApiKey(): Promise<string> {
    if (this.zaiApiKey) return this.zaiApiKey;

    try {
      // Use the correct function name from the types
      interface RPCResponse {
        data: string | null;
        error: Error | null;
      }
      
      const { data, error } = await (supabase.rpc as unknown as (functionName: string, params: Record<string, unknown>) => Promise<RPCResponse>)('get_provider_api_key_by_type', { 
        p_provider_type: 'zai' 
      });

      if (error) throw error;
      if (!data) throw new Error('Z.AI API key not configured');

      this.zaiApiKey = data;
      return this.zaiApiKey;
    } catch (err) {
      console.error('Error retrieving Z.AI API key:', err);
      throw new Error(`Z.AI API key retrieval failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async generateDynamicQuestion(
    previousResponses: Array<{ question: string; userResponse: string; partnerResponse: string }>,
    currentContext: string,
    challengeProgress: number
  ): Promise<AIQuestionGeneration> {
    const apiKey = await this.getZaiApiKey();

    const systemPrompt = `You are an expert relationship counselor and couples therapist. Generate insightful questions for couples challenges that help them understand each other better and grow their relationship.

Your response must be a valid JSON object with this structure:
{
  "question": "The question to ask the couple",
  "context": "Why this question is relevant based on their previous responses",
  "psychologicalIntent": "The psychological insight this question aims to reveal",
  "expectedInsight": "What kind of understanding this should create between partners"
}

Consider their previous responses and current relationship dynamics when crafting the question.`;

    const userPrompt = `Based on the following conversation history and context, generate the next question for this couples challenge:

Previous Responses:
${JSON.stringify(previousResponses, null, 2)}

Current Context: ${currentContext}
Challenge Progress: ${challengeProgress}%

Generate a question that:
1. Builds on their previous responses
2. Reveals deeper psychological insights
3. Promotes understanding and connection
4. Is appropriate for their current stage in the challenge

Make the question engaging, thought-provoking, and relationship-building.`;

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
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Z.AI API error: ${errorText}`);
    }

    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
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
    const apiKey = await this.getZaiApiKey();

    const systemPrompt = `You are an expert relationship psychologist. Analyze the desired partner qualities from both individuals in a relationship and provide psychological perspectives.

Your response must be a valid JSON object with this structure:
{
  "userPerspective": {
    "attachmentStyle": "Analysis of user's attachment style based on their desired qualities",
    "loveLanguage": "Primary love language based on their preferences",
    "conflictResolution": "Preferred conflict resolution style",
    "emotionalNeeds": ["need1", "need2", "need3"],
    "growthAreas": ["area1", "area2"]
  },
  "partnerPerspective": {
    "attachmentStyle": "Analysis of partner's attachment style based on their desired qualities",
    "loveLanguage": "Primary love language based on their preferences",
    "conflictResolution": "Preferred conflict resolution style",
    "emotionalNeeds": ["need1", "need2", "need3"],
    "growthAreas": ["area1", "area2"]
  },
  "compatibilityAnalysis": "Comprehensive analysis of their compatibility based on psychological perspectives",
  "alignmentScore": 85
}`;

    const userPrompt = `Analyze these partner quality responses from both individuals:

User's Desired Qualities:
${JSON.stringify(userQualities, null, 2)}

Partner's Desired Qualities:
${JSON.stringify(partnerQualities, null, 2)}

Provide psychological analysis including:
1. Attachment styles for both individuals
2. Primary love languages
3. Conflict resolution preferences
4. Core emotional needs
5. Areas for growth
6. Overall compatibility analysis with alignment score (0-100)

Focus on deep psychological insights that will help them understand each other better.`;

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
        max_tokens: 2000,
        stream: false,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Z.AI API error: ${errorText}`);
    }

    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
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
    const apiKey = await this.getZaiApiKey();

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

    const result = await response.json();
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
    const apiKey = await this.getZaiApiKey();

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

    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
  }

  async synthesizeChallengeAnalysis(
    allResponses: Array<{ question: string; userResponse: string; partnerResponse: string }>,
    partnerQualities?: {
      user: PartnerQualityData;
      partner: PartnerQualityData;
    }
  ): Promise<AICouplesAnalysis> {
    const apiKey = await this.getZaiApiKey();

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

    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
  }
}

export const aiCouplesChallengeService = AICouplesChallengeService.getInstance();
