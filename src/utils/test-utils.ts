/**
 * Utility functions for tests
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Creates a temporary directory for test artifacts
 * 
 * @param {string} testName Name of the test for subdirectory
 * @returns {string} Path to the temporary directory
 */
export function createTempTestDirectory(testName: string): string {
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
export function cleanupTempDirectory(tempDir: string, patterns: string[] = ['*.png']): void {
  if (!fs.existsSync(tempDir)) return;
  
  const files = fs.readdirSync(tempDir);
  
  for (const file of files) {
    // Simple pattern matching (can be enhanced if needed)
    if (patterns.some(pattern => {
      const regex = new RegExp(
        pattern.replace('.', '\\.').replace('*', '.*')
      );
      return regex.test(file);
    })) {
      fs.unlinkSync(path.join(tempDir, file));
    }
  }
}