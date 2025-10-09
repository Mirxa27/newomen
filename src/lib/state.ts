import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AssessmentsEnhanced, AssessmentAttempts, AssessmentResults } from '@/integrations/supabase/types';

interface AIAnalysisResult {
  overall_analysis: string;
  strengths_identified: string[];
  growth_areas: string[];
  ai_score: number;
  ai_feedback: string;
  recommendations: string[];
}

interface AssessmentState {
  // Current assessment data
  currentAssessment: AssessmentsEnhanced['Row'] | null;
  currentAttempt: AssessmentAttempts['Row'] | null;
  responses: Record<string, string>;
  aiAnalysis: AIAnalysisResult | null;
  isLoading: boolean;
  error: string | null;

  // Assessment progress tracking
  assessmentProgress: Record<string, {
    best_score: number;
    total_attempts: number;
    is_completed: boolean;
    completion_date: string | null;
    best_attempt_id: string | null;
  }>;

  // Actions
  setCurrentAssessment: (assessment: AssessmentsEnhanced['Row'] | null) => void;
  setCurrentAttempt: (attempt: AssessmentAttempts['Row'] | null) => void;
  setResponses: (responses: Record<string, string>) => void;
  updateResponse: (questionId: string, answer: string) => void;
  setAiAnalysis: (analysis: AIAnalysisResult | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAssessment: () => void;
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set) => ({
      currentAssessment: null,
      currentAttempt: null,
      responses: {},
  aiAnalysis: null,
  isLoading: false,
  error: null,

  setCurrentAssessment: (assessment) => set({ currentAssessment: assessment }),
  setCurrentAttempt: (attempt) => set({ currentAttempt: attempt }),
  setResponses: (responses) => set({ responses }),
  updateResponse: (questionId, answer) => 
    set((state) => ({
      responses: {
        ...state.responses,
        [questionId]: answer,
    }),
  setAiAnalysis: (analysis) => set({ aiAnalysis: analysis }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearAssessment: () => set({
      currentAssessment: null,
      currentAttempt: null,
      responses: {},
      aiAnalysis: null,
    }),
  clearAssessment: () => set({
      currentAssessment: null,
      currentAttempt: null,
      responses: {},
      aiAnalysis: null,
    }),
  }),
  {
    name: 'assessment-storage',
    partialize: (state) => ({
      assessmentProgress: state.assessmentProgress,
    })),
  }
);

// Helper function to calculate assessment progress
export const calculateProgress = (responses: Record<string, string>, totalQuestions: number): number => {
  if (totalQuestions === 0) return 0;
  return (Object.keys(responses).length / totalQuestions * 100;
};

// Hook to get current assessment progress
export const useAssessmentProgress = () => {
  const { assessmentProgress } = useAssessmentStore();
  return assessmentProgress;
};

// Hook to update assessment progress
export const updateAssessmentProgress = (assessmentId: string, score: number, isCompleted: boolean) => {
  const { assessmentProgress } = useAssessmentStore.getState();
  
  const currentProgress = assessmentProgress[assessmentId] || {
    best_score: 0,
    total_attempts: 0,
    is_completed: false,
    completion_date: null,
    best_attempt_id: null,
  };

  const isNewBestScore = !currentProgress || score > currentProgress.best_score;
  
  useAssessmentStore.setState({
    assessmentProgress: {
      ...assessmentProgress,
      [assessmentId]: {
      best_score: isNewBestScore ? score : currentProgress.best_score,
      total_attempts: (currentProgress?.total_attempts || 0) + 1,
      is_completed: isCompleted || currentProgress?.is_completed,
      completion_date: isCompleted && !currentProgress?.is_completed ? new Date().toISOString() : currentProgress?.completion_date,
      best_attempt_id: isNewBestScore ? useAssessmentStore.getState().currentAttempt?.id || currentProgress?.best_attempt_id,
    },
  });
};
