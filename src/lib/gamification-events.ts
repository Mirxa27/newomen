import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export async function trackWellnessResourceCompletion(userId: string, resourceId: string) {
  try {
    const { error } = await supabase.rpc('award_crystals', {
      p_user_id: userId,
      p_amount: 10, // Example amount
      p_source: 'wellness_resource',
      p_description: `Completed wellness resource`,
      p_related_entity_id: resourceId,
      p_related_entity_type: 'wellness_resource',
    });
    if (error) throw error;
    toast.success("You've earned 10 crystals!");
  } catch (e) {
    console.error("Error tracking wellness resource completion:", e);
  }
}

export async function trackAssessmentCompletion(userId: string, assessmentId: string) {
  try {
    const { error } = await supabase.rpc('award_crystals', {
      p_user_id: userId,
      p_amount: 25, // Example amount
      p_source: 'assessment_completion',
      p_description: `Completed an assessment`,
      p_related_entity_id: assessmentId,
      p_related_entity_type: 'assessment',
    });
    if (error) throw error;
    toast.success("You've earned 25 crystals!");
  } catch (e) {
    console.error("Error tracking assessment completion:", e);
  }
}