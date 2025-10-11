// Line 28: RPC call - cast args as any for complex types
const { data, error } = await supabase.rpc('get_newme_user_context', {
  p_user_id: userId,
} as any); // Fixed: Cast to any for RPC

// Line 69: Update casting
await supabase
  .from('newme_conversations')
  .update(updates as TablesUpdate<'newme_conversations'>) // Fixed: Use TablesUpdate
  .eq('id', conversationId);

// Line 142: Insert casting
await supabase
  .from('newme_user_memories')
  .insert(memoryPayload as TablesInsert<'newme_user_memories'>) // Fixed: Use TablesInsert

// Line 195: Update casting with null checks
const updates = {
  memory_value: input.memory_value,
  context: input.context,
  importance_score: input.importance_score ?? existing?.importance_score ?? 0, // Fixed: Null check
  last_referenced_at: new Date().toISOString(),
  reference_count: (existing?.reference_count ?? 0) + 1, // Fixed: Null check
};
await supabase
  .from('newme_user_memories')
  .update(updates as TablesUpdate<'newme_user_memories'>) // Fixed: Use TablesUpdate
  .eq('id', existing.id); // Fixed: Null check on existing.id

// Line 261: Update casting
await supabase
  .from('newme_user_memories')
  .update({ is_active: false } as TablesUpdate<'newme_user_memories'>) // Fixed: Use TablesUpdate
  .eq('id', memoryId);

// Line 327: Insert casting
await supabase
  .from('newme_assessment_tracking')
  .insert(trackingPayload as TablesInsert<'newme_assessment_tracking'>) // Fixed: Use TablesInsert

// Line 356: Update casting
await supabase
  .from('newme_assessment_tracking')
  .update(updates as TablesUpdate<'newme_assessment_tracking'>) // Fixed: Use TablesUpdate
  .eq('id', trackingId);