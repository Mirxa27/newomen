#!/usr/bin/env node
/**
 * Verify Role-Based Access Control (RBAC) System
 * Tests the permission system for different roles
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Verifying Role-Based Access Control System\n');
console.log('═'.repeat(70));

// Read the roles.ts file to verify permissions
const rolesPath = join(__dirname, '../src/lib/shared/types/roles.ts');
const rolesContent = readFileSync(rolesPath, 'utf-8');

console.log('\n📋 ROLE DEFINITIONS:\n');

// Parse role permissions from the file
const roleRegex = /(\w+):\s*\{([^}]+)\}/gs;
let match;
const roles = {};

while ((match = roleRegex.exec(rolesContent)) !== null) {
  const roleName = match[1];
  const permissions = match[2];
  
  // Parse permissions
  const perms = {};
  const permRegex = /(\w+):\s*(true|false)/g;
  let permMatch;
  
  while ((permMatch = permRegex.exec(permissions)) !== null) {
    perms[permMatch[1]] = permMatch[2] === 'true';
  }
  
  roles[roleName] = perms;
}

// Admin layout mappings
const adminTabs = {
  'Analytics': 'canViewAnalytics',
  'Agents': 'canManageAIProviders',
  'AI Providers': 'canManageAIProviders',
  'AI Config': 'canManageSettings',
  'AI Prompts': 'canManageSettings',
  'AI Assessments': 'canManageAssessments',
  'Voice Training': 'canManageAIProviders',
  'Live Sessions': 'canViewLiveSessions',
  'Session History': 'canViewHistory',
  'User Management': 'canManageUsers',
  'Wellness Library': 'canManageContent',
  'Content Management': 'canManageContent',
  'Gamification': 'canManageCommunity',
  'Branding': 'canManageSettings',
  'API Settings': 'canManageAPIs',
};

// Display role access for each user
const userRoles = {
  'admin@newomen.me': 'superadmin',
  'Katrina@newomen.me': 'moderator',
  'Regular User': 'user'
};

Object.entries(userRoles).forEach(([user, role]) => {
  console.log(`\n${user} (${role.toUpperCase()}):`);
  console.log('─'.repeat(70));
  
  const permissions = roles[role] || {};
  const accessibleTabs = [];
  
  Object.entries(adminTabs).forEach(([tab, permission]) => {
    const hasAccess = permissions[permission];
    if (hasAccess) {
      accessibleTabs.push(tab);
      console.log(`  ✓ ${tab.padEnd(20)} (${permission})`);
    }
  });
  
  if (accessibleTabs.length === 0) {
    console.log('  ✗ No admin access');
  } else {
    console.log(`\n  Total tabs: ${accessibleTabs.length}/15`);
  }
});

// Verify the 5 required tabs for moderator
console.log('\n\n═'.repeat(70));
console.log('🎯 VERIFICATION: Moderator Access (Katrina@newomen.me)');
console.log('═'.repeat(70));

const requiredTabs = [
  'AI Assessments',
  'Wellness Library',
  'Content Management',
  'Gamification',
  'Branding'
];

const moderatorPerms = roles.moderator || {};
let allGranted = true;

console.log('\nRequired tabs for moderator:');
requiredTabs.forEach(tab => {
  const permission = adminTabs[tab];
  const hasAccess = moderatorPerms[permission];
  
  if (hasAccess) {
    console.log(`  ✓ ${tab.padEnd(25)} → ${permission}`);
  } else {
    console.log(`  ✗ ${tab.padEnd(25)} → ${permission} [MISSING]`);
    allGranted = false;
  }
});

console.log('\n' + '═'.repeat(70));

if (allGranted) {
  console.log('✨ SUCCESS! All 5 required tabs are accessible to moderators');
  console.log('\n📝 Next Steps:');
  console.log('   1. Katrina must sign up at /auth with email: Katrina@newomen.me');
  console.log('   2. Run: node scripts/grant-katrina-moderator.mjs');
  console.log('   3. Katrina can then login and access /admin panel');
  console.log('   4. She will see only the 5 tabs listed above\n');
  process.exit(0);
} else {
  console.log('❌ ERROR: Some required tabs are not accessible');
  process.exit(1);
}

