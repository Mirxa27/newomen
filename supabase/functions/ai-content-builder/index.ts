import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, type, isPublic, context, analysisType } = await req.json();

    // Handle Narrative Identity Analysis
    if (topic === 'narrative-identity-analysis' && context) {
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY not configured");
      }

      const analysisPrompt = `Analyze this personal narrative exploration and provide a comprehensive psychological analysis.

NARRATIVE DATA:
${context}

Generate a JSON response with this EXACT structure:
{
  "coreThemes": ["theme1", "theme2", "theme3", "theme4"],
  "limitingBeliefs": ["belief1", "belief2", "belief3"],
  "strengthPatterns": ["strength1", "strength2", "strength3", "strength4"],
  "transformationOpportunities": ["opportunity1", "opportunity2", "opportunity3"],
  "personalityArchetype": "one of: Explorer, Healer, Builder, Warrior, Sage, Caregiver, Visionary, Nurturer",
  "narrativeCoherence": 85,
  "transformationRoadmap": [
    {
      "title": "Step title",
      "description": "Detailed description",
      "actions": ["action1", "action2", "action3"]
    }
  ]
}

ANALYSIS GUIDELINES:
1. Core Themes: Identify 3-5 recurring patterns across their life story
2. Limiting Beliefs: Surface 2-4 self-limiting narratives they might not consciously recognize
3. Strength Patterns: Highlight 3-5 demonstrated resilience patterns and capabilities
4. Transformation Opportunities: Suggest 3-4 specific growth areas based on their aspirations
5. Personality Archetype: Choose the archetype that best fits their narrative style and values
6. Narrative Coherence: Rate 0-100 how well their story flows and makes sense
7. Transformation Roadmap: Create 4-5 actionable steps with specific practices

Be insightful, compassionate, and specific to their unique story.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { 
              role: "system", 
              content: "You are an expert narrative psychologist specializing in identity formation and personal transformation. Provide deep, actionable insights." 
            },
            { role: "user", content: analysisPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("OpenAI API error:", error);
        throw new Error("Failed to analyze narrative");
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);

      return new Response(
        JSON.stringify(analysis),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Original assessment generation code
    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const systemPrompt = `You are an expert content creator for personal growth assessments and courses. Generate high-quality, engaging content based on the user's topic.`;

    const userPrompt = `Create a ${type} about: ${topic}

Generate a JSON response with this structure:
{
  "title": "Engaging title for the ${type}",
  "description": "Brief description (2-3 sentences)",
  "questions": [
    {
      "text": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"]
    }
  ]
}

Requirements:
- Create 10-15 thoughtful questions
- Each question should have 4 options
- Questions should be progressive and insightful
- Use clear, accessible language
- Focus on personal growth and self-discovery`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      throw new Error("Failed to generate content");
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: assessment, error: insertError } = await supabase
      .from("assessments")
      .insert({
        title: content.title,
        assessment_type: type,
        questions: content.questions,
        is_public: isPublic,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, assessment }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-content-builder:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
