#!/usr/bin/env node
/**
 * Update Test Directories Script
 * 
 * This script updates all test files to use temporary directories
 * instead of the test-screenshots directory.
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
    
    // Skip if file doesn't contain test-screenshots or TEST_SCREENSHOT_DIR
    if (!content.includes('test-screenshots') && !content.includes('TEST_SCREENSHOT_DIR')) {
      return false;
    }
    
    // Get the test name from the path
    const pathParts = filePath.split('/');
    const toolName = pathParts[pathParts.length - 2]; // Get the tool directory name
    const testName = `${toolName}-tests`;
    
    // Replace the utility function definition if it exists
    const oldUtilityFunction = 
`// Define utility function locally since it may not be exported in the relative import
function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}`;

    const newUtilityImport = 
`// Import our test utils
import { createTempTestDirectory, cleanupTempDirectory } from '../../utils/test-utils.js';`;

    if (content.includes(oldUtilityFunction)) {
      content = content.replace(oldUtilityFunction, newUtilityImport);
    }
    
    // Replace the TEST_SCREENSHOT_DIR definition
    const screenshotDirRegex = /const TEST_SCREENSHOT_DIR = path\.join\(.+?test-screenshots.+?\);/;
    const tempDirRegex = /const TEST_SCREENSHOT_DIR = createTempTestDirectory\(.+?\);/;
    const newScreenshotDir = `const TEST_SCREENSHOT_DIR = createTempTestDirectory('${testName}');`;
    
    if (screenshotDirRegex.test(content)) {
      content = content.replace(screenshotDirRegex, newScreenshotDir);
    } else if (content.includes('TEST_SCREENSHOT_DIR') && !tempDirRegex.test(content)) {
      // Find where to insert the new TEST_SCREENSHOT_DIR definition
      const importSection = content.substring(0, content.indexOf('describe('));
      const lastImportIndex = importSection.lastIndexOf('import ');
      
      if (lastImportIndex !== -1) {
        let endOfImports = importSection.indexOf('\n\n', lastImportIndex);
        if (endOfImports === -1) endOfImports = importSection.length;
        
        // Add the import for test-utils if not already present
        if (!content.includes('import { createTempTestDirectory, cleanupTempDirectory }')) {
          content = content.substring(0, endOfImports) + 
                    '\nimport { createTempTestDirectory, cleanupTempDirectory } from \'../../utils/test-utils.js\';' + 
                    content.substring(endOfImports);
        }
        
        // Add the TEST_SCREENSHOT_DIR definition
        const describeIndex = content.indexOf('describe(');
        content = content.substring(0, describeIndex) + 
                  `\n// Setup test screenshot directory\n${newScreenshotDir}\n\n` + 
                  content.substring(describeIndex);
      }
    }
    
    // Replace the ensureDirectoryExists call if it exists
    if (content.includes('ensureDirectoryExists(TEST_SCREENSHOT_DIR)')) {
      content = content.replace(/ensureDirectoryExists\(TEST_SCREENSHOT_DIR\);/, '');
    }
    
    // Replace the cleanup code in after() hook if it exists
    const cleanupPattern = /\s+\/\/ Clean up any test artifacts\s+const screenshots = fs\.readdirSync\(TEST_SCREENSHOT_DIR\);[\s\S]+?}\);/;
    const newCleanup = '\n    // Clean up any test artifacts\n    cleanupTempDirectory(TEST_SCREENSHOT_DIR, [\'*.png\']);';
    
    if (cleanupPattern.test(content)) {
      content = content.replace(cleanupPattern, newCleanup);
    }
    
    // Write the updated content back to the file
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
    
    return true;
  } catch (error) {
    console.error(`Error updating ${filePath}: ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    // Find all test files
    const testFiles = await findFiles(path.join(rootDir, 'src/tools'), /\.__TEST__\.ts$/);
    
    console.log(`Found ${testFiles.length} test files to check`);
    
    let successCount = 0;
    
    // Update each file
    for (const filePath of testFiles) {
      const success = await updateTestFile(filePath);
      if (success) {
        successCount++;
      }
    }
    
    console.log(`Successfully updated ${successCount} test files to use temporary directories`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();