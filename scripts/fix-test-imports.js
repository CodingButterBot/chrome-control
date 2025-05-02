#!/usr/bin/env node
/**
 * Fix imports in test files to:
 * 1. Add .js extensions to local imports
 * 2. Fix path aliases
 * 3. Add type declarations
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

// Helper to fix imports in a file
async function fixImports(filePath) {
  console.log(`Processing ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let updatedContent = content;
  
  // 1. Add .js extensions to local imports from index
  updatedContent = updatedContent.replace(/from ['"]\.\/index['"]/g, "from './index.js'");
  
  // 2. Fix path aliases for test utils
  updatedContent = updatedContent.replace(
    /from ['"]\.\.\/\.\.\/\.\.\/tests\/utils\/test-utils['"]/g, 
    "from '@tests/utils/test-utils.js'"
  );
  updatedContent = updatedContent.replace(
    /from ['"]@tests\/utils\/test-utils['"]/g, 
    "from '@tests/utils/test-utils.js'"
  );
  
  // 3. Fix imports for test functions
  if (updatedContent.includes("import { startMockServer, stopMockServer, executeToolCall }")) {
    // Already has correct imports, no need to change
  } else if (updatedContent.includes("startMockServer")) {
    // Replace test function imports with the correct ones
    updatedContent = updatedContent.replace(
      /import {([^}]+)} from '@tests\/utils\/test-utils\.js'/,
      "import { startMockServer, stopMockServer, executeToolCall } from '@tests/utils/test-utils.js'"
    );
  }
  
  // 4. Add type declarations for common variables
  // This uses a simple approach - if we detect common variable patterns, add type declarations
  
  // Replace 'let server;' with 'let server: any;'
  updatedContent = updatedContent.replace(/let server;/g, 'let server: any;');
  
  // Replace other common untyped variables
  const variablePatterns = [
    { regex: /let browserId;/g, replacement: 'let browserId: string;' },
    { regex: /let tabId;/g, replacement: 'let tabId: string;' },
    { regex: /let firstTabId;/g, replacement: 'let firstTabId: string;' },
    { regex: /let secondTabId;/g, replacement: 'let secondTabId: string;' },
    { regex: /let remoteBrowserId;/g, replacement: 'let remoteBrowserId: string;' },
    { regex: /let tabsToClose;/g, replacement: 'let tabsToClose: string[] = [];' },
    { regex: /let url;/g, replacement: 'let url: string;' }
  ];
  
  for (const pattern of variablePatterns) {
    updatedContent = updatedContent.replace(pattern.regex, pattern.replacement);
  }
  
  // 5. Replace item => with (item: any) =>
  updatedContent = updatedContent.replace(/(\w+) =>/g, '($1: any) =>');
  
  // Save the updated content if changes were made
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
    const testFiles = glob.sync('src/tools/**/*.__TEST__.ts', { cwd: rootDir });
    console.log(`Found ${testFiles.length} test files to update`);
    
    let updatedCount = 0;
    
    // Update each test file
    for (const relativeFilePath of testFiles) {
      const filePath = path.join(rootDir, relativeFilePath);
      const updated = await fixImports(filePath);
      if (updated) updatedCount++;
    }
    
    console.log(`\nSummary: Updated ${updatedCount} of ${testFiles.length} test files`);
  } catch (error) {
    console.error('Error updating test files:', error);
    process.exit(1);
  }
}

main();