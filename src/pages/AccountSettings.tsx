// Line 68: Fix update for subscriptions
await supabase
  .from('subscriptions')
  .update({ status: 'cancelled' } as TablesUpdate<'subscriptions'>) // Fixed: Use TablesUpdate
  .eq('id', subscriptionId);