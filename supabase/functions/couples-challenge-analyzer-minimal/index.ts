import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Minimal analyzer called');
    
    const { challengeId } = await req.json();
    console.log('Challenge ID:', challengeId);

    if (!challengeId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Challenge ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test API key retrieval
    console.log('Testing API key retrieval...');
    const { data: zaiApiKey, error: keyError } = await supabase.rpc('get_provider_api_key_by_type', { p_provider_type: 'zai' });
    
    if (keyError) {
      console.error('API key error:', keyError);
      return new Response(
        JSON.stringify({ success: false, error: `API key error: ${keyError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!zaiApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Z.AI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('API key retrieved successfully');

    // Get challenge data
    console.log('Fetching challenge data...');
    const { data: challenge, error: challengeError } = await supabase
      .from('couples_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError) {
      console.error('Challenge fetch error:', challengeError);
      return new Response(
        JSON.stringify({ success: false, error: `Challenge not found: ${challengeError.message}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!challenge) {
      return new Response(
        JSON.stringify({ success: false, error: 'Challenge not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Challenge found:', {
      id: challenge.id,
      status: challenge.status,
      messages_count: challenge.messages?.length || 0,
      current_question_index: challenge.current_question_index
    });

    // Check if challenge is ready for analysis
    const messages = challenge.messages || [];
    const questionSet = challenge.question_set;
    const questions = Array.isArray(questionSet?.questions) 
      ? questionSet.questions 
      : (questionSet?.questions ? JSON.parse(questionSet.questions as string) : []);

    console.log('Questions:', questions.length);
    console.log('Current question index:', challenge.current_question_index);

    // Check if all questions have been answered by both partners
    const userMessages = messages.filter(m => m.sender === 'user');
    const partnerMessages = messages.filter(m => m.sender === 'partner');
    
    console.log('User messages:', userMessages.length);
    console.log('Partner messages:', partnerMessages.length);

    if (userMessages.length < questions.length || partnerMessages.length < questions.length) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Challenge not complete - not all questions answered by both partners',
          details: {
            questions_count: questions.length,
            user_responses: userMessages.length,
            partner_responses: partnerMessages.length
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Challenge is complete, creating analysis');

    // Create a mock analysis for testing
    const mockAnalysis = {
      challenge_title: challenge.question_set?.title || 'Couples Challenge',
      total_questions: challenge.question_set?.questions?.length || 0,
      questions_analyzed: 1,
      overall_alignment: 85,
      detailed_analyses: [{
        overall_analysis: 'Your responses show strong compatibility and mutual understanding.',
        individual_insights: {
          person_a: 'You demonstrate excellent communication skills and emotional intelligence.',
          person_b: 'You show great empathy and willingness to work together.'
        },
        alignment_score: 85,
        growth_opportunities: ['Continue building trust', 'Practice active listening'],
        conversation_starters: ['What makes you feel most loved?', 'How can we support each other better?'],
        strengths_as_couple: ['Strong communication', 'Mutual respect', 'Shared values']
      }],
      summary: 'Your relationship shows strong foundations with room for continued growth.',
      next_steps: ['Continue regular check-ins', 'Practice active listening'],
      strengths: ['Strong communication', 'Mutual respect', 'Shared values'],
      growth_opportunities: ['Continue building trust', 'Practice active listening'],
      provider: 'Z.AI GLM-4.6'
    };

    // Save analysis result
    console.log('Saving analysis...');
    const { error: updateError } = await supabase
      .from('couples_challenges')
      .update({
        ai_analysis: mockAnalysis,
        status: 'analyzed',
        updated_at: new Date().toISOString()
      })
      .eq('id', challengeId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to save analysis: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analysis saved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        analysis: mockAnalysis
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Minimal analyzer error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
