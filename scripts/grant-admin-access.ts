import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fkikaozubngmzcrnhkqe.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  console.error('Please set the service role key to execute admin operations');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function grantAdminAccess(email: string) {
  console.log(`\n🔐 Granting admin access to: ${email}\n`);

  try {
    // Step 1: Check if user exists
    console.log('Step 1: Checking if user exists...');
    const { data: existingUser, error: checkError } = await supabase
      .from('user_profiles')
      .select('id, email, role, user_id')
      .ilike('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking user:', checkError);
      return false;
    }

    if (!existingUser) {
      console.error(`❌ User with email ${email} not found in system`);
      console.error('User must sign up first via the app at /auth');
      return false;
    }

    console.log(`✅ User found: ${existingUser.email}`);
    console.log(`   Current role: ${existingUser.role}`);
    console.log(`   User ID: ${existingUser.user_id}`);

    // Step 2: Update role to admin
    console.log('\nStep 2: Granting admin role...');
    const { data: updated, error: updateError } = await supabase
      .from('user_profiles')
      .update({ role: 'admin' })
      .ilike('email', email)
      .select('id, email, role')
      .single();

    if (updateError) {
      console.error('❌ Error updating role:', updateError);
      return false;
    }

    console.log('✅ Role updated successfully!');
    console.log(`   Email: ${updated.email}`);
    console.log(`   New role: ${updated.role}`);

    // Step 3: Verify the change
    console.log('\nStep 3: Verifying admin access...');
    const { data: verified, error: verifyError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .ilike('email', email)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
      return false;
    }

    if (verified.role === 'admin') {
      console.log('✅ Admin access verified!');
      console.log(`   Email: ${verified.email}`);
      console.log(`   Role: ${verified.role}`);
      console.log(`\n✨ SUCCESS! ${email} now has admin access`);
      console.log(`   Can now access: /admin`);
      console.log(`   Permissions: Full admin + moderation access\n`);
      return true;
    } else {
      console.error(`❌ Role verification failed. Current role: ${verified.role}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  const emailArg = process.argv[2];
  const email = emailArg || 'Katrina@newomen.me';

  console.log('='.repeat(60));
  console.log('🔑 ADMIN ACCESS GRANT SCRIPT');
  console.log('='.repeat(60));

  const success = await grantAdminAccess(email);
  
  if (!success) {
    console.error('\n❌ Failed to grant admin access');
    process.exit(1);
  }

  console.log('='.repeat(60));
  process.exit(0);
}

main();
