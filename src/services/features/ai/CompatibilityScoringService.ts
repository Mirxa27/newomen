/**
 * Comprehensive Compatibility Scoring Service
 * Multi-dimensional algorithm for relationship compatibility analysis
 */

export interface DimensionalScore {
  dimension: string;
  score: number; // 0-100
  weight: number; // Importance weight
  insights: string[];
  strength: 'low' | 'moderate' | 'high' | 'excellent';
}

export interface CompatibilityDimensions {
  communication: DimensionalScore;
  emotionalConnection: DimensionalScore;
  valuesAlignment: DimensionalScore;
  conflictResolution: DimensionalScore;
  intimacy: DimensionalScore;
  futureVision: DimensionalScore;
  trustAndSecurity: DimensionalScore;
  growthMindset: DimensionalScore;
}

export interface CompatibilityBreakdown {
  overallScore: number; // Weighted average
  dimensions: CompatibilityDimensions;
  strengthAreas: string[];
  growthAreas: string[];
  compatibilityLevel: 'Low' | 'Moderate' | 'Good' | 'Very Good' | 'Excellent';
  relationshipStage: 'Exploring' | 'Building' | 'Deepening' | 'Thriving';
  recommendations: string[];
  calculatedAt: string;
}

export interface ResponsePair {
  question: string;
  userResponse: string;
  partnerResponse: string;
  category?: string;
}

export class CompatibilityScoringService {
  private static instance: CompatibilityScoringService;

  // Dimension weights (sum = 1.0)
  private readonly dimensionWeights = {
    communication: 0.20,
    emotionalConnection: 0.18,
    valuesAlignment: 0.16,
    conflictResolution: 0.14,
    intimacy: 0.12,
    futureVision: 0.10,
    trustAndSecurity: 0.06,
    growthMindset: 0.04,
  };

  private constructor() {}

  static getInstance(): CompatibilityScoringService {
    if (!CompatibilityScoringService.instance) {
      CompatibilityScoringService.instance = new CompatibilityScoringService();
    }
    return CompatibilityScoringService.instance;
  }

  /**
   * Calculate comprehensive compatibility score from challenge responses
   */
  async calculateCompatibility(
    responses: ResponsePair[],
    aiInsights?: {
      attachmentStyles?: { user: string; partner: string };
      loveLanguages?: { user: string; partner: string };
      conflictStyles?: { user: string; partner: string };
    }
  ): Promise<CompatibilityBreakdown> {
    // Calculate each dimension
    const communication = await this.scoreCommunication(responses, aiInsights);
    const emotionalConnection = await this.scoreEmotionalConnection(responses, aiInsights);
    const valuesAlignment = await this.scoreValuesAlignment(responses);
    const conflictResolution = await this.scoreConflictResolution(responses, aiInsights);
    const intimacy = await this.scoreIntimacy(responses);
    const futureVision = await this.scoreFutureVision(responses);
    const trustAndSecurity = await this.scoreTrustAndSecurity(responses);
    const growthMindset = await this.scoreGrowthMindset(responses);

    const dimensions: CompatibilityDimensions = {
      communication,
      emotionalConnection,
      valuesAlignment,
      conflictResolution,
      intimacy,
      futureVision,
      trustAndSecurity,
      growthMindset,
    };

    // Calculate weighted overall score
    const overallScore = this.calculateWeightedScore(dimensions);

    // Determine compatibility level
    const compatibilityLevel = this.getCompatibilityLevel(overallScore);

    // Determine relationship stage
    const relationshipStage = this.determineRelationshipStage(dimensions, overallScore);

    // Identify strength and growth areas
    const strengthAreas = this.identifyStrengthAreas(dimensions);
    const growthAreas = this.identifyGrowthAreas(dimensions);

    // Generate recommendations
    const recommendations = this.generateRecommendations(dimensions, overallScore);

    return {
      overallScore: Math.round(overallScore * 10) / 10,
      dimensions,
      strengthAreas,
      growthAreas,
      compatibilityLevel,
      relationshipStage,
      recommendations,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Score Communication Dimension
   * Factors: Response similarity, emotional expression, listening indicators
   */
  private async scoreCommunication(
    responses: ResponsePair[],
    aiInsights?: { attachmentStyles?: { user: string; partner: string } }
  ): Promise<DimensionalScore> {
    let totalScore = 0;
    const insights: string[] = [];

    // Factor 1: Response length alignment (10 points)
    const lengthAlignment = this.calculateLengthAlignment(responses);
    totalScore += lengthAlignment * 10;
    if (lengthAlignment > 0.7) {
      insights.push('Both partners express themselves at similar depths');
    }

    // Factor 2: Emotional vocabulary usage (20 points)
    const emotionalVocab = this.analyzeEmotionalVocabulary(responses);
    totalScore += emotionalVocab * 20;
    if (emotionalVocab > 0.6) {
      insights.push('Strong emotional expression in communication');
    }

    // Factor 3: Question words usage (15 points) - shows curiosity
    const questionUsage = this.analyzeQuestionUsage(responses);
    totalScore += questionUsage * 15;
    if (questionUsage > 0.5) {
      insights.push('High curiosity and engagement with each other');
    }

    // Factor 4: Response timing/promptness (10 points)
    const timeliness = this.analyzeResponseTimeliness(responses);
    totalScore += timeliness * 10;
    if (timeliness > 0.8) {
      insights.push('Prompt and engaged responses show active participation');
    }

    // Factor 5: Shared vocabulary (15 points)
    const sharedVocab = this.calculateSharedVocabulary(responses);
    totalScore += sharedVocab * 15;

    // Factor 6: Attachment style compatibility (20 points)
    if (aiInsights?.attachmentStyles) {
      const attachmentScore = this.scoreAttachmentStyleCompatibility(
        aiInsights.attachmentStyles.user,
        aiInsights.attachmentStyles.partner
      );
      totalScore += attachmentScore * 20;
      if (attachmentScore > 0.7) {
        insights.push('Complementary attachment styles support healthy communication');
      }
    } else {
      totalScore += 14; // Default mid-range
    }

    // Factor 7: Acknowledgment patterns (10 points)
    const acknowledgment = this.analyzeAcknowledgmentPatterns(responses);
    totalScore += acknowledgment * 10;

    const score = Math.min(100, totalScore);
    return {
      dimension: 'Communication',
      score: Math.round(score * 10) / 10,
      weight: this.dimensionWeights.communication,
      insights: insights.length > 0 ? insights : ['Developing communication patterns'],
      strength: this.getStrengthLevel(score),
    };
  }

  /**
   * Score Emotional Connection Dimension
   */
  private async scoreEmotionalConnection(
    responses: ResponsePair[],
    aiInsights?: { loveLanguages?: { user: string; partner: string } }
  ): Promise<DimensionalScore> {
    let totalScore = 0;
    const insights: string[] = [];

    // Factor 1: Emotional empathy indicators (25 points)
    const empathy = this.analyzeEmpathyIndicators(responses);
    totalScore += empathy * 25;
    if (empathy > 0.7) {
      insights.push('Strong emotional attunement to each other');
    }

    // Factor 2: Vulnerability sharing (20 points)
    const vulnerability = this.analyzeVulnerability(responses);
    totalScore += vulnerability * 20;
    if (vulnerability > 0.6) {
      insights.push('Comfortable being vulnerable with each other');
    }

    // Factor 3: Positive sentiment (15 points)
    const sentiment = this.analyzeSentiment(responses);
    totalScore += sentiment * 15;

    // Factor 4: Love language compatibility (20 points)
    if (aiInsights?.loveLanguages) {
      const loveLanguageScore = this.scoreLoveLanguageCompatibility(
        aiInsights.loveLanguages.user,
        aiInsights.loveLanguages.partner
      );
      totalScore += loveLanguageScore * 20;
      if (loveLanguageScore > 0.6) {
        insights.push('Love languages complement each other well');
      }
    } else {
      totalScore += 12;
    }

    // Factor 5: Mutual appreciation (20 points)
    const appreciation = this.analyzeMutualAppreciation(responses);
    totalScore += appreciation * 20;
    if (appreciation > 0.7) {
      insights.push('High mutual appreciation and validation');
    }

    const score = Math.min(100, totalScore);
    return {
      dimension: 'Emotional Connection',
      score: Math.round(score * 10) / 10,
      weight: this.dimensionWeights.emotionalConnection,
      insights: insights.length > 0 ? insights : ['Building emotional bonds'],
      strength: this.getStrengthLevel(score),
    };
  }

  /**
   * Score Values Alignment Dimension
   */
  private async scoreValuesAlignment(responses: ResponsePair[]): Promise<DimensionalScore> {
    let totalScore = 0;
    const insights: string[] = [];

    // Factor 1: Core values keywords match (30 points)
    const coreValuesMatch = this.analyzeCoreValuesMatch(responses);
    totalScore += coreValuesMatch * 30;
    if (coreValuesMatch > 0.7) {
      insights.push('Strong alignment on core values and principles');
    }

    // Factor 2: Priority alignment (25 points)
    const priorityAlignment = this.analyzePriorityAlignment(responses);
    totalScore += priorityAlignment * 25;

    // Factor 3: Life philosophy similarity (20 points)
    const philosophyMatch = this.analyzePhilosophyMatch(responses);
    totalScore += philosophyMatch * 20;

    // Factor 4: Goal compatibility (15 points)
    const goalCompatibility = this.analyzeGoalCompatibility(responses);
    totalScore += goalCompatibility * 15;
    if (goalCompatibility > 0.6) {
      insights.push('Compatible life goals and aspirations');
    }

    // Factor 5: Ethical alignment (10 points)
    const ethicalAlignment = this.analyzeEthicalAlignment(responses);
    totalScore += ethicalAlignment * 10;

    const score = Math.min(100, totalScore);
    return {
      dimension: 'Values Alignment',
      score: Math.round(score * 10) / 10,
      weight: this.dimensionWeights.valuesAlignment,
      insights: insights.length > 0 ? insights : ['Exploring shared values'],
      strength: this.getStrengthLevel(score),
    };
  }

  /**
   * Score Conflict Resolution Dimension
   */
  private async scoreConflictResolution(
    responses: ResponsePair[],
    aiInsights?: { conflictStyles?: { user: string; partner: string } }
  ): Promise<DimensionalScore> {
    let totalScore = 0;
    const insights: string[] = [];

    // Factor 1: Conflict style compatibility (30 points)
    if (aiInsights?.conflictStyles) {
      const styleCompatibility = this.scoreConflictStyleCompatibility(
        aiInsights.conflictStyles.user,
        aiInsights.conflictStyles.partner
      );
      totalScore += styleCompatibility * 30;
      if (styleCompatibility > 0.7) {
        insights.push('Complementary approaches to handling disagreements');
      }
    } else {
      totalScore += 18;
    }

    // Factor 2: Calm/constructive language (25 points)
    const constructiveLanguage = this.analyzeConstructiveLanguage(responses);
    totalScore += constructiveLanguage * 25;

    // Factor 3: Solution-oriented thinking (20 points)
    const solutionOrientation = this.analyzeSolutionOrientation(responses);
    totalScore += solutionOrientation * 20;
    if (solutionOrientation > 0.6) {
      insights.push('Both partners focus on finding solutions');
    }

    // Factor 4: Accountability indicators (15 points)
    const accountability = this.analyzeAccountability(responses);
    totalScore += accountability * 15;

    // Factor 5: Compromise willingness (10 points)
    const compromise = this.analyzeCompromiseWillingness(responses);
    totalScore += compromise * 10;

    const score = Math.min(100, totalScore);
    return {
      dimension: 'Conflict Resolution',
      score: Math.round(score * 10) / 10,
      weight: this.dimensionWeights.conflictResolution,
      insights: insights.length > 0 ? insights : ['Developing conflict resolution skills'],
      strength: this.getStrengthLevel(score),
    };
  }

  /**
   * Score Intimacy Dimension
   */
  private async scoreIntimacy(responses: ResponsePair[]): Promise<DimensionalScore> {
    let totalScore = 0;
    const insights: string[] = [];

    // Factor 1: Emotional intimacy indicators (30 points)
    const emotionalIntimacy = this.analyzeEmotionalIntimacy(responses);
    totalScore += emotionalIntimacy * 30;
    if (emotionalIntimacy > 0.7) {
      insights.push('Deep emotional intimacy and connection');
    }

    // Factor 2: Physical affection references (20 points)
    const affectionReferences = this.analyzeAffectionReferences(responses);
    totalScore += affectionReferences * 20;

    // Factor 3: Shared experiences (20 points)
    const sharedExperiences = this.analyzeSharedExperiences(responses);
    totalScore += sharedExperiences * 20;

    // Factor 4: Future-oriented "we" statements (15 points)
    const weStatements = this.analyzeWeStatements(responses);
    totalScore += weStatements * 15;
    if (weStatements > 0.6) {
      insights.push('Strong sense of partnership and togetherness');
    }

    // Factor 5: Privacy/trust indicators (15 points)
    const trustIndicators = this.analyzeTrustIndicators(responses);
    totalScore += trustIndicators * 15;

    const score = Math.min(100, totalScore);
    return {
      dimension: 'Intimacy',
      score: Math.round(score * 10) / 10,
      weight: this.dimensionWeights.intimacy,
      insights: insights.length > 0 ? insights : ['Building intimate connection'],
      strength: this.getStrengthLevel(score),
    };
  }

  /**
   * Score Future Vision Dimension
   */
  private async scoreFutureVision(responses: ResponsePair[]): Promise<DimensionalScore> {
    let totalScore = 0;
    const insights: string[] = [];

    // Factor 1: Future planning alignment (35 points)
    const futurePlanning = this.analyzeFuturePlanning(responses);
    totalScore += futurePlanning * 35;
    if (futurePlanning > 0.7) {
      insights.push('Aligned vision for the future together');
    }

    // Factor 2: Timeline compatibility (25 points)
    const timelineMatch = this.analyzeTimelineCompatibility(responses);
    totalScore += timelineMatch * 25;

    // Factor 3: Shared dreams and aspirations (20 points)
    const sharedDreams = this.analyzeSharedDreams(responses);
    totalScore += sharedDreams * 20;

    // Factor 4: Flexibility and openness (20 points)
    const flexibility = this.analyzeFlexibility(responses);
    totalScore += flexibility * 20;
    if (flexibility > 0.6) {
      insights.push('Open and flexible about future possibilities');
    }

    const score = Math.min(100, totalScore);
    return {
      dimension: 'Future Vision',
      score: Math.round(score * 10) / 10,
      weight: this.dimensionWeights.futureVision,
      insights: insights.length > 0 ? insights : ['Exploring future possibilities'],
      strength: this.getStrengthLevel(score),
    };
  }

  /**
   * Score Trust and Security Dimension
   */
  private async scoreTrustAndSecurity(responses: ResponsePair[]): Promise<DimensionalScore> {
    let totalScore = 0;
    const insights: string[] = [];

    // Factor 1: Consistency in responses (30 points)
    const consistency = this.analyzeConsistency(responses);
    totalScore += consistency * 30;
    if (consistency > 0.7) {
      insights.push('Consistent and reliable in interactions');
    }

    // Factor 2: Honesty indicators (25 points)
    const honesty = this.analyzeHonestyIndicators(responses);
    totalScore += honesty * 25;

    // Factor 3: Transparency (25 points)
    const transparency = this.analyzeTransparency(responses);
    totalScore += transparency * 25;

    // Factor 4: Security-building language (20 points)
    const securityLanguage = this.analyzeSecurityLanguage(responses);
    totalScore += securityLanguage * 20;

    const score = Math.min(100, totalScore);
    return {
      dimension: 'Trust & Security',
      score: Math.round(score * 10) / 10,
      weight: this.dimensionWeights.trustAndSecurity,
      insights: insights.length > 0 ? insights : ['Building trust foundation'],
      strength: this.getStrengthLevel(score),
    };
  }

  /**
   * Score Growth Mindset Dimension
   */
  private async scoreGrowthMindset(responses: ResponsePair[]): Promise<DimensionalScore> {
    let totalScore = 0;
    const insights: string[] = [];

    // Factor 1: Growth language (30 points)
    const growthLanguage = this.analyzeGrowthLanguage(responses);
    totalScore += growthLanguage * 30;
    if (growthLanguage > 0.7) {
      insights.push('Strong commitment to personal and relationship growth');
    }

    // Factor 2: Learning indicators (25 points)
    const learningIndicators = this.analyzeLearningIndicators(responses);
    totalScore += learningIndicators * 25;

    // Factor 3: Openness to change (25 points)
    const opennessToChange = this.analyzeOpennessToChange(responses);
    totalScore += opennessToChange * 25;

    // Factor 4: Self-improvement references (20 points)
    const selfImprovement = this.analyzeSelfImprovement(responses);
    totalScore += selfImprovement * 20;

    const score = Math.min(100, totalScore);
    return {
      dimension: 'Growth Mindset',
      score: Math.round(score * 10) / 10,
      weight: this.dimensionWeights.growthMindset,
      insights: insights.length > 0 ? insights : ['Exploring growth together'],
      strength: this.getStrengthLevel(score),
    };
  }

  // ========== Helper Methods ==========

  private calculateWeightedScore(dimensions: CompatibilityDimensions): number {
    return Object.entries(dimensions).reduce((total, [key, dimension]) => {
      const weight = this.dimensionWeights[key as keyof typeof this.dimensionWeights];
      return total + dimension.score * weight;
    }, 0);
  }

  private getCompatibilityLevel(score: number): 'Low' | 'Moderate' | 'Good' | 'Very Good' | 'Excellent' {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Very Good';
    if (score >= 55) return 'Good';
    if (score >= 40) return 'Moderate';
    return 'Low';
  }

  private getStrengthLevel(score: number): 'low' | 'moderate' | 'high' | 'excellent' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'high';
    if (score >= 50) return 'moderate';
    return 'low';
  }

  private determineRelationshipStage(
    dimensions: CompatibilityDimensions,
    overallScore: number
  ): 'Exploring' | 'Building' | 'Deepening' | 'Thriving' {
    const avgTopDimensions =
      (dimensions.communication.score +
        dimensions.emotionalConnection.score +
        dimensions.valuesAlignment.score) /
      3;

    if (overallScore >= 75 && avgTopDimensions >= 80) return 'Thriving';
    if (overallScore >= 60 && avgTopDimensions >= 65) return 'Deepening';
    if (overallScore >= 45) return 'Building';
    return 'Exploring';
  }

  private identifyStrengthAreas(dimensions: CompatibilityDimensions): string[] {
    return Object.values(dimensions)
      .filter((dim) => dim.score >= 70)
      .map((dim) => dim.dimension)
      .slice(0, 3);
  }

  private identifyGrowthAreas(dimensions: CompatibilityDimensions): string[] {
    return Object.values(dimensions)
      .filter((dim) => dim.score < 60)
      .sort((a, b) => a.score - b.score)
      .map((dim) => dim.dimension)
      .slice(0, 3);
  }

  private generateRecommendations(dimensions: CompatibilityDimensions, overallScore: number): string[] {
    const recommendations: string[] = [];
    const growthAreas = this.identifyGrowthAreas(dimensions);

    growthAreas.forEach((area) => {
      const dimKey = area.toLowerCase().replace(/\s+/g, '');
      switch (dimKey) {
        case 'communication':
          recommendations.push('Practice active listening exercises together');
          break;
        case 'emotionalconnection':
          recommendations.push('Schedule regular one-on-one quality time');
          break;
        case 'valuesalignment':
          recommendations.push('Discuss your core values and life priorities');
          break;
        case 'conflictresolution':
          recommendations.push('Learn and practice healthy conflict resolution techniques');
          break;
        case 'intimacy':
          recommendations.push('Explore ways to deepen emotional and physical intimacy');
          break;
        case 'futurevision':
          recommendations.push('Create a shared vision board for your future together');
          break;
        case 'trust&security':
          recommendations.push('Build trust through consistent actions and open communication');
          break;
        case 'growthmindset':
          recommendations.push('Set growth goals together and support each other');
          break;
      }
    });

    if (overallScore >= 70) {
      recommendations.push('Continue nurturing your strong foundation');
      recommendations.push('Consider relationship enrichment activities');
    }

    return recommendations.slice(0, 5);
  }

  // ========== Text Analysis Methods ==========

  private calculateLengthAlignment(responses: ResponsePair[]): number {
    if (responses.length === 0) return 0.5;
    
    const ratios = responses.map((pair) => {
      const userLen = pair.userResponse.length;
      const partnerLen = pair.partnerResponse.length;
      if (userLen === 0 || partnerLen === 0) return 0.5;
      const ratio = Math.min(userLen, partnerLen) / Math.max(userLen, partnerLen);
      return ratio;
    });

    return ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
  }

  private analyzeEmotionalVocabulary(responses: ResponsePair[]): number {
    const emotionalWords = [
      'feel', 'love', 'happy', 'excited', 'grateful', 'appreciate', 'care',
      'understand', 'empathy', 'support', 'comfort', 'joy', 'peace', 'passion',
      'connection', 'warmth', 'tender', 'cherish', 'adore', 'trust'
    ];

    let totalEmotionalWords = 0;
    let totalWords = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      const words = allText.split(/\s+/);
      totalWords += words.length;
      totalEmotionalWords += words.filter((word) =>
        emotionalWords.some((ew) => word.includes(ew))
      ).length;
    });

    return totalWords > 0 ? Math.min(1, (totalEmotionalWords / totalWords) * 10) : 0.3;
  }

  private analyzeQuestionUsage(responses: ResponsePair[]): number {
    let questionCount = 0;
    let totalSentences = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`;
      const sentences = allText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      totalSentences += sentences.length;
      questionCount += (allText.match(/\?/g) || []).length;
    });

    return totalSentences > 0 ? Math.min(1, questionCount / (totalSentences * 0.3)) : 0.3;
  }

  private calculateSharedVocabulary(responses: ResponsePair[]): number {
    if (responses.length === 0) return 0.3;

    const userWords = new Set<string>();
    const partnerWords = new Set<string>();
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can']);

    responses.forEach((pair) => {
      pair.userResponse.toLowerCase().split(/\s+/).forEach((word) => {
        const cleanWord = word.replace(/[^a-z0-9]/g, '');
        if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
          userWords.add(cleanWord);
        }
      });
      pair.partnerResponse.toLowerCase().split(/\s+/).forEach((word) => {
        const cleanWord = word.replace(/[^a-z0-9]/g, '');
        if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
          partnerWords.add(cleanWord);
        }
      });
    });

    const intersection = new Set([...userWords].filter((word) => partnerWords.has(word)));
    const union = new Set([...userWords, ...partnerWords]);

    return union.size > 0 ? intersection.size / union.size : 0.3;
  }

  private scoreAttachmentStyleCompatibility(userStyle: string, partnerStyle: string): number {
    const compatibilityMatrix: { [key: string]: { [key: string]: number } } = {
      secure: { secure: 1.0, anxious: 0.7, avoidant: 0.6, fearful: 0.5 },
      anxious: { secure: 0.7, anxious: 0.5, avoidant: 0.3, fearful: 0.4 },
      avoidant: { secure: 0.6, anxious: 0.3, avoidant: 0.6, fearful: 0.4 },
      fearful: { secure: 0.5, anxious: 0.4, avoidant: 0.4, fearful: 0.4 },
    };

    const userKey = userStyle.toLowerCase();
    const partnerKey = partnerStyle.toLowerCase();

    return compatibilityMatrix[userKey]?.[partnerKey] ?? 0.5;
  }

  private analyzeAcknowledgmentPatterns(responses: ResponsePair[]): number {
    const acknowledgmentWords = ['yes', 'agree', 'understand', 'see', 'right', 'exactly', 'absolutely', 'definitely'];
    let acknowledgmentCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      acknowledgmentCount += acknowledgmentWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, acknowledgmentCount / (responses.length * 2));
  }

  private analyzeEmpathyIndicators(responses: ResponsePair[]): number {
    const empathyPhrases = [
      'i understand', 'i can see', 'that makes sense', 'i hear you', 'i feel',
      'sounds like', 'must be', 'i imagine', 'i appreciate', 'thank you for'
    ];

    let empathyCount = 0;
    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      empathyCount += empathyPhrases.filter((phrase) => allText.includes(phrase)).length;
    });

    return Math.min(1, empathyCount / responses.length);
  }

  private analyzeVulnerability(responses: ResponsePair[]): number {
    const vulnerabilityWords = [
      'fear', 'worried', 'scared', 'anxious', 'insecure', 'uncertain',
      'struggle', 'difficult', 'hard', 'challenge', 'nervous', 'vulnerable'
    ];

    let vulnerabilityCount = 0;
    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      vulnerabilityCount += vulnerabilityWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, vulnerabilityCount / (responses.length * 0.5));
  }

  private analyzeSentiment(responses: ResponsePair[]): number {
    const positiveWords = ['love', 'happy', 'joy', 'wonderful', 'amazing', 'great', 'best', 'beautiful', 'excited', 'grateful'];
    const negativeWords = ['hate', 'angry', 'sad', 'terrible', 'awful', 'worst', 'bad', 'upset', 'frustrated', 'disappointed'];

    let positiveCount = 0;
    let negativeCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      positiveCount += positiveWords.filter((word) => allText.includes(word)).length;
      negativeCount += negativeWords.filter((word) => allText.includes(word)).length;
    });

    const total = positiveCount + negativeCount;
    return total > 0 ? positiveCount / total : 0.5;
  }

  private scoreLoveLanguageCompatibility(userLanguage: string, partnerLanguage: string): number {
    // Love languages can be complementary even if different
    if (userLanguage === partnerLanguage) return 1.0;
    
    const complementaryPairs: { [key: string]: string[] } = {
      'words of affirmation': ['quality time', 'acts of service'],
      'quality time': ['words of affirmation', 'physical touch'],
      'acts of service': ['words of affirmation', 'receiving gifts'],
      'physical touch': ['quality time', 'words of affirmation'],
      'receiving gifts': ['acts of service', 'words of affirmation'],
    };

    const userKey = userLanguage.toLowerCase();
    const partnerKey = partnerLanguage.toLowerCase();

    if (complementaryPairs[userKey]?.includes(partnerKey)) return 0.8;
    return 0.6;
  }

  private analyzeMutualAppreciation(responses: ResponsePair[]): number {
    const appreciationWords = ['appreciate', 'grateful', 'thankful', 'value', 'admire', 'respect', 'proud'];
    let appreciationCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      appreciationCount += appreciationWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, appreciationCount / responses.length);
  }

  private analyzeCoreValuesMatch(responses: ResponsePair[]): number {
    const valueKeywords = {
      family: ['family', 'children', 'parent', 'home'],
      career: ['career', 'work', 'job', 'profession', 'ambition'],
      health: ['health', 'fitness', 'wellness', 'exercise'],
      spirituality: ['spiritual', 'faith', 'religion', 'belief', 'god'],
      adventure: ['adventure', 'travel', 'explore', 'experience'],
      stability: ['stability', 'security', 'routine', 'consistent'],
      growth: ['growth', 'learning', 'development', 'improve'],
      creativity: ['creative', 'art', 'music', 'design', 'expression'],
    };

    const userValues = new Set<string>();
    const partnerValues = new Set<string>();

    responses.forEach((pair) => {
      const userText = pair.userResponse.toLowerCase();
      const partnerText = pair.partnerResponse.toLowerCase();

      Object.entries(valueKeywords).forEach(([value, keywords]) => {
        if (keywords.some((keyword) => userText.includes(keyword))) {
          userValues.add(value);
        }
        if (keywords.some((keyword) => partnerText.includes(keyword))) {
          partnerValues.add(value);
        }
      });
    });

    const intersection = new Set([...userValues].filter((v) => partnerValues.has(v)));
    const union = new Set([...userValues, ...partnerValues]);

    return union.size > 0 ? intersection.size / union.size : 0.5;
  }

  private analyzePriorityAlignment(responses: ResponsePair[]): number {
    const priorityKeywords = ['important', 'priority', 'value', 'matter', 'care about', 'focus on', 'essential', 'crucial'];
    let alignmentScore = 0;
    let totalComparisons = 0;

    responses.forEach((pair) => {
      const userPriorities = this.extractKeywords(pair.userResponse, priorityKeywords);
      const partnerPriorities = this.extractKeywords(pair.partnerResponse, priorityKeywords);
      
      if (userPriorities.length > 0 && partnerPriorities.length > 0) {
        const overlap = userPriorities.filter(p => partnerPriorities.includes(p)).length;
        const total = Math.max(userPriorities.length, partnerPriorities.length);
        alignmentScore += overlap / total;
        totalComparisons++;
      }
    });

    return totalComparisons > 0 ? alignmentScore / totalComparisons : 0.65;
  }

  private analyzePhilosophyMatch(responses: ResponsePair[]): number {
    const philosophyKeywords = ['believe', 'think', 'feel', 'philosophy', 'perspective', 'view', 'opinion', 'stance'];
    let matchScore = 0;
    let totalComparisons = 0;

    responses.forEach((pair) => {
      const userPhilosophy = this.extractKeywords(pair.userResponse, philosophyKeywords);
      const partnerPhilosophy = this.extractKeywords(pair.partnerResponse, philosophyKeywords);
      
      if (userPhilosophy.length > 0 && partnerPhilosophy.length > 0) {
        // Calculate semantic similarity based on shared philosophical terms
        const sharedTerms = userPhilosophy.filter(term => partnerPhilosophy.includes(term)).length;
        const totalTerms = Math.max(userPhilosophy.length, partnerPhilosophy.length);
        matchScore += sharedTerms / totalTerms;
        totalComparisons++;
      }
    });

    return totalComparisons > 0 ? matchScore / totalComparisons : 0.60;
  }

  private analyzeGoalCompatibility(responses: ResponsePair[]): number {
    const goalKeywords = ['goal', 'dream', 'plan', 'future', 'want', 'hope', 'aspire', 'vision'];
    let goalMentions = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      goalMentions += goalKeywords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, goalMentions / (responses.length * 0.5));
  }

  private analyzeEthicalAlignment(responses: ResponsePair[]): number {
    return 0.70; // Placeholder
  }

  private scoreConflictStyleCompatibility(userStyle: string, partnerStyle: string): number {
    const compatibilityMatrix: { [key: string]: { [key: string]: number } } = {
      collaborative: { collaborative: 1.0, compromising: 0.9, accommodating: 0.7, competing: 0.5, avoiding: 0.4 },
      compromising: { collaborative: 0.9, compromising: 1.0, accommodating: 0.8, competing: 0.6, avoiding: 0.5 },
      accommodating: { collaborative: 0.7, compromising: 0.8, accommodating: 0.7, competing: 0.4, avoiding: 0.5 },
      competing: { collaborative: 0.5, compromising: 0.6, accommodating: 0.4, competing: 0.5, avoiding: 0.3 },
      avoiding: { collaborative: 0.4, compromising: 0.5, accommodating: 0.5, competing: 0.3, avoiding: 0.4 },
    };

    const userKey = userStyle.toLowerCase();
    const partnerKey = partnerStyle.toLowerCase();

    return compatibilityMatrix[userKey]?.[partnerKey] ?? 0.5;
  }

  private analyzeConstructiveLanguage(responses: ResponsePair[]): number {
    const constructiveWords = ['together', 'we can', 'let\'s', 'solution', 'resolve', 'work through', 'compromise'];
    const destructiveWords = ['never', 'always', 'blame', 'fault', 'wrong', 'should have'];

    let constructiveCount = 0;
    let destructiveCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      constructiveCount += constructiveWords.filter((word) => allText.includes(word)).length;
      destructiveCount += destructiveWords.filter((word) => allText.includes(word)).length;
    });

    const total = constructiveCount + destructiveCount;
    return total > 0 ? constructiveCount / total : 0.6;
  }

  private analyzeSolutionOrientation(responses: ResponsePair[]): number {
    const solutionWords = ['solve', 'fix', 'improve', 'better', 'change', 'try', 'plan', 'idea'];
    let solutionCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      solutionCount += solutionWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, solutionCount / responses.length);
  }

  private analyzeAccountability(responses: ResponsePair[]): number {
    const accountabilityPhrases = ['i was', 'my fault', 'i apologize', 'i\'m sorry', 'i take responsibility', 'i understand'];
    let accountabilityCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      accountabilityCount += accountabilityPhrases.filter((phrase) => allText.includes(phrase)).length;
    });

    return Math.min(1, accountabilityCount / (responses.length * 0.3));
  }

  private analyzeCompromiseWillingness(responses: ResponsePair[]): number {
    const compromiseWords = ['compromise', 'meet halfway', 'middle ground', 'both', 'agree', 'flexible'];
    let compromiseCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      compromiseCount += compromiseWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, compromiseCount / (responses.length * 0.3));
  }

  private analyzeEmotionalIntimacy(responses: ResponsePair[]): number {
    const intimacyWords = ['close', 'connected', 'bond', 'intimate', 'deep', 'soul', 'heart'];
    let intimacyCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      intimacyCount += intimacyWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, intimacyCount / (responses.length * 0.4));
  }

  private analyzeAffectionReferences(responses: ResponsePair[]): number {
    const affectionWords = ['hug', 'kiss', 'touch', 'hold', 'cuddle', 'affection', 'physical'];
    let affectionCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      affectionCount += affectionWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, affectionCount / (responses.length * 0.3));
  }

  private analyzeSharedExperiences(responses: ResponsePair[]): number {
    const experienceWords = ['remember when', 'we did', 'our', 'together', 'shared', 'experience'];
    let experienceCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      experienceCount += experienceWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, experienceCount / (responses.length * 0.4));
  }

  private analyzeWeStatements(responses: ResponsePair[]): number {
    let weCount = 0;
    let totalPronouns = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      weCount += (allText.match(/\bwe\b/g) || []).length;
      weCount += (allText.match(/\bour\b/g) || []).length;
      weCount += (allText.match(/\bus\b/g) || []).length;
      totalPronouns += (allText.match(/\b(we|our|us|i|my|me)\b/g) || []).length;
    });

    return totalPronouns > 0 ? weCount / totalPronouns : 0.5;
  }

  private analyzeTrustIndicators(responses: ResponsePair[]): number {
    const trustWords = ['trust', 'rely', 'depend', 'safe', 'secure', 'honest', 'open'];
    let trustCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      trustCount += trustWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, trustCount / (responses.length * 0.4));
  }

  private analyzeFuturePlanning(responses: ResponsePair[]): number {
    const futureWords = ['future', 'will', 'plan', 'someday', 'eventually', 'when we', 'next', 'later'];
    let futureCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      futureCount += futureWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, futureCount / (responses.length * 0.5));
  }

  private analyzeTimelineCompatibility(responses: ResponsePair[]): number {
    return 0.65; // Placeholder - would need timeline extraction
  }

  private analyzeSharedDreams(responses: ResponsePair[]): number {
    const dreamWords = ['dream', 'hope', 'wish', 'aspire', 'vision', 'imagine'];
    let dreamCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      dreamCount += dreamWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, dreamCount / (responses.length * 0.3));
  }

  private analyzeFlexibility(responses: ResponsePair[]): number {
    const flexibilityWords = ['flexible', 'open', 'adaptable', 'willing', 'can change', 'maybe', 'could'];
    let flexibilityCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      flexibilityCount += flexibilityWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, flexibilityCount / (responses.length * 0.4));
  }

  private analyzeConsistency(responses: ResponsePair[]): number {
    // Analyze if responses are consistent across questions
    return 0.75; // Placeholder - would need pattern matching
  }

  private analyzeHonestyIndicators(responses: ResponsePair[]): number {
    const honestyWords = ['honest', 'truth', 'truthful', 'genuine', 'real', 'authentic'];
    let honestyCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      honestyCount += honestyWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, honestyCount / (responses.length * 0.3));
  }

  private analyzeTransparency(responses: ResponsePair[]): number {
    const transparencyPhrases = ['to be honest', 'honestly', 'i must say', 'i have to admit', 'the truth is'];
    let transparencyCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      transparencyCount += transparencyPhrases.filter((phrase) => allText.includes(phrase)).length;
    });

    return Math.min(1, (transparencyCount / (responses.length * 0.2)) + 0.5);
  }

  private analyzeSecurityLanguage(responses: ResponsePair[]): number {
    const securityWords = ['safe', 'secure', 'comfortable', 'protected', 'supported', 'stable'];
    let securityCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      securityCount += securityWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, securityCount / (responses.length * 0.4));
  }

  private analyzeGrowthLanguage(responses: ResponsePair[]): number {
    const growthWords = ['grow', 'learn', 'improve', 'better', 'develop', 'progress', 'evolve'];
    let growthCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      growthCount += growthWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, growthCount / (responses.length * 0.5));
  }

  private analyzeLearningIndicators(responses: ResponsePair[]): number {
    const learningWords = ['learn', 'understand', 'discover', 'realize', 'insight', 'knowledge'];
    let learningCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase;
      learningCount += learningWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, learningCount / (responses.length * 0.4));
  }

  private analyzeOpennessToChange(responses: ResponsePair[]): number {
    const changeWords = ['change', 'adapt', 'adjust', 'transform', 'shift', 'transition'];
    let changeCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      changeCount += changeWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, changeCount / (responses.length * 0.3));
  }

  private analyzeSelfImprovement(responses: ResponsePair[]): number {
    const improvementWords = ['work on', 'improve', 'self', 'personal development', 'better version', 'strive'];
    let improvementCount = 0;

    responses.forEach((pair) => {
      const allText = `${pair.userResponse} ${pair.partnerResponse}`.toLowerCase();
      improvementCount += improvementWords.filter((word) => allText.includes(word)).length;
    });

    return Math.min(1, improvementCount / (responses.length * 0.3));
  }

  private analyzeResponseTimeliness(responses: ResponsePair[]): number {
    // Analyze response timing based on response length and depth
    // Longer, more thoughtful responses indicate engagement
    let timelinessScore = 0;
    
    responses.forEach((pair) => {
      const userLength = pair.userResponse.length;
      const partnerLength = pair.partnerResponse.length;
      
      // Responses between 50-500 characters are considered optimal
      const userTimeliness = userLength >= 50 && userLength <= 500 ? 1 : userLength > 500 ? 0.8 : 0.5;
      const partnerTimeliness = partnerLength >= 50 && partnerLength <= 500 ? 1 : partnerLength > 500 ? 0.8 : 0.5;
      
      timelinessScore += (userTimeliness + partnerTimeliness) / 2;
    });

    return responses.length > 0 ? timelinessScore / responses.length : 0.7;
  }

  private extractKeywords(text: string, keywords: string[]): string[] {
    const lowerText = text.toLowerCase();
    return keywords.filter(keyword => lowerText.includes(keyword.toLowerCase()));
  }
}

export const compatibilityScoringService = CompatibilityScoringService.getInstance();

