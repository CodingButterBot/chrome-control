/**
 * This script updates all test files to:
 * 1. Import Mocha functions explicitly
 * 2. Use path aliases for imports
 */

import fs from 'fs';
import path from 'path';
import pkg from 'glob';
const { glob } = pkg;

// Find all test files
const testFiles = await glob('src/**/*.__TEST__.ts', { windowsPathsNoEscape: true });
console.log(`Found ${testFiles.length} test files to update`);

// Function to update a file
async function updateFile(filePath) {
  console.log(`Processing ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add Mocha imports if they don't exist
  if (!content.includes('import { describe')) {
    content = content.replace(
      /(import[\s\S]*?from.*?['"]\s*;?)(\s*)/,
      "import { describe, it, before, beforeEach, after, afterEach } from 'mocha';\n$1$2"
    );
  }
  
  // Replace relative paths with aliases
  content = content.replace(
    /from ['"]\.\.\/\.\.\/\.\.\/(tests\/.*?)['"];?/g,
    "from '@$1';"
  );
  
  content = content.replace(
    /from ['"]\.\.\/\.\.\/\.\.\/src\/(.*?)['"];?/g,
    "from '@src/$1';"
  );
  
  content = content.replace(
    /from ['"]\.\.\/\.\.\/utils\/(.*?)['"];?/g,
    "from '@utils/$1';"
  );
  
  content = content.replace(
    /from ['"]\.\.\/\.\.\/types\/(.*?)['"];?/g,
    "from '@types/$1';"
  );
  
  // Write the updated content back
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

// Process all files
for (const filePath of testFiles) {
  await updateFile(filePath);
}

console.log('All test files updated successfully!');