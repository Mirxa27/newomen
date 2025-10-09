// ==================================================================================
//
//  Newomen Platform: The Core Assessment & AI Prompt Library
//  Version: 1.0
//  Description: This file contains the complete, production-ready data for all
//               psychological assessments and the corresponding AI analysis prompts.
//
// ==================================================================================

// ----------------------------------------------------------------------------------
//  PART 1: TYPE DEFINITIONS (The Blueprint)
// ----------------------------------------------------------------------------------

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'single' | 'multiple' | 'scale' | 'text';
  options?: string[];
  scale?: { min: number; max: number; labels: [string, string] }; // [minLabel, maxLabel]
  category?: string;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  visibility: 'public' | 'users' | 'premium';
  estimatedTime: number;
  questions: AssessmentQuestion[];
}

export interface AIPrompt {
  id: string;
  systemPrompt: string;
}

// ----------------------------------------------------------------------------------
//  PART 2: THE ASSESSMENT DATA
// ----------------------------------------------------------------------------------

// ASSESSMENT 1: Personality Discovery
const personalityDiscoveryAssessment: Assessment = {
  id: 'personality-discovery',
  title: 'Personality Discovery',
  description: 'Journey deep into the architecture of your psyche. This isn\'t about labels; it\'s about understanding the unique operating system that governs how you think, feel, and act.',
  type: 'personality',
  category: 'self-discovery',
  visibility: 'public',
  estimatedTime: 8,
  questions: [
    { id: 'p1', text: 'In social situations, you tend to:', type: 'single', options: ['Initiate conversations with new people', 'Wait for others to approach you', 'Prefer small groups over large gatherings', 'Avoid social situations when possible'] },
    { id: 'p2', text: 'When making decisions, you primarily rely on:', type: 'single', options: ['Logic and objective analysis', 'Your gut feelings and intuition', 'Input from trusted friends/family', 'Practical considerations and past experiences'] },
    { id: 'p3', text: 'Your ideal weekend involves:', type: 'single', options: ['Adventure and new experiences', 'Relaxation and quiet time', 'Socializing with friends', 'Productive activities and learning'] },
    { id: 'p4', text: 'When faced with unexpected changes, you:', type: 'single', options: ['Embrace the change enthusiastically', 'Feel anxious but adapt quickly', 'Need time to process and adjust', 'Prefer to stick to original plans'] },
    { id: 'p5', text: 'In group projects, you naturally take on the role of:', type: 'single', options: ['The leader coordinating the team', 'The creative contributor generating ideas', 'The detail-oriented organizer', 'The supportive mediator between team members'] },
    { id: 'p6', text: 'When learning something new, you prefer to:', type: 'single', options: ['Read about it thoroughly first', 'Jump in and figure it out hands-on', 'Listen to explanations and ask questions', 'Watch others demonstrate and then copy'] },
    { id: 'p7', text: 'Your workspace is typically:', type: 'single', options: ['Highly organized and structured', 'Cluttered but you know where everything is', 'Minimalist and clean', 'Personalized with many personal touches'] },
    { id: 'p8', text: 'When giving feedback, you focus on:', type: 'single', options: ['Constructive criticism to improve performance', 'Encouragement and positive reinforcement', 'Fair and balanced assessment', 'Specific facts and evidence'] },
    { id: 'p9', text: 'In arguments, you react by:', type: 'single', options: ['Staying calm and addressing the issues logically', 'Becoming emotional and defending your position', 'Trying to understand the other viewpoint', 'Avoiding confrontation if possible'] },
    { id: 'p10', text: 'Your approach to planning is:', type: 'single', options: ['Detailed planning well in advance', 'Flexible planning with room for changes', 'Minimal planning, preferring spontaneity', 'Planning only the essential elements'] },
    { id: 'p11', text: 'Rate your comfort with uncertainty:', type: 'scale', scale: { min: 1, max: 5, labels: ['Very Uncomfortable', 'Very Comfortable'] } },
    { id: 'p12', text: 'When you complete a task, you feel most satisfied by:', type: 'single', options: ['The process and learning experience', 'Achieving the results and meeting goals', 'Helping others who benefit from your work', 'Creating something innovative or different'] },
    { id: 'p13', text: 'In your relationships, you tend to be:', type: 'single', options: ['Loyal and committed to long-term connections', 'Flexible and open to new friendships easily', 'Selective and careful about who you let in', 'Warm and inclusive with most people you meet'] },
    { id: 'p14', text: 'When faced with criticism, your first reaction is:', type: 'single', options: ['To defend yourself and explain your position', 'To feel hurt and withdraw for a time', 'To analyze what you might learn from it', 'To discuss it openly to understand all perspectives'] },
    { id: 'p15', text: 'Your attitude toward rules and procedures is:', type: 'single', options: ['I appreciate structure and clear guidelines', 'I often question rules and look for better ways', 'I follow rules when they make sense, bend them when they don\'t', 'I prefer freedom and dislike rigid procedures'] }
  ],
};

// ASSESSMENT 2: Decision-Making Style
const decisionMakingAssessment: Assessment = {
  id: 'decision-making-style',
  title: 'The Strategist\'s Compass: A Decision-Making Audit',
  description: 'Every choice you make shapes your destiny. We will dissect your decision-making algorithm to reveal your biases, strengths, and the hidden forces that guide your path.',
  type: 'cognitive',
  category: 'personal-development',
  visibility: 'public',
  estimatedTime: 6,
  questions: [
    { id: 'dm1', text: 'When faced with a major decision, your first step is usually:', type: 'single', options: ['Research all available information extensively', 'Trust your initial gut feeling or instinct', 'Discuss the options with trusted friends/family', 'Make a quick decision and adjust as needed'] },
    { id: 'dm2', text: 'When gathering information, you are most likely to:', type: 'single', options: ['Focus on data, facts, and logical analysis', 'Consider how the decision will affect various people', 'Seek quick, practical solutions that work', 'Explore creative alternatives and possibilities'] },
    { id: 'dm3', text: 'Your biggest decision-making challenge is:', type: 'single', options: ['Getting stuck in analysis paralysis', 'Making impulsive choices I later regret', 'Being overly influenced by others\' opinions', 'Putting off decisions as long as possible'] },
    { id: 'dm4', text: 'You feel most confident in a decision when:', type: 'single', options: ['You have thoroughly analyzed all the pros and cons', 'Your choice aligns with your core values and feelings', 'The decision is practical and immediately actionable', 'You have support from people you trust'] },
    { id: 'dm5', text: 'In group decisions, you typically play the role of:', type: 'single', options: ['The analyst who researches and presents facts', 'The mediator who considers everyone\'s feelings', 'The practical guide who moves things forward', 'The visionary who proposes innovative solutions'] },
    { id: 'dm6', text: 'After making a difficult decision, you most likely:', type: 'single', options: ['Second-guess yourself and analyze what you might have missed', 'Move forward confidently with your choice', 'Seek validation from others who support the decision', 'Feel immediately relieved and ready to proceed'] },
    { id: 'dm7', text: 'When unexpected obstacles arise, you tend to:', type: 'single', options: ['Re-evaluate and analyze the impact on your overall strategy', 'Communicate openly and seek support from others', 'Adapt quickly and find practical solutions', 'Stay committed to your original plan despite challenges'] },
    { id: 'dm8', text: 'Rate your comfort with making decisions under time pressure:', type: 'scale', scale: { min: 1, max: 5, labels: ['Panic', 'Thrive'] } },
    { id: 'dm9', text: 'You make your best decisions when you have:', type: 'single', options: ['Complete information and time to process it all', 'Input from others but the final call is yours', 'Clear criteria and practical constraints', 'Freedom to be creative and think outside the box'] },
    { id: 'dm10', text: 'When presented with too many choices, you tend to:', type: 'single', options: ['Analyze all options systematically to find the best one', 'Narrow it down quickly to avoid overwhelm', 'Seek advice to help choose between options', 'Feel energized and create new alternatives'] },
    { id: 'dm11', text: 'Your career decisions are most influenced by:', type: 'single', options: ['Career advancement and professional growth', 'Work-life balance and personal fulfillment', 'Practical financial and security considerations', 'Creativity and innovation opportunities'] },
    { id: 'dm12', text: 'Rate your satisfaction with your usual decision outcomes:', type: 'scale', scale: { min: 1, max: 5, labels: ['Often Regret', 'Usually Satisfied'] } },
    { id: 'dm13', text: 'When you learn from past decisions, you focus on:', type: 'single', options: ['Improvements to your analysis and research process', 'Better understanding of your emotions and intuition', 'More practical approaches and quicker implementation', 'Different approaches and creative alternatives'] }
  ],
};

// ASSESSMENT 3: Communication Style
const communicationAssessment: Assessment = {
  id: 'communication-style',
  title: 'The Diplomat\'s Toolkit: A Communication Audit',
  description: 'Your words build worlds or burn bridges. Uncover your unique communication style, learn to adapt to others, and master the art of connection.',
  type: 'communication',
  category: 'social-skills',
  visibility: 'public',
  estimatedTime: 7,
  questions: [
    { id: 'c1', text: 'When explaining something complex, you tend to:', type: 'single', options: ['Use lots of details and examples for clarity', 'Focus on the main points and big picture', 'Make it conversational and ask for questions', 'Use analogies and make it engaging'] },
    { id: 'c2', text: 'Your preferred way of handling difficult conversations is:', type: 'single', options: ['Direct and to the point to address the issue quickly', 'Gentle and empathetic to maintain relationships', 'Analytical, focusing on facts and solutions', 'Humorous or light-hearted to reduce tension'] },
    { id: 'c3', text: 'When you receive feedback, you are most likely to:', type: 'single', options: ['Ask for specific examples to understand better', 'Feel hurt but try to see the positive intent', 'Analyze how to apply it practically', 'Defend your perspective immediately'] },
    { id: 'c4', text: 'In group discussions, your typical contribution is:', type: 'single', options: ['Detailed analysis and well-thought-out opinions', 'Building consensus and including everyone\'s view', 'Practical advice and solutions', 'Creative ideas and different perspectives'] },
    { id: 'c5', text: 'When someone is upset, your communication focus is on:', type: 'single', options: ['Understanding the facts of what happened', 'Empathizing with their feelings and emotions', 'Finding practical solutions to resolve it', 'Lightening the mood and changing the subject'] },
    { id: 'c6', text: 'Rate how comfortable you are with public speaking:', type: 'scale', scale: { min: 1, max: 5, labels: ['Avoid at all costs', 'Enjoy when prepared'] } },
    { id: 'c7', text: 'Your writing style in emails and messages tends to be:', type: 'single', options: ['Comprehensive and detailed with all necessary information', 'Warm and personable with emojis and friendly language', 'Direct and concise with clear action items', 'Creative and engaging with unique expressions'] },
    { id: 'c8', text: 'When you disagree with someone, you typically:', type: 'single', options: ['Present logical evidence to support your view', 'Try to see their perspective and find common ground', 'Suggest practical compromises that work for both', 'Use humor or lighten the mood to reduce tension'] },
    { id: 'c9', text: 'Your listening style is best described as:', type: 'single', options: ['Active listener who asks clarifying questions and summarizes', 'Empathetic listener who focuses on understanding feelings', 'Attentive listener who looks for key points and next steps', 'Reflective listener who connects to their own experiences'] },
    { id: 'c10', text: 'In professional settings, you communicate to:', type: 'single', options: ['Demonstrate expertise and provide thoughtful analysis', 'Build rapport and create positive work relationships', 'Achieve results and advance towards goals', 'Innovate and share creative ideas and solutions'] },
    { id: 'c11', text: 'Rate your overall confidence in expressing your thoughts:', type: 'scale', scale: { min: 1, max: 5, labels: ['Rarely express opinions', 'Very confident'] } }
  ],
};

// ASSESSMENT 4: Life Balance Assessment
const lifeBalanceAssessment: Assessment = {
  id: 'life-balance',
  title: 'Life Balance Wheel',
  description: 'Examine the different areas of your life to identify where you\'re thriving and where you need more attention. Create a personalized plan for holistic well-being.',
  type: 'balance',
  category: 'wellness',
  visibility: 'public',
  estimatedTime: 10,
  questions: [
    { id: 'lb1', text: 'Rate your satisfaction with your career/professional development:', type: 'scale', scale: { min: 1, max: 10, labels: ['Very Dissatisfied', 'Very Satisfied'] } },
    { id: 'lb2', text: 'Rate your satisfaction with your relationships (family, friends, romantic):', type: 'scale', scale: { min: 1, max: 10, labels: ['Very Dissatisfied', 'Very Satisfied'] } },
    { id: 'lb3', text: 'Rate your satisfaction with your physical health and fitness:', type: 'scale', scale: { min: 1, max: 10, labels: ['Very Dissatisfied', 'Very Satisfied'] } },
    { id: 'lb4', text: 'Rate your satisfaction with your financial situation:', type: 'scale', scale: { min: 1, max: 10, labels: ['Very Dissatisfied', 'Very Satisfied'] } },
    { id: 'lb5', text: 'Rate your satisfaction with your personal growth and learning:', type: 'scale', scale: { min: 1, max: 10, labels: ['Very Dissatisfied', 'Very Satisfied'] } },
    { id: 'lb6', text: 'Rate your satisfaction with your home environment:', type: 'scale', scale: { min: 1, max: 10, labels: ['Very Dissatisfied', 'Very Satisfied'] } },
    { id: 'lb7', text: 'Rate your satisfaction with your spiritual/meaningful life:', type: 'scale', scale: { min: 1, max: 10, labels: ['Very Dissatisfied', 'Very Satisfied'] } },
    { id: 'lb8', text: 'Rate your satisfaction with your recreation and fun activities:', type: 'scale', scale: { min: 1, max: 10, labels: ['Very Dissatisfied', 'Very Satisfied'] } },
    { id: 'lb9', text: 'Rate your satisfaction with your community involvement:', type: 'scale', scale: { min: 1, max: 10, labels: ['Very Dissatisfied', 'Very Satisfied'] } },
    { id: 'lb10', text: 'Rate your overall life satisfaction:', type: 'scale', scale: { min: 1, max: 10, labels: ['Very Dissatisfied', 'Very Satisfied'] } }
  ],
};

// ASSESSMENT 5: Relationship Assessment
const relationshipAssessment: Assessment = {
  id: 'relationship-style',
  title: 'Relationship Dynamics Explorer',
  description: 'Understand how you show up in relationships, what you need from others, and how to build deeper, more authentic connections.',
  type: 'relationships',
  category: 'social-skills',
  visibility: 'public',
  estimatedTime: 9,
  questions: [
    { id: 'r1', text: 'When you first meet someone, you tend to:', type: 'single', options: ['Be very open and share personal information', 'Be cautious and observe before opening up', 'Ask lots of questions to learn about them', 'Keep things light and surface-level'] },
    { id: 'r2', text: 'In friendships, you value most:', type: 'single', options: ['Loyalty and long-term commitment', 'Shared interests and activities', 'Emotional support and deep conversations', 'Fun and adventure together'] },
    { id: 'r3', text: 'When a friend is going through a hard time, you:', type: 'single', options: ['Offer practical help and solutions', 'Listen empathetically without trying to fix it', 'Share similar experiences you\'ve had', 'Encourage them to see the positive side'] },
    { id: 'r4', text: 'Your biggest challenge in relationships is:', type: 'single', options: ['Being too trusting too quickly', 'Being too guarded and slow to open up', 'Needing a lot of reassurance and validation', 'Struggling to express your needs clearly'] },
    { id: 'r5', text: 'You feel most loved when someone:', type: 'single', options: ['Spends quality time with you', 'Gives you thoughtful gifts or compliments', 'Shows physical affection and touch', 'Does helpful acts of service for you'] },
    { id: 'r6', text: 'In conflicts with loved ones, you tend to:', type: 'single', options: ['Address issues directly and honestly', 'Avoid confrontation to keep the peace', 'Try to understand their perspective first', 'Use humor to diffuse tension'] },
    { id: 'r7', text: 'Your communication style with close friends is:', type: 'single', options: ['Very direct and straightforward', 'Gentle and considerate of their feelings', 'Playful and humorous', 'Thoughtful and reflective'] },
    { id: 'r8', text: 'When making plans with others, you prefer:', type: 'single', options: ['Spontaneous plans that happen naturally', 'Detailed planning well in advance', 'Flexible plans that can be adjusted', 'Letting others take the lead on planning'] },
    { id: 'r9', text: 'Rate your comfort with expressing vulnerability:', type: 'scale', scale: { min: 1, max: 5, labels: ['Very Uncomfortable', 'Very Comfortable'] } },
    { id: 'r10', text: 'In your closest relationships, you are most afraid of:', type: 'single', options: ['Being abandoned or rejected', 'Losing your independence', 'Not being good enough for them', 'Being too much for them to handle'] }
  ],
};

// ASSESSMENT 6: Stress Assessment
const stressAssessment: Assessment = {
  id: 'stress-management',
  title: 'Stress Response Profile',
  description: 'Identify your unique stress patterns and discover personalized strategies to build resilience and inner peace.',
  type: 'stress',
  category: 'wellness',
  visibility: 'public',
  estimatedTime: 8,
  questions: [
    { id: 's1', text: 'When you feel stressed, your body typically responds with:', type: 'multiple', options: ['Muscle tension or headaches', 'Digestive issues or stomach problems', 'Racing heart or difficulty breathing', 'Fatigue or trouble sleeping', 'Skin issues or sweating'] },
    { id: 's2', text: 'Your stress is most often triggered by:', type: 'single', options: ['Work deadlines and pressure', 'Relationship conflicts', 'Financial concerns', 'Health issues or uncertainty', 'Feeling overwhelmed by daily tasks'] },
    { id: 's3', text: 'When stressed, you tend to:', type: 'single', options: ['Become more organized and focused', 'Withdraw and isolate yourself', 'Seek comfort from others', 'Try to distract yourself with activities'] },
    { id: 's4', text: 'Your typical coping mechanism is:', type: 'single', options: ['Exercise or physical activity', 'Talking it out with someone', 'Analyzing the situation logically', 'Engaging in hobbies or entertainment'] },
    { id: 's5', text: 'Rate how well you manage stress on a daily basis:', type: 'scale', scale: { min: 1, max: 5, labels: ['Poorly', 'Very Well'] } },
    { id: 's6', text: 'When you\'re stressed, your thoughts tend to:', type: 'single', options: ['Race and feel scattered', 'Focus intensely on finding solutions', 'Become self-critical and negative', 'Feel paralyzed and unable to think clearly'] },
    { id: 's7', text: 'You recover from stressful situations by:', type: 'single', options: ['Taking time alone to process and recharge', 'Talking through it with trusted people', 'Diving into work or productive activities', 'Engaging in relaxation techniques or meditation'] },
    { id: 's8', text: 'Your biggest stress management challenge is:', type: 'single', options: ['Recognizing when you\'re stressed', 'Finding effective coping strategies', 'Making time for self-care', 'Letting go of things you can\'t control'] },
    { id: 's9', text: 'Rate your overall resilience to stress:', type: 'scale', scale: { min: 1, max: 5, labels: ['Low', 'High'] } },
    { id: 's10', text: 'When you\'re stressed, you most need:', type: 'single', options: ['Clear solutions and action steps', 'Empathetic understanding and support', 'Time alone to process', 'Distraction and positive experiences'] }
  ],
};

// ----------------------------------------------------------------------------------
//  PART 3: THE AI BRAINS (The Master Analysis Prompts)
// ----------------------------------------------------------------------------------

// AI BRAIN 1: Personality Discovery
const personalityDiscoveryPrompt: AIPrompt = {
  id: 'personality-discovery',
  systemPrompt: `
You are NewMe, a master psychoanalyst with deep insight into the architecture of personality. A user has just completed the "Personality Discovery" assessment. Their answers are below, mapping question IDs to their chosen option:
---
{{user_responses}}
---
Your task is to perform a deep, multi-layered analysis and generate a report in a structured JSON format. Do not be generic. Synthesize their specific answers to create a cohesive and insightful narrative.

The JSON must have the following keys: "archetype", "coreDynamics", "hiddenPotential", "growthEdge", "finalInsight".

1.  **archetype**: Based on a holistic view of their answers, assign them a compelling, non-cliche archetype. Examples: "The Intuitive Architect," "The Pragmatic Diplomat," "The Spontaneous Innovator." Provide a one-sentence summary of this archetype.
2.  **coreDynamics**: Analyze the interplay between their answers. Identify 2-3 key dynamics or paradoxes in their personality.
    *   Example: "Your answers reveal a fascinating tension between a highly logical decision-making process (p2) and a deep desire for spontaneity (p10). This suggests you are a 'Structured Improviser,' someone who builds a solid foundation specifically so they have the freedom to play."
3.  **hiddenPotential**: Based on their traits, identify a powerful potential they may not be fully utilizing.
    *   Example: "Your combination of creative contribution (p5) and hands-on learning (p6) points to a powerful, latent talent for mentorship or teaching, where you can guide others through complex, practical skills."
4.  **growthEdge**: Identify the most significant area for their growth. This should be a challenging but compassionate insight.
    *   Example: "Your discomfort with uncertainty (p11) combined with a preference for avoiding confrontation (p9) is your growth edge. Embracing controlled risks and learning to voice dissent constructively will unlock a new level of leadership and personal power."
5.  **finalInsight**: A final, powerful, one-sentence summary that will stick with the user.
    *   Example: "You are not just one thing; you are a complex system designed for a specific purpose. Your task is not to change who you are, but to master the unique instrument you've been given."
`
};

// AI BRAIN 2: Decision-Making Style
const decisionMakingPrompt: AIPrompt = {
  id: 'decision-making-style',
  systemPrompt: `
You are NewMe, a master strategist and cognitive scientist. A user has just completed "The Strategist's Compass," an audit of their decision-making style. Their answers are below:
---
{{user_responses}}
---
Your task is to dissect their decision-making algorithm and provide a brutally honest and highly logical analysis. Generate a report in a structured JSON format with the following keys: "decisionProfile", "dominantBias", "strategicBlindspot", "actionableUpgrades", "finalVerdict".

1.  **decisionProfile**: Synthesize their answers to assign them a specific decision-making profile. Examples: "The Data-Driven Maximizer," "The Intuitive Satisficer," "The Collaborative Harmonizer." Provide a one-sentence summary.
2.  **dominantBias**: Based on their answers (especially dm3, dm6, dm10), identify their most likely and costly cognitive bias in decision-making. Examples: "Analysis Paralysis," "Action Bias," "Social Proof Bias." Explain how their answers point to this.
    *   Example: "Your tendency to research extensively (dm1) and second-guess yourself (dm6) strongly indicates a vulnerability to 'Analysis Paralalysis.' You risk missing opportunities while searching for a perfect, risk-free answer that does not exist."
3.  **strategicBlindspot**: What critical element do they likely neglect in their process?
    *   Example: "Your focus on data and logic (dm2) combined with a desire for practical solutions (dm4) reveals a strategic blindspot: the second-order consequences of your decisions on team morale and human dynamics. You optimize for the machine, but forget the people operating it."
4.  **actionableUpgrades**: Provide 2-3 hard, specific, and actionable techniques to upgrade their process.
    *   Example: "1. Implement the '10/10/10 Rule': How will this decision feel in 10 minutes, 10 months, and 10 years? This forces long-term thinking. 2. Appoint a 'Devil's Advocate': Actively seek out one person to argue against your preferred choice to stress-test your logic."
5.  **finalVerdict**: A final, powerful, one-sentence takeaway.
    *   Example: "A good decision is not one that is perfect; it is one that is made with clarity and committed to with courage."
`
};

// AI BRAIN 3: Communication Style
const communicationPrompt: AIPrompt = {
  id: 'communication-style',
  systemPrompt: `
You are NewMe, a master of interpersonal dynamics and communication theory. A user has just completed "The Diplomat's Toolkit," an audit of their communication style. Their answers are below:
---
{{user_responses}}
---
Your task is to analyze their communication patterns and provide a deep, actionable report. Generate a report in a structured JSON format with the following keys: "communicationArchetype", "primaryMode", "conflictStance", "growthVector", "finalMantra".

1.  **communicationArchetype**: Based on their answers, assign them a communication archetype. Examples: "The Empathetic Harmonizer," "The Analytical Architect," "The Expressive Catalyst," "The Pragmatic Driver." Provide a one-sentence summary.
2.  **primaryMode**: Identify their default mode of communication (e.g., "Information Transfer," "Emotional Connection," "Problem Solving," "Inspiration"). Explain how their answers (c1, c5, c10) reveal this.
3.  **conflictStance**: Analyze their approach to conflict and difficult conversations (c2, c8). Is it "Conflict-Averse," "Solution-Focused," "Relationally-Oriented," or "Assertive-Logical"?
4.  **growthVector**: Identify the single most impactful skill for them to develop. This is their vector for growth.
    *   Example: "Your strength is in empathetic listening (c9) and building consensus (c4). Your growth vector is 'Constructive Confrontation.' Learning to state your needs directly, even when it risks temporary disharmony, will make your relationships more honest and resilient."
5.  **finalMantra**: A final, powerful, one-sentence mantra to guide their communication.
    *   Example: "Speak your truth with clarity, but listen to theirs with compassion."
`
};

// AI BRAIN 4: Life Balance
const lifeBalancePrompt: AIPrompt = {
  id: 'life-balance',
  systemPrompt: `
You are NewMe, a holistic wellness guide and life design expert. A user has just completed the "Life Balance Wheel" assessment. Their ratings are below:
---
{{user_responses}}
---
Your task is to analyze their life balance scores and provide compassionate, actionable insights. Generate a report in a structured JSON format with the following keys: "balanceProfile", "strengthAreas", "neglectAreas", "integrationStrategy", "wellnessMantra".

1.  **balanceProfile**: Based on their scores, assign them a balance profile. Examples: "The Renaissance Soul," "The Focused Specialist," "The Harmonious Integrator," "The Restless Explorer." Provide a one-sentence summary.
2.  **strengthAreas**: Identify 2-3 areas where they score highest (8+). These are their natural strengths and sources of energy.
3.  **neglectAreas**: Identify 2-3 areas where they score lowest (≤5). These are areas needing attention and investment.
4.  **integrationStrategy**: Provide a specific, actionable plan to integrate their life areas better.
5.  **wellnessMantra**: A final, empowering mantra for their wellness journey.
`
};

// AI BRAIN 5: Relationship Style
const relationshipPrompt: AIPrompt = {
  id: 'relationship-style',
  systemPrompt: `
You are NewMe, a relationship expert and attachment theory specialist. A user has just completed the "Relationship Dynamics Explorer." Their answers are below:
---
{{user_responses}}
---
Your task is to analyze their relationship patterns and provide deep, relational insights. Generate a report in a structured JSON format with the following keys: "attachmentStyle", "relationshipNeeds", "communicationPattern", "growthOpportunity", "relationshipWisdom".

1.  **attachmentStyle**: Based on their answers, identify their attachment style. Examples: "Secure Connector," "Anxious Explorer," "Avoidant Guardian," "Disorganized Seeker."
2.  **relationshipNeeds**: What do they most need in relationships to feel safe and loved?
3.  **communicationPattern**: How do they typically communicate in relationships?
4.  **growthOpportunity**: The most important relational skill for them to develop.
5.  **relationshipWisdom**: A final insight about their relational journey.
`
};

// AI BRAIN 6: Stress Management
const stressPrompt: AIPrompt = {
  id: 'stress-management',
  systemPrompt: `
You are NewMe, a stress management expert and resilience coach. A user has just completed the "Stress Response Profile." Their answers are below:
---
{{user_responses}}
---
Your task is to analyze their stress patterns and provide personalized resilience strategies. Generate a report in a structured JSON format with the following keys: "stressProfile", "primaryTriggers", "copingStrengths", "resilienceGaps", "stressMastery".

1.  **stressProfile**: Assign them a stress profile based on their responses.
2.  **primaryTriggers**: Identify their main stress triggers.
3.  **copingStrengths**: What coping mechanisms serve them well?
4.  **resilienceGaps**: Where do they need to build more resilience?
5.  **stressMastery**: Provide specific techniques for stress mastery.
`
};

// ----------------------------------------------------------------------------------
//  PART 4: THE "DATABASE" EXPORT
// ----------------------------------------------------------------------------------

export const assessmentDB = {
  assessments: {
    'personality-discovery': personalityDiscoveryAssessment,
    'decision-making-style': decisionMakingAssessment,
    'communication-style': communicationAssessment,
    'life-balance': lifeBalanceAssessment,
    'relationship-style': relationshipAssessment,
    'stress-management': stressAssessment,
  },
  prompts: {
    'personality-discovery': personalityDiscoveryPrompt,
    'decision-making-style': decisionMakingPrompt,
    'communication-style': communicationPrompt,
    'life-balance': lifeBalancePrompt,
    'relationship-style': relationshipPrompt,
    'stress-management': stressPrompt,
  }
};

export type AssessmentId = keyof typeof assessmentDB.assessments;
