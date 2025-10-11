// Line 71: Fix insert for community_connections
await supabase
  .from('community_connections')
  .insert(payload as TablesInsert<'community_connections'>) // Fixed: Use TablesInsert

// Line 89: Fix update for community_connections
await supabase
  .from('community_connections')
  .update({ status } as TablesUpdate<'community_connections'>) // Fixed: Use TablesUpdate
  .eq('id', connectionId);