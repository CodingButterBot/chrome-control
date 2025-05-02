/**
 * Utility functions for the mouse control tests
 */

import fs from 'fs';

/**
 * Ensures a directory exists, creating it if it doesn't
 * 
 * @param dir Directory path to ensure exists
 */
export function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}