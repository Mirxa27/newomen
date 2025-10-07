// This file now contains types specific to assessments, quizzes, and challenges.
// Generic AI types have been moved to src/services/ai/aiTypes.ts

export interface AssessmentAnswers {
  [questionId: string]: string | number | boolean | string[];
}

export interface QuizAnswers {
  [questionId: string]: string | number | boolean | string[];
}

export interface ProgressData {
  [key: string]: string | number | boolean | Date | object;
}

export interface AssessmentResponseData {
  raw_feedback: string;
  score: number;
  traits: string[];
  strengths: string[];
  improvements: string[];
}

export interface QuizResponseData {
  raw_feedback: string;
  score: number;
  explanations: string[];
}

export interface AssessmentSubmission {
  assessment_id: string;
  answers: AssessmentAnswers;
  user_id: string;
}

export interface QuizSubmission {
  quiz_id: string;
  answers: QuizAnswers;
  user_id: string;
  time_taken_seconds?: number;
}

export interface ChallengeSubmission {
  challenge_id: string;
  progress_data: ProgressData;
  user_id: string;
}