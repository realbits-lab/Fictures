#!/usr/bin/env node

/**
 * Deep analysis of component usage in apps/web/src/components
 * Checks for direct imports, re-exports, dynamic imports, and JSX usage
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Configuration
const rootDir = process.cwd();
const componentsDir = 'apps/web/src/components';
const webAppDir = 'apps/web';

// 2. Get all component files
function getAllComponentFiles() {
  const command = `find ${componentsDir} -type f \\( -name "*.tsx" -o -name "*.ts" \\) -not -name "*.d.ts"`;
  const output = execSync(command, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
  return output.trim().split('\n').filter(Boolean);
}

// 3. Extract component names from a file
function extractComponentNames(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const names = [];

    // 1. Named exports: export function/const ComponentName
    const namedExports = content.matchAll(/export\s+(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/g);
    for (const match of namedExports) {
      names.push(match[1]);
    }

    // 2. Default exports with function names
    const defaultExport = content.match(/export\s+default\s+(?:function\s+)?([A-Z][a-zA-Z0-9]*)/);
    if (defaultExport) {
      names.push(defaultExport[1]);
    }

    // 3. Component variable declarations: const ComponentName = ...
    const componentVars = content.matchAll(/(?:const|let|var)\s+([A-Z][a-zA-Z0-9]*)\s*[:=]/g);
    for (const match of componentVars) {
      names.push(match[1]);
    }

    return [...new Set(names)];
  } catch (error) {
    return [];
  }
}

// 4. Check if component is re-exported through index files
function checkIndexReexports(filePath) {
  const dir = path.dirname(filePath);
  const indexPath = path.join(dir, 'index.ts');

  if (!fs.existsSync(indexPath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(indexPath, 'utf-8');
    const fileName = path.basename(filePath, path.extname(filePath));

    // Check for re-export patterns
    return content.includes(`./${fileName}`) || content.includes(`"./${fileName}"`);
  } catch (error) {
    return false;
  }
}

// 5. Search for component usage with multiple patterns
function searchComponentUsage(componentNames, filePath) {
  if (componentNames.length === 0) return { found: false, matches: [] };

  const fileName = path.basename(filePath, path.extname(filePath));
  const relativePath = filePath.replace(/^apps\/web\/src\//, '@/');
  const relativePathNoExt = relativePath.replace(/\.(tsx?|jsx?)$/, '');

  const searchPatterns = [];

  // 1. Direct file imports
  searchPatterns.push(
    `from ['"].*/${fileName}['"]`,
    `from ['"]@/components.*/${fileName}['"]`,
    `from ['"]\\..*/${fileName}['"]`,
  );

  // 2. Directory imports (for index files)
  if (fileName === 'index') {
    const dir = path.dirname(filePath);
    const dirName = path.basename(dir);
    searchPatterns.push(
      `from ['"].*/${dirName}['"]`,
      `from ['"]@/components.*/${dirName}['"]`,
    );
  }

  // 3. Component name usage in JSX and imports
  for (const name of componentNames) {
    searchPatterns.push(
      `<${name}[\\s/>]`,  // JSX usage
      `{${name}}`,         // Destructured usage
      `import.*${name}.*from`,  // Named import
    );
  }

  // 4. Dynamic imports
  searchPatterns.push(
    `import\\(['"].*${fileName}['"]\\)`,
  );

  // Run searches
  const foundMatches = [];
  const excludePaths = [
    filePath,  // Exclude the file itself
    filePath.replace(/\.(tsx?|jsx?)$/, '.test.$1'),  // Exclude test file
  ];

  for (const pattern of searchPatterns) {
    try {
      const grepCommand = `grep -r -l --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "${pattern}" ${webAppDir} 2>/dev/null || true`;

      const result = execSync(grepCommand, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
      const files = result.trim().split('\n').filter(Boolean);

      // Filter out the component file itself and its test file
      const validFiles = files.filter(f => !excludePaths.some(exclude => f === exclude));

      if (validFiles.length > 0) {
        foundMatches.push({
          pattern,
          files: validFiles.slice(0, 5)  // Limit to first 5 matches
        });
      }
    } catch (error) {
      // Continue on error
    }
  }

  return {
    found: foundMatches.length > 0,
    matches: foundMatches
  };
}

// 6. Categorize component files
function categorizeComponent(filePath) {
  const segments = filePath.split('/');

  if (segments.includes('ui')) return 'UI Components';
  if (segments.includes('studio')) return 'Studio';
  if (segments.includes('analysis')) return 'Analysis';
  if (segments.includes('community')) return 'Community';
  if (segments.includes('dashboard')) return 'Dashboard';
  if (segments.includes('novels')) return 'Novels/Reading';
  if (segments.includes('comic')) return 'Comics';
  if (segments.includes('auth')) return 'Authentication';
  if (segments.includes('publish')) return 'Publishing';
  if (segments.includes('home')) return 'Home Page';
  if (segments.includes('browse')) return 'Browse';
  if (segments.includes('settings')) return 'Settings';
  if (segments.includes('layout')) return 'Layout';
  if (segments.includes('common')) return 'Common';
  if (filePath.includes('index.ts')) return 'Index Re-exports';

  return 'Other';
}

// 7. Main analysis
function analyzeComponents() {
  console.log('🔍 Starting deep component analysis...\n');

  const allComponents = getAllComponentFiles();
  console.log(`📊 Total component files found: ${allComponents.length}\n`);

  const results = {
    used: [],
    potentiallyUnused: [],
    reexported: [],
    total: allComponents.length
  };

  let processed = 0;

  for (const componentPath of allComponents) {
    processed++;

    if (processed % 20 === 0) {
      console.log(`Progress: ${processed}/${allComponents.length} (${Math.round(processed/allComponents.length*100)}%)`);
    }

    // 1. Extract component names
    const componentNames = extractComponentNames(componentPath);

    // 2. Check for re-exports through index
    const isReexported = checkIndexReexports(componentPath);

    // 3. Search for usage
    const usage = searchComponentUsage(componentNames, componentPath);

    // 4. Categorize
    const category = categorizeComponent(componentPath);

    const componentInfo = {
      path: componentPath,
      category,
      names: componentNames,
      isReexported,
      usage: usage.matches
    };

    if (usage.found) {
      results.used.push(componentInfo);
    } else {
      results.potentiallyUnused.push(componentInfo);
    }

    if (isReexported) {
      results.reexported.push(componentPath);
    }
  }

  return results;
}

// 8. Generate detailed report
function generateReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('📋 COMPONENT USAGE ANALYSIS REPORT');
  console.log('='.repeat(80));

  console.log(`\n📊 Summary:`);
  console.log(`   Total components analyzed: ${results.total}`);
  console.log(`   ✅ Used (found references): ${results.used.length}`);
  console.log(`   ⚠️  Potentially unused: ${results.potentiallyUnused.length}`);
  console.log(`   🔄 Re-exported through index: ${results.reexported.length}`);

  // Group potentially unused by category
  console.log(`\n⚠️  POTENTIALLY UNUSED COMPONENTS BY CATEGORY:\n`);

  const grouped = {};
  results.potentiallyUnused.forEach(comp => {
    if (!grouped[comp.category]) {
      grouped[comp.category] = [];
    }
    grouped[comp.category].push(comp);
  });

  Object.keys(grouped).sort().forEach(category => {
    console.log(`   ${category} (${grouped[category].length}):`);
    grouped[category].forEach(comp => {
      const fileName = path.basename(comp.path);
      const names = comp.names.length > 0 ? ` [${comp.names.join(', ')}]` : '';
      const reexport = comp.isReexported ? ' 🔄' : '';
      console.log(`      - ${fileName}${names}${reexport}`);
    });
    console.log('');
  });

  // Show some examples of used components
  console.log(`\n✅ SAMPLE USED COMPONENTS (showing first 10):\n`);
  results.used.slice(0, 10).forEach(comp => {
    console.log(`   ${path.basename(comp.path)}`);
    if (comp.usage.length > 0) {
      console.log(`      Used in: ${comp.usage[0].files.slice(0, 2).map(f => path.basename(f)).join(', ')}`);
    }
  });

  // Save detailed report
  const reportPath = path.join(rootDir, 'logs', 'components-analysis-deep.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);

  return results;
}

// 9. Run analysis
try {
  const results = analyzeComponents();
  generateReport(results);
} catch (error) {
  console.error('❌ Error during analysis:', error.message);
  console.error(error.stack);
  process.exit(1);
}
