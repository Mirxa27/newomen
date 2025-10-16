import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"; // not used here

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { topic, type, isPublic, context } = await req.json();

    if (!topic || !type) {
      return new Response(JSON.stringify({ error: 'topic and type are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const schemaByType: Record<string, string> = {
      assessment: `{
        "title": string,
        "description": string,
        "estimatedDuration": number,
        "difficulty": "beginner" | "intermediate" | "advanced",
        "tags": string[],
        "category": string,
        "questions": Array<{
          "question": string,
          "type": "multiple_choice" | "text" | "scale" | "yes_no",
          "options"?: string[],
          "required": boolean,
          "order": number
        }>
      }`,
      wellness_resource: `{
        "title": string,
        "description": string,
        "content": string,
        "type": "article" | "exercise" | "meditation" | "journal_prompt",
        "category": string,
        "estimatedDuration": number,
        "difficulty": "beginner" | "intermediate" | "advanced",
        "tags": string[]
      }`,
      couples_challenge: `{
        "title": string,
        "description": string,
        "estimatedDuration": number,
        "difficulty": "beginner" | "intermediate" | "advanced",
        "category": string,
        "tags": string[],
        "questions": Array<{
          "question": string,
          "type": "discussion" | "activity" | "reflection" | "game",
          "instructions"?: string,
          "estimatedTime": number,
          "order": number
        }>
      }`
    };

    const schema = schemaByType[type];
    if (!schema) {
      return new Response(JSON.stringify({ error: 'Unsupported type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sysPrompt = `You generate structured JSON content only. Do not include markdown. Validate that all required fields are present and coherent. Output a single JSON object conforming exactly to this TypeScript-like schema: ${schema}`;

    const userPrompt = `Topic: ${topic}\nType: ${type}\nPublic: ${Boolean(isPublic)}\nContext: ${context || ''}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: 'OpenAI error', details: errText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content || '{}';

    let parsed: unknown = {};
    try {
      parsed = JSON.parse(content);
    } catch (_) {
      parsed = { error: 'Malformed JSON from model' };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});