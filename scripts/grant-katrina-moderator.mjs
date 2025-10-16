#!/usr/bin/env node
/**
 * Grant Moderator Access to Katrina@newomen.me
 * This script grants limited admin access (5 tabs) to Katrina
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://fkikaozubngmzcrnhkqe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraWthb3p1Ym5nbXpjcm5oa3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5NzU2MjgsImV4cCI6MTg1Nzc0MTYyOH0.dxDd8pAkXMeAq8Nb2K1r0P0Gul2xJ8D8UqcnCgPu6HU';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔐 Starting role-based access setup...\n');

async function setupRoles() {
  try {
    // Step 1: Check if users exist
    console.log('Step 1: Checking if users exist...');
    
    const { data: adminUser } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .ilike('email', 'admin@newomen.me')
      .single();
    
    const { data: katrinaUser } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .ilike('email', 'Katrina@newomen.me')
      .single();
    
    if (!adminUser) {
      console.log('⚠️  admin@newomen.me not found - will be created on first login');
    } else {
      console.log(`✓ Found admin@newomen.me (current role: ${adminUser.role})`);
    }
    
    if (!katrinaUser) {
      console.log('⚠️  Katrina@newomen.me not found - must sign up first at /auth');
      console.log('   After signup, run this script again to grant moderator access');
      return false;
    } else {
      console.log(`✓ Found Katrina@newomen.me (current role: ${katrinaUser.role})`);
    }
    
    // Step 2: Update Katrina to moderator
    console.log('\nStep 2: Granting moderator access to Katrina...');
    
    const { data: updated, error: updateError } = await supabase
      .from('user_profiles')
      .update({ role: 'moderator' })
      .eq('id', katrinaUser.id)
      .select('id, email, role')
      .single();
    
    if (updateError) {
      console.error('❌ Failed to update role:', updateError.message);
      
      // If constraint error, we need to apply the migration first
      if (updateError.message.includes('constraint') || updateError.message.includes('check')) {
        console.log('\n⚠️  Database constraint needs updating!');
        console.log('Please run this SQL in Supabase SQL Editor:\n');
        const sqlPath = join(__dirname, 'setup-role-based-access.sql');
        const sql = readFileSync(sqlPath, 'utf-8');
        console.log('─'.repeat(60));
        console.log(sql);
        console.log('─'.repeat(60));
        console.log('\nThen run this script again.');
      }
      
      return false;
    }
    
    console.log(`✓ Updated: ${updated.email} → ${updated.role}`);
    
    // Step 3: Verify
    console.log('\nStep 3: Verifying access...');
    
    const { data: verified } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .eq('id', katrinaUser.id)
      .single();
    
    if (verified && verified.role === 'moderator') {
      console.log('✓ Verification successful\n');
      console.log('═'.repeat(60));
      console.log('✨ SUCCESS! Katrina@newomen.me now has moderator access');
      console.log('═'.repeat(60));
      console.log('\n📋 Katrina can access these admin tabs:');
      console.log('   ✓ AI Assessments');
      console.log('   ✓ Wellness Library');
      console.log('   ✓ Content Management');
      console.log('   ✓ Gamification');
      console.log('   ✓ Branding');
      console.log('\n🚀 Katrina can now login and access /admin panel');
      return true;
    } else {
      console.error('❌ Verification failed - role not updated');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Run the setup
setupRoles()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

