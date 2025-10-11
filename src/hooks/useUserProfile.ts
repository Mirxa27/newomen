// Line 50: Fix property access on user (nullable)
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  const userId = user.id; // Fixed: Access user.id safely
  // ... rest of code
}

// Line 52: Fix select query for achievements join
.select('*, achievements(*)') // Fixed: Use * for join, no custom schema needed
.eq('user_id', userId);

// Line 74: Fix update type and casting
const { data, error } = await supabase
  .from('user_profiles')
  .update(updates as TablesUpdate<'user_profiles'>) // Fixed: Use TablesUpdate
  .eq('id', profile.id)
  .single();