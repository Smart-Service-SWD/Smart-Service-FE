#!/usr/bin/env node
/**
 * Script to update import statements after JS->TS conversion
 * Updates import paths from .js/.jsx to .ts/.tsx
 * Usage: node scripts/update-imports.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const config = {
  sourceDir: path.join(__dirname, '..', 'src'),
  excludeDirs: ['node_modules', 'build', 'dist', '.expo', 'android', 'ios'],
  dryRun: process.argv.includes('--dry-run'),
};

let filesUpdated = 0;
let importsUpdated = 0;

/**
 * Update import statements in a file
 */
function updateImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = content;
    let fileChanged = false;
    
    // Pattern to match imports with .js or .jsx extensions
    const importPatterns = [
      // import ... from './path.js'
      /from\s+['"]([^'"]+)\.(jsx?)['"]/g,
      // import('./path.js')
      /import\s*\(\s*['"]([^'"]+)\.(jsx?)['"]\s*\)/g,
      // require('./path.js')
      /require\s*\(\s*['"]([^'"]+)\.(jsx?)['"]\s*\)/g,
    ];
    
    importPatterns.forEach(pattern => {
      modified = modified.replace(pattern, (match, pathPart, ext) => {
        fileChanged = true;
        importsUpdated++;
        
        // Determine if it should be .ts or .tsx
        const newExt = ext === 'jsx' ? 'tsx' : 'ts';
        
        // Check if the actual file exists to determine correct extension
        const baseDir = path.dirname(filePath);
        const targetPath = path.resolve(baseDir, pathPart);
        
        if (fs.existsSync(targetPath + '.tsx')) {
          return match.replace(`.${ext}`, '.tsx');
        } else if (fs.existsSync(targetPath + '.ts')) {
          return match.replace(`.${ext}`, '.ts');
        }
        
        // Default behavior
        return match.replace(`.${ext}`, `.${newExt}`);
      });
    });
    
    if (fileChanged) {
      if (!config.dryRun) {
        fs.writeFileSync(filePath, modified, 'utf8');
      }
      filesUpdated++;
      console.log(`✅ Updated imports in: ${path.relative(config.sourceDir, filePath)}`);
    }
    
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
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
      if (config.excludeDirs.includes(file)) return;
      walkDir(filePath);
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') {
        updateImports(filePath);
      }
    }
  });
}

/**
 * Main execution
 */
function main() {
  console.log('🔄 Import Statement Updater\n');
  console.log(`Source Directory: ${config.sourceDir}`);
  console.log(`Dry Run: ${config.dryRun ? 'YES' : 'NO'}`);
  console.log('─'.repeat(50));
  
  walkDir(config.sourceDir);
  
  console.log('\n' + '─'.repeat(50));
  console.log('📊 Update Summary:');
  console.log(`   Files updated: ${filesUpdated}`);
  console.log(`   Imports updated: ${importsUpdated}`);
  console.log('─'.repeat(50));
  
  if (config.dryRun) {
    console.log('\n💡 This was a dry run. Use without --dry-run to actually update imports.');
  }
}

main();
