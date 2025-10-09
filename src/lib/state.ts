import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Tables } from '@/integrations/supabase/types';

// Define types for the store
type Assessment = Tables<'assessments_enhanced'>;
type Attempt = Tables<'assessment_attempts'>;
type Analysis = { [key: string]: any };
type Responses = { [key: string]: string };

// Define the state shape
interface AssessmentState {
  currentAssessment: Assessment | null;
  currentAttempt: Attempt | null;
  responses: Responses;
  aiAnalysis: Analysis | null;
  isLoading: boolean;
  error: string | null;
  assessmentProgress: {
    [assessmentId: string]: {
      score: number;
      is_completed: boolean;
      last_attempt_at: string;
      total_attempts: number;
      best_score: number;
      completion_date: string | null;
      best_attempt_id: string | null;
    };
  };
}

// Define the actions
interface AssessmentActions {
  setCurrentAssessment: (assessment: Assessment) => void;
  setCurrentAttempt: (attempt: Attempt) => void;
  setResponses: (responses: Responses) => void;
  updateResponse: (questionId: string, answer: string) => void;
  setAiAnalysis: (analysis: Analysis) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAssessment: () => void;
  updateAssessmentProgress: (assessmentId: string, score: number, isCompleted: boolean) => void;
}

// Initial state
const initialState: AssessmentState = {
  currentAssessment: null,
  currentAttempt: null,
  responses: {},
  aiAnalysis: null,
  isLoading: false,
  error: null,
  assessmentProgress: {},
};

// Create the store with persist middleware
export const useAssessmentStore = create<AssessmentState & AssessmentActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      setCurrentAssessment: (assessment) => set({ currentAssessment: assessment }),
      setCurrentAttempt: (attempt) => set({ currentAttempt: attempt }),
      setResponses: (responses) => set({ responses }),
      updateResponse: (questionId, answer) =>
        set((state) => ({
          responses: {
            ...state.responses,
            [questionId]: answer,
          },
        })),
      setAiAnalysis: (analysis) => set({ aiAnalysis: analysis }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearAssessment: () => set({
        currentAssessment: null,
        currentAttempt: null,
        responses: {},
        aiAnalysis: null,
        isLoading: false,
        error: null,
      }),
      updateAssessmentProgress: (assessmentId, score, isCompleted) => {
        const currentProgress = get().assessmentProgress[assessmentId];
        const isNewBestScore = !currentProgress || score > currentProgress.best_score;

        set((state) => ({
          assessmentProgress: {
            ...state.assessmentProgress,
            [assessmentId]: {
              ...currentProgress,
              score,
              is_completed: isCompleted || currentProgress?.is_completed || false,
              last_attempt_at: new Date().toISOString(),
              total_attempts: (currentProgress?.total_attempts || 0) + 1,
              best_score: isNewBestScore ? score : currentProgress.best_score,
              completion_date: isCompleted && !currentProgress?.is_completed ? new Date().toISOString() : currentProgress?.completion_date,
              best_attempt_id: isNewBestScore ? (get().currentAttempt?.id || currentProgress?.best_attempt_id) : currentProgress?.best_attempt_id,
            },
          },
        }));
      },
    }),
    {
      name: 'assessment-storage',
      partialize: (state) => ({
        assessmentProgress: state.assessmentProgress,
      }),
    }
  )
);

// Selector hooks for convenience
export const useAssessmentProgress = () => {
  return useAssessmentStore((state) => state.assessmentProgress);
};