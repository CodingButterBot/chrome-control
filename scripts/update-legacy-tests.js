#!/usr/bin/env node
/**
 * Update Legacy Test Files Script
 * 
 * This script updates the legacy test files in tests/ directory
 * to use temporary directories instead of the test-screenshots directory.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Function to get all files with a specific pattern recursively
async function findFiles(dir, pattern) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...await findFiles(fullPath, pattern));
    } else if (pattern.test(entry.name)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function updateTestFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // Skip if file doesn't contain test-screenshots
    if (!content.includes('test-screenshots')) {
      return false;
    }
    
    // Get the test name from the path
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1]; // Get the filename
    const testName = fileName.replace('.test.js', '').replace('-test.js', '');
    
    // Add necessary imports for CommonJS and ESM
    let updatedContent = content;
    
    // Check if file uses CommonJS or ESM
    const isESM = content.includes('import ') && content.includes('from ');
    
    if (isESM) {
      // Add imports for ESM
      if (!content.includes('import os from ')) {
        // Find where to add the import
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
          let endOfImports = content.indexOf('\n\n', lastImportIndex);
          if (endOfImports === -1) endOfImports = content.indexOf('\n', lastImportIndex);
          
          updatedContent = content.substring(0, endOfImports) + 
                          '\nimport os from \'os\';\n' + 
                          content.substring(endOfImports);
        }
      }
      
      // Add utility functions for ESM
      const utilityFunctions = `
/**
 * Creates a temporary directory for test artifacts
 * 
 * @param {string} testName Name of the test for subdirectory
 * @returns {string} Path to the temporary directory
 */
function createTempTestDirectory(testName) {
  const tempDir = path.join(os.tmpdir(), 'chrome-control-tests', testName);
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  return tempDir;
}

/**
 * Cleans up temporary test directories
 * 
 * @param {string} tempDir Path to the temporary directory
 * @param {string[]} patterns File patterns to delete (default: ['*.png'])
 */
function cleanupTempDirectory(tempDir, patterns = ['*.png']) {
  if (!fs.existsSync(tempDir)) return;
  
  const files = fs.readdirSync(tempDir);
  
  for (const file of files) {
    // Simple pattern matching
    if (patterns.some(pattern => {
      const regex = new RegExp(
        pattern.replace('.', '\\.').replace('*', '.*')
      );
      return regex.test(file);
    })) {
      fs.unlinkSync(path.join(tempDir, file));
    }
  }
}`;
      
      // Add utility functions if they don't exist
      if (!content.includes('createTempTestDirectory') && !content.includes('cleanupTempDirectory')) {
        const utilityInsertPoint = content.indexOf('// Constants') !== -1 
          ? content.indexOf('// Constants')
          : content.indexOf('const ');
        
        if (utilityInsertPoint !== -1) {
          updatedContent = updatedContent.substring(0, utilityInsertPoint) + 
                         utilityFunctions + 
                         '\n' + updatedContent.substring(utilityInsertPoint);
        }
      }
    } else {
      // Add imports for CommonJS
      if (!content.includes('const os = require(')) {
        // Find where to add the require
        const lastRequireIndex = content.lastIndexOf('const ');
        if (lastRequireIndex !== -1) {
          let endOfRequires = content.indexOf('\n\n', lastRequireIndex);
          if (endOfRequires === -1) endOfRequires = content.indexOf('\n', lastRequireIndex);
          
          updatedContent = content.substring(0, endOfRequires) + 
                          '\nconst os = require(\'os\');\n' + 
                          content.substring(endOfRequires);
        }
      }
      
      // Add utility functions for CommonJS
      const utilityFunctions = `
/**
 * Creates a temporary directory for test artifacts
 * 
 * @param {string} testName Name of the test for subdirectory
 * @returns {string} Path to the temporary directory
 */
function createTempTestDirectory(testName) {
  const tempDir = path.join(os.tmpdir(), 'chrome-control-tests', testName);
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  return tempDir;
}

/**
 * Cleans up temporary test directories
 * 
 * @param {string} tempDir Path to the temporary directory
 * @param {string[]} patterns File patterns to delete (default: ['*.png'])
 */
function cleanupTempDirectory(tempDir, patterns = ['*.png']) {
  if (!fs.existsSync(tempDir)) return;
  
  const files = fs.readdirSync(tempDir);
  
  for (const file of files) {
    // Simple pattern matching
    if (patterns.some(pattern => {
      const regex = new RegExp(
        pattern.replace('.', '\\.').replace('*', '.*')
      );
      return regex.test(file);
    })) {
      fs.unlinkSync(path.join(tempDir, file));
    }
  }
}`;
      
      // Add utility functions if they don't exist
      if (!content.includes('createTempTestDirectory') && !content.includes('cleanupTempDirectory')) {
        if (content.includes('// Setup test screenshot directory')) {
          updatedContent = updatedContent.replace('// Setup test screenshot directory', utilityFunctions + '\n\n// Setup test screenshot directory');
        } else {
          const insertPoint = content.indexOf('describe(');
          if (insertPoint !== -1) {
            updatedContent = updatedContent.substring(0, insertPoint) + 
                          utilityFunctions + 
                          '\n\n' + updatedContent.substring(insertPoint);
          }
        }
      }
    }
    
    // Replace the TEST_SCREENSHOT_DIR definition
    const screenshotDirRegex = /const (\w+) = path\.join\(.*?test-screenshots.*?\);/g;
    const matches = [...updatedContent.matchAll(screenshotDirRegex)];
    
    for (const match of matches) {
      const varName = match[1];
      const newDef = `const ${varName} = createTempTestDirectory('${testName}');`;
      updatedContent = updatedContent.replace(match[0], newDef);
    }
    
    // Replace the ensureDirectoryExists call if it exists
    if (updatedContent.includes('ensureDirectoryExists(')) {
      const ensureDirRegex = /ensureDirectoryExists\(([^)]+)\);/g;
      updatedContent = updatedContent.replace(ensureDirRegex, '');
    }
    
    // Replace the cleanup code in after() hook if it exists
    const cleanupPattern = /\/\/ Clean up any (screenshots|test artifacts)[\s\S]*?fs\.unlinkSync\(.*?\);[\s\S]*?\}\);/g;
    const cleanupMatches = [...updatedContent.matchAll(cleanupPattern)];
    
    for (const match of cleanupMatches) {
      // Extract the directory variable name from the cleanup code
      const dirVarMatch = match[0].match(/fs\.readdirSync\(([^)]+)\)/);
      if (dirVarMatch) {
        const dirVar = dirVarMatch[1];
        const newCleanup = `// Clean up any test artifacts\n    cleanupTempDirectory(${dirVar});\n  });`;
        updatedContent = updatedContent.replace(match[0], newCleanup);
      }
    }
    
    // Write the updated content back to the file
    await fs.writeFile(filePath, updatedContent, 'utf8');
    console.log(`Updated ${filePath}`);
    
    return true;
  } catch (error) {
    console.error(`Error updating ${filePath}: ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    // Find all test files in tests directory
    const testFiles = await findFiles(path.join(rootDir, 'tests'), /\.(test|sim|sim-test)\.js$/);
    
    console.log(`Found ${testFiles.length} legacy test files to check`);
    
    let successCount = 0;
    
    // Update each file
    for (const filePath of testFiles) {
      const success = await updateTestFile(filePath);
      if (success) {
        successCount++;
      }
    }
    
    console.log(`Successfully updated ${successCount} legacy test files to use temporary directories`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();