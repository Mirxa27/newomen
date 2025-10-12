import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessQuizPayload {
  attemptId: string;
  quizId: string;
  userId: string;
  responses: Record<string, string>;
  timeSpentMinutes: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: ProcessQuizPayload = await req.json();
    const { attemptId, quizId, userId, responses, timeSpentMinutes } = payload;

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get quiz details
    const { data: quiz, error: quizError } = await supabase
      .from('assessments_enhanced')
      .select('*')
      .eq('id', quizId)
      .eq('type', 'quiz')
      .single();

    if (quizError || !quiz) {
      throw new Error('Quiz not found');
    }

    // Calculate score based on correct answers
    const questions = quiz.questions as Array<{
      id: string;
      question: string;
      options: string[];
      correctAnswer: string;
      points?: number;
    }>;

    let totalPoints = 0;
    let earnedPoints = 0;
    const results: Array<{
      questionId: string;
      question: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      points: number;
      earnedPoints: number;
      explanation?: string;
    }> = [];

    for (const question of questions) {
      const points = question.points || 1;
      totalPoints += points;

      const userAnswer = responses[question.id];
      const correctAnswer = question.correctAnswer;
      const isCorrect = userAnswer === correctAnswer;

      if (isCorrect) {
        earnedPoints += points;
      }

      results.push({
        questionId: question.id,
        question: question.question,
        userAnswer: userAnswer || 'No answer',
        correctAnswer: correctAnswer,
        isCorrect: isCorrect,
        points: points,
        earnedPoints: isCorrect ? points : 0,
        explanation: (question as {explanation?: string}).explanation
      });
    }

    const scorePercentage = (earnedPoints / totalPoints) * 100;
    const passed = scorePercentage >= (quiz.passing_score || 70);

    // Generate feedback using AI if available
    let aiFeedback = null;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (openaiApiKey && !passed) {
      try {
        const startTime = Date.now();
        const incorrectQuestions = results.filter(r => !r.isCorrect);
        
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are an encouraging learning coach. Provide brief, positive feedback to help the user improve on quiz questions they got wrong. Keep it concise and actionable.'
              },
              {
                role: 'user',
                content: `The user took a quiz titled "${quiz.title}" and got ${incorrectQuestions.length} questions wrong. Here are the incorrect questions:\n\n${incorrectQuestions.map(q => `Q: ${q.question}\nTheir answer: ${q.userAnswer}\nCorrect answer: ${q.correctAnswer}`).join('\n\n')}\n\nProvide encouraging feedback and study tips.`
              }
            ],
            temperature: 0.7,
            max_tokens: 300,
          }),
        });

        if (openaiResponse.ok) {
          const aiResult = await openaiResponse.json();
          aiFeedback = aiResult.choices[0].message.content;

          const processingTime = Date.now() - startTime;
          const tokensUsed = aiResult.usage?.total_tokens || 0;
          const cost = (tokensUsed / 1000) * 0.002; // GPT-3.5 pricing

          // Log AI usage
          await supabase
            .from('ai_usage_logs')
            .insert({
              user_id: userId,
              assessment_id: quizId,
              attempt_id: attemptId,
              provider_name: 'openai',
              model_name: 'gpt-3.5-turbo',
              tokens_used: tokensUsed,
              cost_usd: cost,
              processing_time_ms: processingTime,
              success: true
            });
        }
      } catch (aiError) {
        console.error('AI feedback generation failed (non-critical):', aiError);
      }
    }

    // Prepare analysis object
    const analysis = {
      score: scorePercentage,
      earnedPoints: earnedPoints,
      totalPoints: totalPoints,
      correctAnswers: results.filter(r => r.isCorrect).length,
      totalQuestions: questions.length,
      passed: passed,
      results: results,
      feedback: aiFeedback || (passed 
        ? `Congratulations! You passed with a score of ${scorePercentage.toFixed(1)}%!`
        : `You scored ${scorePercentage.toFixed(1)}%. The passing score is ${quiz.passing_score}%. Review the incorrect answers and try again!`
      ),
      timeSpent: timeSpentMinutes
    };

    // Update the assessment attempt with results
    const { error: updateError } = await supabase
      .from('assessment_attempts')
      .update({
        ai_analysis: analysis,
        ai_score: scorePercentage,
        ai_feedback: analysis.feedback,
        ai_explanation: `Answered ${results.filter(r => r.isCorrect).length} out of ${questions.length} questions correctly.`,
        is_ai_processed: true,
        completed_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', attemptId);

    if (updateError) {
      throw updateError;
    }

    // Update user progress
    const { data: existingProgress } = await supabase
      .from('user_assessment_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('assessment_id', quizId)
      .single();

    if (existingProgress) {
      const shouldUpdate = !existingProgress.best_score || scorePercentage > existingProgress.best_score;
      
      if (shouldUpdate) {
        await supabase
          .from('user_assessment_progress')
          .update({
            best_score: scorePercentage,
            best_attempt_id: attemptId,
            last_attempt_at: new Date().toISOString(),
            total_attempts: existingProgress.total_attempts + 1,
            is_completed: passed,
            completion_date: passed ? new Date().toISOString() : null
          })
          .eq('id', existingProgress.id);
      } else {
        await supabase
          .from('user_assessment_progress')
          .update({
            last_attempt_at: new Date().toISOString(),
            total_attempts: existingProgress.total_attempts + 1
          })
          .eq('id', existingProgress.id);
      }
    } else {
      await supabase
        .from('user_assessment_progress')
        .insert({
          user_id: userId,
          assessment_id: quizId,
          best_score: scorePercentage,
          best_attempt_id: attemptId,
          last_attempt_at: new Date().toISOString(),
          total_attempts: 1,
          is_completed: passed,
          completion_date: passed ? new Date().toISOString() : null
        });
    }

    // Trigger gamification if passed
    if (passed) {
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/gamification-engine`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({
            type: 'complete_assessment',
            payload: {
              userId: userId,
              assessmentId: quizId
            }
          })
        });
      } catch (gamError) {
        console.error('Gamification error (non-critical):', gamError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysis,
        attemptId: attemptId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing quiz:', error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

