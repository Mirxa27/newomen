#!/usr/bin/env node

/**
 * TypeScript Performance Monitor
 * Tracks compilation times and identifies performance bottlenecks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

function measureCompilation(command, description) {
  console.log(`\n⏱️  Measuring: ${description}`);
  console.log(`   Command: ${command}`);

  const start = process.hrtime.bigint();

  try {
    execSync(command, { stdio: 'inherit' });
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    console.log(`   ✅ Completed in: ${formatTime(duration)}`);
    return duration;
  } catch (error) {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000;

    console.log(`   ❌ Failed after: ${formatTime(duration)}`);
    console.log(`   Error: ${error.message}`);
    return duration;
  }
}

function analyzeTypeComplexity() {
  console.log('\n🔍 Analyzing Type Complexity...');

  const typeFiles = [
    'src/types/assessment-types.ts',
    'src/types/assessment-optimized.ts',
    'src/integrations/supabase/types.ts'
  ];

  typeFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n').length;
      const interfaces = (content.match(/interface\s+\w+/g) || []).length;
      const types = (content.match(/type\s+\w+/g) || []).length;
      const generics = (content.match(/<[^>]+>/g) || []).length;

      console.log(`\n📄 ${file}:`);
      console.log(`   Lines: ${lines}`);
      console.log(`   Interfaces: ${interfaces}`);
      console.log(`   Type aliases: ${types}`);
      console.log(`   Generics: ${generics}`);
      console.log(`   Complexity Score: ${interfaces * 2 + types + generics * 3}`);
    }
  });
}

function main() {
  console.log('🚀 TypeScript Performance Monitor');
  console.log('====================================');

  const results = [];

  // Clean previous builds
  console.log('\n🧹 Cleaning previous builds...');
  try {
    execSync('rm -rf node_modules/.cache dist .tsbuildinfo', { stdio: 'inherit' });
  } catch (e) {
    // Ignore errors
  }

  // Measure different compilation scenarios
  results.push({
    test: 'Full Type Check (Default)',
    duration: measureCompilation(
      'npx tsc --noEmit',
      'Full type checking with default config'
    )
  });

  results.push({
    test: 'Full Type Check (Optimized)',
    duration: measureCompilation(
      'npx tsc --noEmit --project tsconfig.performance.json',
      'Type checking with performance optimizations'
    )
  });

  results.push({
    test: 'Incremental Build',
    duration: measureCompilation(
      'npx tsc --noEmit --incremental',
      'Incremental build compilation'
    )
  });

  results.push({
    test: 'Skip Lib Check',
    duration: measureCompilation(
      'npx tsc --noEmit --skipLibCheck',
      'Compilation with library checking skipped'
    )
  });

  // Analyze type complexity
  analyzeTypeComplexity();

  // Summary
  console.log('\n📊 Performance Summary');
  console.log('=======================');

  results
    .sort((a, b) => a.duration - b.duration)
    .forEach((result, index) => {
      const icon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍';
      console.log(`${icon} ${result.test}: ${formatTime(result.duration)}`);
    });

  const fastest = Math.min(...results.map(r => r.duration));
  const slowest = Math.max(...results.map(r => r.duration));
  const improvement = ((slowest - fastest) / slowest * 100).toFixed(1);

  console.log(`\n📈 Performance Improvement: ${improvement}%`);

  // Recommendations
  console.log('\n💡 Recommendations');
  console.log('==================');

  if (improvement > 20) {
    console.log('✅ Significant performance gains available with optimizations!');
  }

  console.log('\n1. Use tsconfig.performance.json for faster builds');
  console.log('2. Enable incremental compilation in CI/CD');
  console.log('3. Consider using type-only imports for large interfaces');
  console.log('4. Split large type files into smaller modules');
  console.log('5. Use optimized assessment types from assessment-optimized.ts');

  // Check for memory usage (if on Unix-like system)
  if (process.platform !== 'win32') {
    try {
      const memory = execSync('ps -o rss= -p ' + process.pid, { encoding: 'utf8' });
      console.log(`\n💾 Memory used: ${(parseInt(memory) / 1024).toFixed(2)} MB`);
    } catch (e) {
      // Ignore
    }
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { measureCompilation, analyzeTypeComplexity };