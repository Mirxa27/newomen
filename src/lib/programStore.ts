import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';

interface ProgramState {
  currentProgram: any;
  currentModule: any;
  currentLesson: any;
  userProgress: any;
  isLoading: boolean;
  error: string | null;
  startProgram: (programId: string) => Promise<void>;
  completeLesson: (lessonId: string) => Promise<void>;
  submitAssessment: (assessmentId: string, answers: Record<string, unknown>) => Promise<void>;
}

export const useProgramStore = create<ProgramState>((set, get) => ({
  currentProgram: null,
  currentModule: null,
  currentLesson: null,
  userProgress: null,
  isLoading: false,
  error: null,

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

      if (progressError && progressError.code !== 'PGRST116') { // Ignore "no rows found"
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
          })
          .select()
          .single();
        if (newProgressError) throw newProgressError;
        progress = newProgress;
      }

      set({
        currentProgram: programData,
        userProgress: progress,
        isLoading: false,
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
      .update({ completed_lessons })
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

    // This is a simplified version. In a real app, you'd call an AI service for analysis.
    const analysis = { summary: "Good effort!", score: 85 };

    const { error } = await supabase
      .from('user_assessment_results')
        .insert({
          user_id: user.id,
          assessment_id: assessmentId,
          answers,
          analysis,
          completed_at: new Date().toISOString(),
        } as TablesInsert<'user_assessment_results'>);

    if (error) {
      set({ error: error.message });
    } else {
      // Optionally, update program progress based on assessment
    }
  },
}));