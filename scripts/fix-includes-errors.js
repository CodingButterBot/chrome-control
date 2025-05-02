#!/usr/bin/env node
/**
 * Fix TypeScript errors related to .includes() on content items
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

// Helper to fix includes errors in a file
async function fixIncludesErrors(filePath) {
  console.log(`Processing ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let updatedContent = content;
  
  // Replace problematic includes() calls with type-safe versions
  // Pattern: result.content[0].text.includes(...) -> typeof result.content[0].text === 'string' && result.content[0].text.includes(...)
  
  const patterns = [
    // result.content[0].text.includes
    {
      regex: /([a-zA-Z0-9_]+)\.content\[([0-9]+)\]\.text\.includes\(/g,
      replacement: 'typeof $1.content[$2].text === "string" && $1.content[$2].text.includes('
    },
    // item.text.includes
    {
      regex: /([a-zA-Z0-9_]+)\.text\.includes\(/g,
      replacement: 'typeof $1.text === "string" && $1.text.includes('
    },
    // item.text.match
    {
      regex: /([a-zA-Z0-9_]+)\.text\.match\(/g,
      replacement: 'typeof $1.text === "string" && $1.text.match('
    }
  ];
  
  for (const pattern of patterns) {
    updatedContent = updatedContent.replace(pattern.regex, pattern.replacement);
  }
  
  // Fix variable declarations
  // Pattern: let browserId; -> let browserId: string | null = null;
  
  const variablePatterns = [
    { regex: /let browserId: string;/g, replacement: 'let browserId: string | null = null;' },
    { regex: /let tabId: string;/g, replacement: 'let tabId: string | null = null;' },
    { regex: /let firstTabId: string;/g, replacement: 'let firstTabId: string | null = null;' },
    { regex: /let secondTabId: string;/g, replacement: 'let secondTabId: string | null = null;' },
    { regex: /let remoteBrowserId: string;/g, replacement: 'let remoteBrowserId: string | null = null;' },
    { regex: /let tabsToClose: string\[] = \[];/g, replacement: 'let tabsToClose: string[] = [];' }
  ];
  
  for (const pattern of variablePatterns) {
    updatedContent = updatedContent.replace(pattern.regex, pattern.replacement);
  }
  
  // Replace browserManager references with correct ones
  updatedContent = updatedContent.replace(/browserManager\./g, 'require("@src/browser-manager.js").');
  
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
      const updated = await fixIncludesErrors(filePath);
      if (updated) updatedCount++;
    }
    
    console.log(`\nSummary: Updated ${updatedCount} of ${testFiles.length} test files`);
  } catch (error) {
    console.error('Error updating test files:', error);
    process.exit(1);
  }
}

main();