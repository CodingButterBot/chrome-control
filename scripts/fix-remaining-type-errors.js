#!/usr/bin/env node
/**
 * Fix remaining TypeScript errors in test files
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

// Helper to fix remaining TypeScript errors in a file
async function fixRemainingErrors(filePath) {
  console.log(`Processing ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let updatedContent = content;
  
  // 1. Fix string | null vs string | undefined type mismatch
  // This happens when we pass a string | null to a function expecting string | undefined
  
  // First, change the type declaration for variables
  const typePatterns = [
    { regex: /let browserId: string \| null = null;/g, replacement: 'let browserId: string | undefined;' },
    { regex: /let tabId: string \| null = null;/g, replacement: 'let tabId: string | undefined;' },
    { regex: /let firstTabId: string \| null = null;/g, replacement: 'let firstTabId: string | undefined;' },
    { regex: /let secondTabId: string \| null = null;/g, replacement: 'let secondTabId: string | undefined;' },
    { regex: /let remoteBrowserId: string \| null = null;/g, replacement: 'let remoteBrowserId: string | undefined;' },
    { regex: /let tabsToClose: string\[] = \[];/g, replacement: 'let tabsToClose: string[] = [];' }
  ];
  
  for (const pattern of typePatterns) {
    updatedContent = updatedContent.replace(pattern.regex, pattern.replacement);
  }
  
  // 2. Fix missing startMockServer and stopMockServer references
  // Add direct import for functions if they're missing but called in the code
  if (updatedContent.includes('startMockServer()') && !updatedContent.includes('startMockServer,')) {
    updatedContent = updatedContent.replace(
      /import {([^}]+)} from '@tests\/utils\/test-utils\.js';/,
      "import { startMockServer, stopMockServer, $1 } from '@tests/utils/test-utils.js';"
    );
  }
  
  // 3. Fix error with 'unknown' type
  // Cast error to any or Error type in catch blocks
  updatedContent = updatedContent.replace(
    /(catch\s*\()(\w+)(\)\s*{)/g,
    '$1$2: any$3'
  );
  
  // 4. Fix errors with string types in JSON.parse results
  // Add appropriate type assertions where needed
  if (filePath.includes('script-evaluate')) {
    updatedContent = updatedContent.replace(
      /JSON\.parse\(([^)]+)\)/g,
      'JSON.parse($1) as string'
    );
  }
  
  // 5. Fix errors with tabsToClose
  if (filePath.includes('createTab.__TEST__')) {
    updatedContent = updatedContent.replace(
      /let tabsToClose: any\[\];/g,
      'let tabsToClose: string[] = [];'
    );
  }
  
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
      const updated = await fixRemainingErrors(filePath);
      if (updated) updatedCount++;
    }
    
    console.log(`\nSummary: Updated ${updatedCount} of ${testFiles.length} test files`);
  } catch (error) {
    console.error('Error updating test files:', error);
    process.exit(1);
  }
}

main();