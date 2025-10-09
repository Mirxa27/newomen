const sampleQuestions = [
  { question: "How do you typically respond to unexpected challenges?", options: ["Face them head-on", "Take time to reflect first", "Seek advice from others", "Avoid them initially"] },
  { question: "What motivates you most in your personal growth?", options: ["Achievement and success", "Helping others", "Learning new things", "Inner peace"] },
  { question: "How comfortable are you with uncertainty?", options: ["Very comfortable", "Somewhat comfortable", "Neutral", "Uncomfortable"] },
  { question: "When making important decisions, you rely on:", options: ["Logic and analysis", "Intuition and feelings", "Past experiences", "Others' advice"] },
  { question: "How do you define success?", options: ["Career achievements", "Relationships", "Personal growth", "Financial stability"] },
  { question: "What's your approach to self-improvement?", options: ["Structured and planned", "Spontaneous and flexible", "Balance of both", "As needed"] },
  { question: "How do you handle criticism?", options: ["See it as growth opportunity", "Feel initially hurt", "Analyze its validity", "Dismiss it"] },
  { question: "Your ideal state of being is:", options: ["Constantly learning", "At peace", "Making a difference", "Achieving goals"] },
  { question: "When facing obstacles, you:", options: ["Find alternative routes", "Push through harder", "Reassess your goals", "Seek support"] },
  { question: "What brings you the most fulfillment?", options: ["Personal achievements", "Helping others succeed", "Creating something new", "Inner growth"] }
];

export const memberAssessments = [
  {
    id: "deep-values",
    title: "Core Values Discovery",
    description: "Identify your fundamental values and life principles",
    category: "self-discovery",
    tier: "growth",
    questions: sampleQuestions
  },
  {
    id: "limiting-beliefs",
    title: "Limiting Beliefs Assessment",
    description: "Uncover beliefs that may be holding you back",
    category: "mindset",
    tier: "growth",
    questions: sampleQuestions
  },
  {
    id: "leadership-style",
    title: "Leadership Style Analysis",
    description: "Discover your natural leadership approach",
    category: "career",
    tier: "growth",
    questions: sampleQuestions
  },
  {
    id: "communication-patterns",
    title: "Communication Patterns",
    description: "Analyze how you communicate in different contexts",
    category: "relationships",
    tier: "growth",
    questions: sampleQuestions
  },
  {
    id: "attachment-style",
    title: "Attachment Style Assessment",
    description: "Understand your relationship attachment patterns",
    category: "relationships",
    tier: "transformation",
    questions: sampleQuestions
  },
  {
    id: "conflict-resolution",
    title: "Conflict Resolution Style",
    description: "Learn how you naturally handle conflicts",
    category: "relationships",
    tier: "growth",
    questions: sampleQuestions
  },
  {
    id: "decision-making",
    title: "Decision-Making Profile",
    description: "Understand your decision-making patterns",
    category: "personal-growth",
    tier: "growth",
    questions: sampleQuestions
  },
  {
    id: "growth-mindset",
    title: "Growth vs Fixed Mindset",
    description: "Assess your mindset orientation",
    category: "mindset",
    tier: "growth",
    questions: sampleQuestions
  },
  {
    id: "burnout-risk",
    title: "Burnout Risk Assessment",
    description: "Evaluate your current burnout risk level",
    category: "wellness",
    tier: "growth",
    questions: sampleQuestions
  },
  {
    id: "time-management",
    title: "Time Management Audit",
    description: "Analyze how effectively you manage your time",
    category: "productivity",
    tier: "growth",
    questions: sampleQuestions
  },
  {
    id: "financial-mindset",
    title: "Financial Mindset Assessment",
    description: "Explore your relationship with money",
    category: "finance",
    tier: "transformation",
    questions: sampleQuestions
  },
  {
    id: "creativity-index",
    title: "Creativity & Innovation Index",
    description: "Measure your creative thinking abilities",
    category: "personal-growth",
    tier: "growth",
    questions: sampleQuestions
  },
  {
    id: "assertiveness",
    title: "Assertiveness Assessment",
    description: "Evaluate your assertiveness in different situations",
    category: "communication",
    tier: "growth",
    questions: sampleQuestions
  },
  {
    id: "life-purpose",
    title: "Life Purpose Exploration",
    description: "Deep dive into your life's meaning and purpose",
    category: "self-discovery",
    tier: "transformation",
    questions: sampleQuestions
  },
  {
    id: "cognitive-flexibility",
    title: "Cognitive Flexibility Test",
    description: "Assess your mental adaptability",
    category: "mindset",
    tier: "transformation",
    questions: sampleQuestions
  },
  {
    id: "emotional-regulation",
    title: "Emotional Regulation Skills",
    description: "Evaluate your emotion management abilities",
    category: "emotional-health",
    tier: "transformation",
    questions: sampleQuestions
  },
  {
    id: "social-intelligence",
    title: "Social Intelligence Assessment",
    description: "Measure your social awareness and skills",
    category: "relationships",
    tier: "transformation",
    questions: sampleQuestions
  },
  {
    id: "future-self",
    title: "Future Self Vision",
    description: "Clarify your vision for your future",
    category: "goal-setting",
    tier: "transformation",
    questions: sampleQuestions
  },
  {
    id: "resilience-depth",
    title: "Deep Resilience Assessment",
    description: "Comprehensive analysis of your resilience factors",
    category: "wellness",
    tier: "transformation",
    questions: sampleQuestions
  },
  {
    id: "narrative-identity",
    title: "Narrative Identity Exploration",
    description: "Explore the story you tell about yourself",
    category: "self-discovery",
    tier: "transformation",
    questions: sampleQuestions
  }
];