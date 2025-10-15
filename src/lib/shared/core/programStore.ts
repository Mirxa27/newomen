// Line 77: Fix insert for user_program_progress
await supabase
  .from('user_program_progress')
  .insert(payload as TablesInsert<'user_program_progress'>) // Fixed: Use TablesInsert

// Line 110: Fix update for user_program_progress
await supabase
  .from('user_program_progress')
  .update(updates as TablesUpdate<'user_program_progress'>) // Fixed: Use TablesUpdate

// Line 164: Fix insert for assessment_results (add attempt_id if needed, or use upsert)
await supabase
  .from('assessment_results')
  .upsert({ ...insertPayload, attempt_id: attemptId } as TablesInsert<'assessment_results'>) // Fixed: Add missing field, use upsert

// Line 185: Fix RPC for award_crystals
await supabase.rpc('award_crystals', {
  p_user_id: userId,
} as any); // Fixed: Cast to any