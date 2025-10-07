#!/usr/bin/env tsx

/**
 * Migration script to update imports to use optimized assessment types
 * Run with: npx tsx scripts/migrate-to-optimized-types.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

interface FileUpdate {
  file: string;
  original: string;
  updated: string;
}

const updates: FileUpdate[] = [];

// Files to update
const patterns = [
  'src/**/*.ts',
  'src/**/*.tsx'
];

async function migrateTypes() {
  console.log('🚀 Starting TypeScript type migration...\n');

  const files = await glob(patterns, { ignore: ['node_modules/**', 'dist/**'] });

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    let updated = content;
    let hasChanges = false;

    // Update imports from assessment-types to assessment-optimized
    if (updated.includes('from "@/types/assessment-types"')) {
      updated = updated.replace(
        /from "@\/types\/assessment-types"/g,
        'from "@/types/assessment-optimized"'
      );
      hasChanges = true;
    }

    // Update specific imports
    if (updated.includes('Assessment, AssessmentAttempt')) {
      updated = updated.replace(
        /Assessment, AssessmentAttempt/g,
        'Assessment, AssessmentAttempt'
      );
    }

    // Update service imports
    if (updated.includes('AIAssessmentService')) {
      updated = updated.replace(
        /import \{.*AIAssessmentService.*\} from "@\/services\/AIAssessmentService"/g,
        'import { assessmentServiceOptimized } from "@/services/AssessmentServiceOptimized"'
      );
      if (updated.includes('new AIAssessmentService()')) {
        updated = updated.replace(/new AIAssessmentService\(\)/g, 'assessmentServiceOptimized');
      }
      hasChanges = true;
    }

    // Update Supabase queries to use optimized service
    if (updated.includes('supabase.from("assessments")') && !updated.includes('AssessmentServiceOptimized')) {
      // Add comment suggesting optimization
      updated = updated.replace(
        /(const \{ data, error \} = await )supabase\.from\("assessments"\)/g,
        '$1/* TODO: Consider using assessmentServiceOptimized for better performance */\n        $1supabase.from("assessments")'
      );
      hasChanges = true;
    }

    if (hasChanges) {
      writeFileSync(file, updated, 'utf-8');
      updates.push({ file, original: content, updated });
      console.log(`✅ Updated: ${file}`);
    }
  }

  console.log(`\n✨ Migration complete! Updated ${updates.length} files.\n`);

  // Generate report
  if (updates.length > 0) {
    console.log('Updated files:');
    updates.forEach(({ file }) => console.log(`  - ${file}`));

    console.log('\nNext steps:');
    console.log('1. Run TypeScript check: npm run typecheck');
    console.log('2. Run tests: npm test');
    console.log('3. If all passes, commit changes');
  }
}

// Run migration
migrateTypes().catch(console.error);