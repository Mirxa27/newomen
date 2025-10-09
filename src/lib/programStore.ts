import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export interface FinalReport {
  summary: string;
  strengths: string[];
  growthAreas: string[];
  recommendations: string[];
}

interface ProgramState {
  currentProgram: any;
  currentModule: any;
  currentLesson: any;
  userProgress: any;
  isLoading: boolean;
  error: string | null;
  activeProgram: any | null;
  currentQuestionIndex: number;
  finalReport: FinalReport | null;
  isAnalyzing: boolean;
  startProgram: (programId: string) => Promise<void>;
  completeLesson: (lessonId: string) => Promise<void>;
  submitAssessment: (assessmentId: string, answers: Record<string, unknown>) => Promise<void>;
  addAnswer: (answer: any) => void;
  completeProgram: () => void;
  quitProgram: () => void;
  generateAIReport: () => Promise<void>;
  resetReport: () => void;
}

export const useProgramStore = create<ProgramState>((set, get) => ({
  currentProgram: null,
  currentModule: null,
  currentLesson: null,
  userProgress: null,
  isLoading: false,
  error: null,
  activeProgram: null,
  currentQuestionIndex: 0,
  finalReport: null,
  isAnalyzing: false,

  startProgram: async (programId) => {
    set({ isLoading: true, error: null });
    try {
      const { data: programData, error: programError } = await supabase
        .from('learning_programs')
        .select('*, modules:learning_modules(*, lessons:learning_lessons(*))')
        .eq('id', programId)
        .single();

      if (programError) throw programError;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: progressData, error: progressError } = await supabase
        .from('user_program_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('program_id', programId)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }

      let progress = progressData;
      if (!progress) {
        const { data: newProgress, error: newProgressError } = await supabase
          .from('user_program_progress')
          .insert({
            user_id: user.id,
            program_id: programId,
            status: 'in-progress',
            completed_lessons: [],
          } as TablesInsert<'user_program_progress'>)
          .select()
          .single();
        if (newProgressError) throw newProgressError;
        progress = newProgress;
      }

      set({
        currentProgram: programData,
        userProgress: progress,
        isLoading: false,
        activeProgram: programData,
        currentQuestionIndex: 0,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  completeLesson: async (lessonId) => {
    const { userProgress } = get();
    if (!userProgress) return;

    const completed_lessons = [...(userProgress.completed_lessons || []), lessonId];

    const { data, error } = await supabase
      .from('user_program_progress')
      .update({ completed_lessons } as TablesUpdate<'user_program_progress'>)
      .eq('id', userProgress.id)
      .select()
      .single();

    if (error) {
      set({ error: error.message });
    } else {
      set({ userProgress: data });
    }
  },

  submitAssessment: async (assessmentId, answers) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ error: "User not authenticated" });
      return;
    }

    const analysis = { summary: "Good effort!", score: 85 };

    const { error } = await supabase
      .from('assessment_results')
      .insert({
        user_id: user.id,
        assessment_id: assessmentId,
        answers,
        ai_insights: analysis,
        raw_score: analysis.score,
        percentage_score: analysis.score,
        attempt_id: 'placeholder-attempt-id', // This should come from an attempt record
      } as TablesInsert<'assessment_results'>);

    if (error) {
      set({ error: error.message });
    }
  },

  addAnswer: (answer) => set(state => ({
    userProgress: {
      ...state.userProgress,
      answers: [...(state.userProgress?.answers || []), answer]
    },
    currentQuestionIndex: state.currentQuestionIndex + 1,
  })),
  completeProgram: () => set({ activeProgram: null, finalReport: { summary: 'Completed!', strengths: [], growthAreas: [], recommendations: [] } }),
  quitProgram: () => set({ activeProgram: null }),
  generateAIReport: async () => {
    set({ isAnalyzing: true });
    await new Promise(res => setTimeout(res, 1000));
    set({ isAnalyzing: false, finalReport: { summary: 'AI Generated Report', strengths: ['Good listener'], growthAreas: ['More detail'], recommendations: ['Practice more'] } });
  },
  resetReport: () => set({ finalReport: null }),
}));