#!/usr/bin/env node
/**
 * Script to automatically convert JavaScript files to TypeScript
 * Usage: node scripts/convert-to-typescript.js [--dry-run] [--backup]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  sourceDir: path.join(__dirname, '..', 'src'),
  excludeDirs: ['node_modules', 'build', 'dist', '.expo', 'android', 'ios'],
  dryRun: process.argv.includes('--dry-run'),
  createBackup: process.argv.includes('--backup'),
  verbose: process.argv.includes('--verbose'),
};

// Statistics
const stats = {
  total: 0,
  converted: 0,
  skipped: 0,
  errors: 0,
};

/**
 * Check if file contains React/JSX code
 */
function isReactComponent(content) {
  const reactPatterns = [
    /import\s+React/,
    /from\s+['"]react['"]/,
    /<[A-Z][a-zA-Z0-9]*[\s>]/,  // JSX component
    /React\.Component/,
    /export\s+(default\s+)?function\s+[A-Z]/,  // Exported function component
    /const\s+[A-Z][a-zA-Z0-9]*\s*=\s*\(/,  // Const arrow function component
  ];
  
  return reactPatterns.some(pattern => pattern.test(content));
}

/**
 * Add basic TypeScript types to content
 */
function addBasicTypes(content, isReact) {
  let modified = content;
  
  // Add React.FC type for function components
  if (isReact) {
    // Replace: export const Component = ({ props }) =>
    modified = modified.replace(
      /export\s+const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*\(\s*\{\s*([^}]*)\s*\}\s*\)/g,
      'export const $1: React.FC<{ $2 }> = ({ $2 })'
    );
    
    // Replace: export default function Component({ props })
    modified = modified.replace(
      /export\s+default\s+function\s+([A-Z][a-zA-Z0-9]*)\s*\(\s*\{\s*([^}]*)\s*\}\s*\)/g,
      'export default function $1({ $2 }: any)'
    );
    
    // Replace: export function Component({ props })
    modified = modified.replace(
      /export\s+function\s+([A-Z][a-zA-Z0-9]*)\s*\(\s*\{\s*([^}]*)\s*\}\s*\)/g,
      'export function $1({ $2 }: any)'
    );
  }
  
  // Add useState types
  modified = modified.replace(
    /const\s+\[([^,]+),\s*([^\]]+)\]\s*=\s*useState\(\s*([^)]*)\s*\)/g,
    (match, state, setter, initial) => {
      // Try to infer type from initial value
      let type = 'any';
      if (initial === 'true' || initial === 'false') type = 'boolean';
      else if (initial === '0' || /^\d+$/.test(initial)) type = 'number';
      else if (initial === '""' || initial === "''" || initial.startsWith('"') || initial.startsWith("'")) type = 'string';
      else if (initial === '[]') type = 'any[]';
      else if (initial === '{}') type = 'any';
      
      return `const [${state}, ${setter}] = useState<${type}>(${initial})`;
    }
  );
  
  return modified;
}

/**
 * Convert a single file from JS to TS
 */
function convertFile(filePath) {
  try {
    stats.total++;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const isReact = isReactComponent(content);
    const ext = path.extname(filePath);
    
    // Determine new extension
    let newExt;
    if (ext === '.jsx') {
      newExt = '.tsx';
    } else if (ext === '.js') {
      newExt = isReact ? '.tsx' : '.ts';
    } else {
      stats.skipped++;
      return;
    }
    
    const newFilePath = filePath.replace(new RegExp(`\\${ext}$`), newExt);
    
    if (config.dryRun) {
      console.log(`[DRY-RUN] Would convert: ${path.relative(config.sourceDir, filePath)} -> ${path.basename(newFilePath)}`);
      stats.converted++;
      return;
    }
    
    // Create backup if requested
    if (config.createBackup) {
      const backupPath = `${filePath}.backup`;
      fs.copyFileSync(filePath, backupPath);
      if (config.verbose) {
        console.log(`  📦 Backup created: ${path.basename(backupPath)}`);
      }
    }
    
    // Add basic types
    const typedContent = addBasicTypes(content, isReact);
    
    // Write new TypeScript file
    fs.writeFileSync(newFilePath, typedContent, 'utf8');
    
    // Delete old JS file
    fs.unlinkSync(filePath);
    
    console.log(`✅ Converted: ${path.relative(config.sourceDir, filePath)} -> ${path.basename(newFilePath)}`);
    stats.converted++;
    
  } catch (error) {
    console.error(`❌ Error converting ${filePath}:`, error.message);
    stats.errors++;
  }
}

/**
 * Recursively walk directory
 */
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip excluded directories
      if (config.excludeDirs.includes(file)) {
        return;
      }
      walkDir(filePath);
    } else if (stat.isFile()) {
      // Process .js and .jsx files
      const ext = path.extname(file);
      if (ext === '.js' || ext === '.jsx') {
        convertFile(filePath);
      }
    }
  });
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 JavaScript to TypeScript Converter\n');
  console.log(`Source Directory: ${config.sourceDir}`);
  console.log(`Dry Run: ${config.dryRun ? 'YES' : 'NO'}`);
  console.log(`Create Backup: ${config.createBackup ? 'YES' : 'NO'}`);
  console.log('─'.repeat(50));
  
  if (!fs.existsSync(config.sourceDir)) {
    console.error(`❌ Source directory not found: ${config.sourceDir}`);
    process.exit(1);
  }
  
  // Start conversion
  walkDir(config.sourceDir);
  
  // Print summary
  console.log('\n' + '─'.repeat(50));
  console.log('📊 Conversion Summary:');
  console.log(`   Total files scanned: ${stats.total}`);
  console.log(`   ✅ Converted: ${stats.converted}`);
  console.log(`   ⏭️  Skipped: ${stats.skipped}`);
  console.log(`   ❌ Errors: ${stats.errors}`);
  console.log('─'.repeat(50));
  
  if (config.dryRun) {
    console.log('\n💡 This was a dry run. Use without --dry-run to actually convert files.');
  } else if (stats.converted > 0) {
    console.log('\n✨ Conversion complete! Run `npm start` to test your TypeScript project.');
    console.log('\n⚠️  Note: You may need to manually fix type errors. Check your IDE for TypeScript errors.');
  }
}

// Run the script
main();
