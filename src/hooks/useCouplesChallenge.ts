// Line 72: Fix insert for couples_challenges
await supabase
  .from('couples_challenges')
  .insert(payload as TablesInsert<'couples_challenges'>) // Fixed: Use TablesInsert

// Line 113: Fix update for couples_challenges
await supabase
  .from('couples_challenges')
  .update(updates as TablesUpdate<'couples_challenges'>) // Fixed: Use TablesUpdate

// Line 131: Fix update for couples_challenges (completed status)
await supabase
  .from('couples_challenges')
  .update({ status: 'completed' } as TablesUpdate<'couples_challenges'>) // Fixed: Use TablesUpdate
  .eq('id', challengeId);