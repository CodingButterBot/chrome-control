#!/usr/bin/env node
/**
 * Fix Path Aliases Script
 * 
 * This script updates all import statements in tool files from path aliases
 * to relative paths.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Function to get all tool files
async function findToolFiles() {
  const toolsDir = path.join(rootDir, 'src', 'tools');
  const files = [];
  
  // Get all tool directories
  const toolDirs = await fs.readdir(toolsDir, { withFileTypes: true });
  
  for (const dir of toolDirs) {
    if (dir.isDirectory() && dir.name !== 'node_modules') {
      const indexPath = path.join(toolsDir, dir.name, 'index.ts');
      try {
        await fs.access(indexPath);
        files.push(indexPath);
      } catch (error) {
        // If index.ts doesn't exist, skip this directory
        continue;
      }
    }
  }
  
  return files;
}

// Function to update imports in a file
async function updateFileImports(filePath) {
  try {
    console.log(`Processing ${filePath}`);
    let content = await fs.readFile(filePath, 'utf8');
    let updated = false;
    
    // Get the relative path from the file to src directory
    const srcDir = path.join(rootDir, 'src');
    const fileDir = path.dirname(filePath);
    const relativePath = path.relative(fileDir, srcDir);
    
    // Replace @src/ imports
    if (content.includes('@src/')) {
      content = content.replace(/@src\//g, `${relativePath}/`);
      updated = true;
    }
    
    // Replace @tools/ imports
    if (content.includes('@tools/')) {
      content = content.replace(/@tools\//g, `${relativePath}/tools/`);
      updated = true;
    }
    
    // Replace @utils/ imports
    if (content.includes('@utils/')) {
      content = content.replace(/@utils\//g, `${relativePath}/utils/`);
      updated = true;
    }
    
    // Replace @types/ imports
    if (content.includes('@types/')) {
      content = content.replace(/@types\//g, `${relativePath}/types/`);
      updated = true;
    }
    
    // Replace @tests/ imports
    if (content.includes('@tests/')) {
      const testsDir = path.join(rootDir, 'tests');
      const relativeToTests = path.relative(fileDir, testsDir);
      content = content.replace(/@tests\//g, `${relativeToTests}/`);
      updated = true;
    }
    
    // Replace direct imports from src
    if (content.includes("from 'src/")) {
      content = content.replace(/from ['"]src\//g, `from '${relativePath}/`);
      updated = true;
    }
    
    // Write the updated content back to the file
    if (updated) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✓ Updated ${filePath}`);
    } else {
      console.log(`✓ No changes needed for ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}: ${error.message}`);
  }
}

// Main function
async function main() {
  try {
    const files = await findToolFiles();
    console.log(`Found ${files.length} tool files to update`);
    
    // Process each file
    for (const file of files) {
      await updateFileImports(file);
    }
    
    console.log('\nPath alias update completed!');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main();