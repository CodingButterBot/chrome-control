#!/usr/bin/env node
/**
 * Update all test files to use:
 * 1. Explicit Mocha imports
 * 2. Path aliases instead of relative imports
 * 3. Proper import syntax without .js extensions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pkg from 'glob';
const { glob } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Helper to determine which Mocha functions are used in a file
function determineMochaImports(content) {
  const imports = ['describe']; // Always import describe
  
  if (content.includes('it(')) imports.push('it');
  if (content.includes('before(')) imports.push('before');
  if (content.includes('beforeEach(')) imports.push('beforeEach');
  if (content.includes('after(')) imports.push('after');
  if (content.includes('afterEach(')) imports.push('afterEach');
  
  return imports;
}

// Helper to update a test file
async function updateTestFile(filePath) {
  console.log(`Processing ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  let updatedContent = content;
  
  // 1. Add Mocha imports if needed
  if (!updatedContent.includes("from 'mocha'")) {
    const mochaImports = determineMochaImports(content);
    const importStatement = `import { ${mochaImports.join(', ')} } from 'mocha';\n`;
    
    // Find the first import statement
    const firstImportMatch = updatedContent.match(/import .+ from ['"]/);
    if (firstImportMatch) {
      const index = firstImportMatch.index;
      updatedContent = updatedContent.slice(0, index) + importStatement + updatedContent.slice(index);
    } else {
      // No imports found, add after comments at the top
      const endOfComments = updatedContent.indexOf('*/') + 2;
      if (endOfComments > 2) {
        updatedContent = updatedContent.slice(0, endOfComments) + '\n\n' + importStatement + updatedContent.slice(endOfComments);
      } else {
        updatedContent = importStatement + updatedContent;
      }
    }
  }
  
  // 2. Remove .js extensions from imports
  updatedContent = updatedContent.replace(/from ['"]\.\/index\.js['"]/g, "from './index'");
  updatedContent = updatedContent.replace(/from ['"]@tests\/(.+)\.js['"]/g, "from '@tests/$1'");
  
  // 3. Replace relative path imports with path aliases
  updatedContent = updatedContent.replace(
    /from ['"]\.\.\/\.\.\/\.\.\/tests\/(.+)['"]/g, 
    "from '@tests/$1'"
  );
  
  // 4. Save the updated file if changes were made
  if (updatedContent !== content) {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Updated ${filePath}`);
    return true;
  }
  
  console.log(`No changes needed for ${filePath}`);
  return false;
}

// Main function to process all test files
async function main() {
  try {
    // Find all test files
    const testFiles = glob.sync('src/**/*.__TEST__.ts', { cwd: rootDir });
    console.log(`Found ${testFiles.length} test files to update`);
    
    let updatedCount = 0;
    
    // Update each test file
    for (const relativeFilePath of testFiles) {
      const filePath = path.join(rootDir, relativeFilePath);
      const updated = await updateTestFile(filePath);
      if (updated) updatedCount++;
    }
    
    console.log(`\nSummary: Updated ${updatedCount} of ${testFiles.length} test files`);
  } catch (error) {
    console.error('Error updating test files:', error);
    process.exit(1);
  }
}

main();