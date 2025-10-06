import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OpenAI } from 'https://esm.sh/openai@4.11.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

async function analyzeResponses(question: string, responseA: string, responseB: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a relationship counselor. Analyze the following two responses to a question and provide a brief, insightful, and positive analysis of their connection, alignment, or different perspectives. The question was: "${question}"`,
        },
        { role: 'user', content: `Person A's response: "${responseA}"\nPerson B's response: "${responseB}"` },
      ],
      max_tokens: 150,
    });
    return completion.choices[0].message.content || "Could not generate analysis.";
  } catch (error) {
    console.error('Error analyzing responses:', error);
    return "AI analysis is currently unavailable.";
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { record: challenge } = await req.json();

    if (!challenge || !challenge.responses) {
      return new Response(JSON.stringify({ message: 'No challenge data or responses to process.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const questions = challenge.question_set?.questions || [];
    const responses = challenge.responses;
    const aiAnalysis = challenge.ai_analysis || {};
    let analysisUpdated = false;

    for (const q of questions) {
      const questionId = q.id;
      const questionText = q.text;
      const questionResponses = responses[questionId];

      // Check if both partners have responded and analysis hasn't been done yet
      if (
        questionResponses?.initiator_response &&
        questionResponses?.partner_response &&
        !aiAnalysis[questionId]
      ) {
        console.log(`Analyzing responses for question: ${questionId}`);
        const analysis = await analyzeResponses(
          questionText,
          questionResponses.initiator_response,
          questionResponses.partner_response
        );
        aiAnalysis[questionId] = analysis;
        analysisUpdated = true;
      }
    }

    if (analysisUpdated) {
      const { error: updateError } = await supabase
        .from('couples_challenges')
        .update({ ai_analysis: aiAnalysis })
        .eq('id', challenge.id);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ message: 'Analysis complete and updated.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'No new responses to analyze.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});