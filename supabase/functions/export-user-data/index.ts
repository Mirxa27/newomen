import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};

const tablesToExport = [
  'user_profiles',
  'assessment_attempts',
  'community_posts',
  'community_post_comments',
  'community_post_likes',
  'couples_challenges',
  'couples_challenge_responses',
  'daily_affirmations',
  'diary_entries',
  'habit_trackers',
  'habit_tracker_entries',
  'meditation_progress',
  'newme_conversations',
  'newme_messages',
  'newme_user_memories',
  'subscriptions',
  'subscription_transactions',
  'user_achievements',
  'user_affirmation_settings',
  'user_resource_progress',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const exportData: Record<string, unknown[]> = {};

    for (const table of tablesToExport) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.warn(`Could not export from table ${table}:`, error.message);
      } else {
        exportData[table] = data;
      }
    }

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error exporting user data:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
