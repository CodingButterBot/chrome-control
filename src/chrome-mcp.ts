#!/usr/bin/env node
/**
 * Chrome Control CLI
 * 
 * This is the main CLI entry point that gets installed as a binary
 * when users install the package. It simply forwards to the main index file.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the main entry point
const MAIN_ENTRY_PATH = path.join(__dirname, 'index.js');

// Forward all arguments to the main entry point
const args = [MAIN_ENTRY_PATH, ...process.argv.slice(2)];

// Spawn the main entry point as a child process
const child = spawn('node', args, {
  stdio: 'inherit' // Inherit stdin/stdout/stderr from parent
});

// Handle child process exit
child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Process terminated due to signal: ${signal}`);
    process.exit(1);
  } else {
    process.exit(code !== null ? code : 0);
  }
});

// Forward signals to child process
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    if (!child.killed) {
      // @ts-expect-error - NodeJS.Signals type is being difficult
      child.kill(signal);
    }
  });
});