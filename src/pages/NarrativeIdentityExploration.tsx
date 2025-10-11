// Line 122: Fix property access and null check
if (existingData && existingData.narrative_identity_data) { // Fixed: Null check
  let parsedData = typeof existingData.narrative_identity_data === 'string' 
    ? JSON.parse(existingData.narrative_identity_data) 
    : existingData.narrative_identity_data;
  // ... rest
}

// Line 125: Fix upsert for user_memory_profiles
await supabase
  .from('user_memory_profiles')
  .upsert({ 
    user_id: userId,
    narrative_identity_data: narrativeDataToSave as Json // Fixed: Cast to Json
  } as TablesInsert<'user_memory_profiles'>); // Fixed: Use TablesInsert for upsert