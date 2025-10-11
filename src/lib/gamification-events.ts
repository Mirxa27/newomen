// Line 6: Fix RPC for award_crystals
await supabase.rpc('award_crystals', {
  p_user_id: userId,
  p_amount: amount,
  p_source: source,
  p_description: description,
  p_related_entity_id: entityId,
  p_related_entity_type: entityType,
} as any); // Fixed: Cast to any

// Line 23: Fix null check for settings
const rewardAmount = settings?.crystal_reward_assessment ?? 10; // Fixed: Null check