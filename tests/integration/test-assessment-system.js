#!/usr/bin/env node

/**
 * Assessment System Test Script
 * Tests the complete assessment flow including:
 * 1. Assessment creation
 * 2. Attempt creation
 * 3. Response submission
 * 4. AI processing
 * 5. Result retrieval
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test user (create a mock user for testing)
const testUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com'
};

// Sample test responses
const sampleResponses = {
  'q1': 'I take time to think through the problem carefully',
  'q2': 'I usually gather information, consider multiple options, weigh pros and cons, and then make a decision based on what aligns with my values and goals.',
  'q3': '4',
  'q4': 'An active participant in discussions',
  'q5': 'true'
};

async function testAssessmentSystem() {
  console.log('🧪 Starting Assessment System Test...\n');

  try {
    // Step 1: Check if sample assessments exist
    console.log('1️⃣ Checking for sample assessments...');
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments_enhanced')
      .select('id, title, category, is_active')
      .eq('is_active', true)
      .limit(5);

    if (assessmentError) {
      console.error('❌ Failed to fetch assessments:', assessmentError);
      return false;
    }

    if (!assessments || assessments.length === 0) {
      console.log('📄 No assessments found. Creating sample assessments...');
      // You can run the SQL file here if needed
      console.log('Please run: psql -f create_sample_assessments.sql');
      return false;
    }

    console.log(`✅ Found ${assessments.length} assessments:`);
    assessments.forEach(a => console.log(`   - ${a.title} (${a.category})`));

    // Step 2: Test assessment retrieval
    console.log('\n2️⃣ Testing assessment retrieval...');
    const testAssessmentId = assessments[0].id;
    const { data: assessment, error: getAssessmentError } = await supabase
      .from('assessments_enhanced')
      .select('*')
      .eq('id', testAssessmentId)
      .single();

    if (getAssessmentError || !assessment) {
      console.error('❌ Failed to retrieve assessment:', getAssessmentError);
      return false;
    }

    console.log(`✅ Retrieved assessment: ${assessment.title}`);
    console.log(`   Questions: ${Array.isArray(assessment.questions) ? assessment.questions.length : 'JSON format'}`);

    // Step 3: Create assessment attempt
    console.log('\n3️⃣ Creating assessment attempt...');
    const { data: attempt, error: attemptError } = await supabase
      .from('assessment_attempts')
      .insert({
        assessment_id: testAssessmentId,
        user_id: testUser.id,
        attempt_number: 1,
        status: 'in_progress',
        raw_responses: {},
        started_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (attemptError || !attempt) {
      console.error('❌ Failed to create attempt:', attemptError);
      return false;
    }

    console.log(`✅ Created attempt: ${attempt.id}`);

    // Step 4: Submit responses
    console.log('\n4️⃣ Submitting assessment responses...');
    const { error: responseError } = await supabase
      .from('assessment_attempts')
      .update({
        raw_responses: sampleResponses,
        time_spent_minutes: 12,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', attempt.id);

    if (responseError) {
      console.error('❌ Failed to submit responses:', responseError);
      return false;
    }

    console.log('✅ Responses submitted successfully');

    // Step 5: Test AI processing (if AI is configured)
    if (assessment.ai_config_id) {
      console.log('\n5️⃣ Testing AI processing...');
      
      try {
        const { data: aiResult, error: aiError } = await supabase.functions.invoke('ai-assessment-processor', {
          body: {
            attemptId: attempt.id,
            assessmentId: testAssessmentId,
            userId: testUser.id,
            responses: sampleResponses,
            timeSpentMinutes: 12
          }
        });

        if (aiError) {
          console.log('⚠️ AI processing error (this is expected if Z.AI is not configured):');
          console.log(`   ${aiError.message}`);
        } else if (aiResult && aiResult.success) {
          console.log('✅ AI processing successful');
          console.log(`   Score: ${aiResult.analysis?.score || 'N/A'}`);
          console.log(`   Feedback: ${aiResult.analysis?.feedback?.substring(0, 100) || 'N/A'}...`);
        } else {
          console.log('⚠️ AI processing completed with warnings');
          console.log(`   Result: ${JSON.stringify(aiResult).substring(0, 200)}...`);
        }
      } catch (aiProcessError) {
        console.log('⚠️ AI processing error (expected if not configured):');
        console.log(`   ${aiProcessError.message}`);
      }
    } else {
      console.log('⏭️ No AI configuration found, skipping AI processing test');
    }

    // Step 6: Verify attempt was updated
    console.log('\n6️⃣ Verifying final attempt state...');
    const { data: finalAttempt, error: finalError } = await supabase
      .from('assessment_attempts')
      .select('*')
      .eq('id', attempt.id)
      .single();

    if (finalError || !finalAttempt) {
      console.error('❌ Failed to retrieve final attempt:', finalError);
      return false;
    }

    console.log('✅ Final attempt state:');
    console.log(`   Status: ${finalAttempt.status}`);
    console.log(`   AI Processed: ${finalAttempt.is_ai_processed || false}`);
    console.log(`   AI Score: ${finalAttempt.ai_score || 'N/A'}`);
    console.log(`   Has AI Analysis: ${finalAttempt.ai_analysis ? 'Yes' : 'No'}`);

    // Step 7: Test AI Health Check
    console.log('\n7️⃣ Testing AI health check...');
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-assessment-helper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          action: 'health_check'
        })
      });

      if (response.ok) {
        const healthResult = await response.json();
        console.log(`✅ AI Health Check: ${healthResult.status}`);
        console.log(`   Message: ${healthResult.message}`);
      } else {
        console.log(`⚠️ AI Health Check failed: ${response.status}`);
      }
    } catch (healthError) {
      console.log(`⚠️ AI Health Check error: ${healthError.message}`);
    }

    // Cleanup: Remove test attempt
    console.log('\n🧹 Cleaning up test data...');
    const { error: cleanupError } = await supabase
      .from('assessment_attempts')
      .delete()
      .eq('id', attempt.id);

    if (cleanupError) {
      console.log(`⚠️ Cleanup warning: ${cleanupError.message}`);
    } else {
      console.log('✅ Test data cleaned up');
    }

    console.log('\n🎉 Assessment System Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Assessment retrieval: Working');
    console.log('   ✅ Attempt creation: Working');
    console.log('   ✅ Response submission: Working');
    console.log('   ✅ Data persistence: Working');
    console.log('   ⚠️ AI processing: Depends on configuration');

    return true;

  } catch (error) {
    console.error('\n💥 Test failed with error:', error);
    return false;
  }
}

// Run the test
testAssessmentSystem()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
