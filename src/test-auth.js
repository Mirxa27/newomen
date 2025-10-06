// Simple test to verify authentication flow
import { supabase } from './integrations/supabase/client.js';

async function testAuth() {
  console.log('Testing authentication flow...');

  try {
    // Test signup with a test email
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'testpassword123';

    console.log('Attempting signup with:', testEmail);

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          email: testEmail,
        }
      }
    });

    if (error) {
      console.error('Signup error:', error);
      return;
    }

    console.log('Signup successful:', data);

    // Check if profile was created automatically
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.log('Profile not found (expected if trigger not applied):', profileError.message);
      } else {
        console.log('Profile created automatically:', profile);
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Only run if this file is executed directly
if (typeof window === 'undefined') {
  testAuth();
}
