#!/usr/bin/env node

/**
 * Analyze unused files in the Fictures project
 * This script finds source files that are not imported or referenced anywhere
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Configuration
const rootDir = process.cwd();
const excludeDirs = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  '__pycache__',
  'venv',
  'logs',
  '.vercel'
];

const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py'];
const alwaysUsedPatterns = [
  /^apps\/web\/src\/app\/.*\/(page|layout|loading|error|not-found|route)\.(ts|tsx|js|jsx)$/,
  /drizzle\.config\.(ts|js)$/,
  /next\.config\.(ts|js)$/,
  /tailwind\.config\.(ts|js)$/,
  /postcss\.config\.(ts|js)$/,
  /jest\.config\.(ts|js)$/,
  /playwright\.config\.(ts|js)$/,
  /middleware\.(ts|js)$/,
  /^apps\/web\/src\/middleware\.(ts|js)$/,
  /instrumentation\.(ts|js)$/,
  /__tests__\//,
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /\.config\.(ts|js)$/,
  /main\.py$/,
  /__main__\.py$/,
];

// 2. Get all source files
function getAllSourceFiles() {
  const command = `find . -type f \\( ${sourceExtensions.map(ext => `-name "*${ext}"`).join(' -o ')} \\) ${excludeDirs.map(dir => `-not -path "*/${dir}/*"`).join(' ')}`;

  const output = execSync(command, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
  return output.trim().split('\n').filter(Boolean).map(f => f.replace(/^\.\//, ''));
}

// 3. Check if file is "always used" based on patterns
function isAlwaysUsed(filePath) {
  return alwaysUsedPatterns.some(pattern => pattern.test(filePath));
}

// 4. Search for file usage in codebase
function findFileUsages(filePath) {
  const fileName = path.basename(filePath, path.extname(filePath));
  const dirName = path.dirname(filePath);

  // Generate search patterns
  const patterns = [];

  // For TypeScript/JavaScript files
  if (filePath.match(/\.(ts|tsx|js|jsx)$/)) {
    // Import patterns
    patterns.push(`from ['"]\\..*${fileName}`);
    patterns.push(`from ['"]@/.*${fileName}`);
    patterns.push(`require\\(['"]\\..*${fileName}`);
    patterns.push(`import\\(['"]\\..*${fileName}`);

    // For index files, search for directory imports
    if (fileName === 'index') {
      const parentDir = path.basename(dirName);
      patterns.push(`from ['"]\\..*/${parentDir}['"\\)]`);
      patterns.push(`from ['"]@/.*/${parentDir}['"\\)]`);
    }
  }

  // For Python files
  if (filePath.match(/\.py$/)) {
    const moduleName = fileName.replace(/-/g, '_');
    patterns.push(`import ${moduleName}`);
    patterns.push(`from .* import .*${moduleName}`);
    patterns.push(`from ${moduleName} import`);
  }

  // Search for each pattern
  let foundUsages = false;
  for (const pattern of patterns) {
    try {
      const grepCommand = `grep -r -l --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" "${pattern}" . ${excludeDirs.map(dir => `--exclude-dir=${dir}`).join(' ')} 2>/dev/null | grep -v "^${filePath.replace(/\./g, '\\.')}$" || true`;

      const result = execSync(grepCommand, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
      if (result.trim()) {
        foundUsages = true;
        break;
      }
    } catch (error) {
      // Continue if grep fails
    }
  }

  return foundUsages;
}

// 5. Main analysis
function analyzeUnusedFiles() {
  console.log('🔍 Starting file usage analysis...\n');

  const allFiles = getAllSourceFiles();
  console.log(`📊 Total source files found: ${allFiles.length}\n`);

  const results = {
    alwaysUsed: [],
    used: [],
    potentiallyUnused: [],
    total: allFiles.length
  };

  let processed = 0;

  for (const file of allFiles) {
    processed++;
    if (processed % 50 === 0) {
      console.log(`Progress: ${processed}/${allFiles.length} (${Math.round(processed/allFiles.length*100)}%)`);
    }

    // Check if file is always used by pattern
    if (isAlwaysUsed(file)) {
      results.alwaysUsed.push(file);
      continue;
    }

    // Check if file is used anywhere
    const isUsed = findFileUsages(file);
    if (isUsed) {
      results.used.push(file);
    } else {
      results.potentiallyUnused.push(file);
    }
  }

  return results;
}

// 6. Generate report
function generateReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('📋 FILE USAGE ANALYSIS REPORT');
  console.log('='.repeat(80));
  console.log(`\n📊 Summary:`);
  console.log(`   Total files analyzed: ${results.total}`);
  console.log(`   ✅ Always used (Next.js routes, configs): ${results.alwaysUsed.length}`);
  console.log(`   ✅ Used (imported/referenced): ${results.used.length}`);
  console.log(`   ⚠️  Potentially unused: ${results.potentiallyUnused.length}`);

  if (results.potentiallyUnused.length > 0) {
    console.log(`\n⚠️  POTENTIALLY UNUSED FILES:\n`);
    results.potentiallyUnused.sort().forEach(file => {
      console.log(`   - ${file}`);
    });

    // Group by directory
    console.log(`\n📁 GROUPED BY DIRECTORY:\n`);
    const grouped = {};
    results.potentiallyUnused.forEach(file => {
      const dir = path.dirname(file);
      if (!grouped[dir]) grouped[dir] = [];
      grouped[dir].push(path.basename(file));
    });

    Object.keys(grouped).sort().forEach(dir => {
      console.log(`   ${dir}/`);
      grouped[dir].forEach(file => {
        console.log(`      - ${file}`);
      });
    });
  }

  // Save detailed report
  const reportPath = path.join(rootDir, 'logs', 'unused-files-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);

  return results;
}

// 7. Run analysis
try {
  const results = analyzeUnusedFiles();
  generateReport(results);
} catch (error) {
  console.error('❌ Error during analysis:', error.message);
  process.exit(1);
}
