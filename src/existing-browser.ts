/**
 * Existing Browser Manager
 * 
 * This module provides functionality to detect and connect to already running
 * Chrome browser instances. This allows Chrome Control to interact with user's
 * existing Chrome sessions, including their user profiles, cookies, and logged-in states.
 * 
 * Key features:
 * - Detection of existing Chrome processes
 * - Connection to existing debug instances
 * - Listing available Chrome user profiles
 * - Connection to specific user profiles
 * 
 * This approach offers several benefits:
 * - Users can leverage existing login sessions
 * - Avoids creating multiple browser instances
 * - Provides a seamless experience between manual and automated browsing
 * 
 * @module existing-browser
 */

import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import puppeteer from 'puppeteer-core';
import { Browser } from 'puppeteer';
import { createLogger, LogLevel } from './utils/logger.js';

// Create a logger instance
const logger = createLogger('existing-browser');
const execAsync = promisify(exec);

// Interface for detected Chrome instances
export interface ChromeInstance {
  pid: number;
  command: string;
  debugPort?: number;
  userDataDir?: string;
  profileName?: string;
}

// Interface for Chrome user profiles
export interface ChromeProfile {
  name: string;
  path: string;
  isActive: boolean;
  lastUsed?: Date;
}

/**
 * Detects running Chrome/Chromium processes on the system
 * 
 * This function uses platform-specific commands to detect running
 * Chrome or Chromium browser processes and their command-line arguments.
 * 
 * @returns Promise<ChromeInstance[]> List of detected Chrome instances
 */
export async function detectRunningChromeInstances(): Promise<ChromeInstance[]> {
  const platform = os.platform();
  let command = '';
  
  logger.info(`Detecting Chrome instances on ${platform}`);
  
  // Platform-specific process detection
  switch (platform) {
    case 'linux':
      command = 'ps -eo pid,args | grep -E "chrome|chromium" | grep -v grep';
      break;
    case 'darwin': // macOS
      command = 'ps -eo pid,args | grep -E "Google Chrome|Chromium" | grep -v grep';
      break;
    case 'win32': // Windows
      command = 'wmic process where "name like \'%chrome.exe%\'" get processid,commandline';
      break;
    default:
      logger.warn(`Unsupported platform: ${platform}`);
      return [];
  }
  
  try {
    const { stdout } = await execAsync(command);
    const instances: ChromeInstance[] = [];
    
    // Parse output based on platform
    const lines = stdout.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      // Skip browser helpers and renderer processes
      if (line.includes('--type=renderer') || 
          line.includes('--type=utility') || 
          line.includes('--type=gpu-process')) {
        continue;
      }
      
      // Extract PID and command line
      let pid: number;
      let cmd: string;
      
      if (platform === 'win32') {
        // Windows WMIC format is different
        const parts = line.trim().split(/\s+/);
        pid = parseInt(parts[parts.length - 1], 10);
        cmd = parts.slice(0, -1).join(' ');
      } else {
        // Unix-like format
        const parts = line.trim().split(/\s+/);
        pid = parseInt(parts[0], 10);
        cmd = parts.slice(1).join(' ');
      }
      
      if (!isNaN(pid)) {
        // Extract remote debugging port if available
        const debugPortMatch = cmd.match(/--remote-debugging-port=(\d+)/);
        const debugPort = debugPortMatch ? parseInt(debugPortMatch[1], 10) : undefined;
        
        // Extract user data directory if available
        const userDataMatch = cmd.match(/--user-data-dir=([^\s"]+)/);
        const userDataDir = userDataMatch ? userDataMatch[1] : undefined;
        
        // Extract profile name if available
        const profileMatch = cmd.match(/--profile-directory=([^\s"]+)/);
        const profileName = profileMatch ? profileMatch[1] : undefined;
        
        instances.push({
          pid,
          command: cmd,
          debugPort,
          userDataDir,
          profileName
        });
        
        logger.debug(`Found Chrome instance: PID ${pid}, Debug Port: ${debugPort || 'none'}, Profile: ${profileName || 'default'}`);
      }
    }
    
    logger.info(`Detected ${instances.length} Chrome instances`);
    return instances;
  } catch (error) {
    logger.exception(error, 'Error detecting Chrome instances');
    return [];
  }
}

/**
 * Finds available debug ports for existing Chrome instances
 * 
 * Searches for Chrome processes that have remote debugging enabled
 * and returns their connection details.
 * 
 * @returns Promise<{port: number, pid: number}[]> List of available debug ports
 */
export async function findAvailableDebugPorts(): Promise<{port: number, pid: number}[]> {
  const instances = await detectRunningChromeInstances();
  return instances
    .filter(instance => instance.debugPort !== undefined)
    .map(instance => ({
      port: instance.debugPort!,
      pid: instance.pid
    }));
}

/**
 * Connects to an existing Chrome instance using a debug port
 * 
 * @param port Debug port number to connect to
 * @returns Promise<Browser> Connected browser instance
 * @throws Error if connection fails
 */
export async function connectToExistingChromeInstance(port: number): Promise<Browser> {
  logger.info(`Connecting to existing Chrome instance on port ${port}`);
  
  try {
    const browser = await puppeteer.connect({
      browserURL: `http://localhost:${port}`,
      defaultViewport: null
    });
    
    logger.info(`Successfully connected to Chrome on port ${port}`);
    // The casts are needed because puppeteer-core and puppeteer have slightly different Browser types
  return browser as any;
  } catch (error) {
    logger.exception(error, `Failed to connect to Chrome on port ${port}`);
    throw new Error(`Failed to connect to Chrome on port ${port}: ${(error as Error).message}`);
  }
}

/**
 * Gets Chrome user profile directories
 * 
 * @returns Promise<ChromeProfile[]> List of available Chrome profiles
 */
export async function getChromeProfiles(): Promise<ChromeProfile[]> {
  const platform = os.platform();
  let userDataDir = '';
  
  logger.info(`Getting Chrome profiles on ${platform}`);
  
  // Platform-specific paths for Chrome user data
  switch (platform) {
    case 'linux':
      userDataDir = path.join(os.homedir(), '.config', 'google-chrome');
      break;
    case 'darwin': // macOS
      userDataDir = path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome');
      break;
    case 'win32': // Windows
      userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
      break;
    default:
      logger.warn(`Unsupported platform: ${platform}`);
      return [];
  }
  
  try {
    // Check if directory exists
    if (!fs.existsSync(userDataDir)) {
      logger.warn(`Chrome user data directory not found: ${userDataDir}`);
      return [];
    }
    
    const profilesDir = path.join(userDataDir, 'Default');
    const profiles: ChromeProfile[] = [];
    
    // Add default profile
    if (fs.existsSync(profilesDir)) {
      const preferencesPath = path.join(profilesDir, 'Preferences');
      let lastUsed: Date | undefined;
      
      if (fs.existsSync(preferencesPath)) {
        try {
          const preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
          const lastUsedStr = preferences?.profile?.last_used;
          if (lastUsedStr) {
            lastUsed = new Date(lastUsedStr);
          }
        } catch (error) {
          logger.warn('Error parsing Chrome preferences file');
        }
      }
      
      // Get active instances to check if profile is currently in use
      const instances = await detectRunningChromeInstances();
      const isActive = instances.some(instance => 
        instance.userDataDir === userDataDir && !instance.profileName);
      
      profiles.push({
        name: 'Default',
        path: profilesDir,
        isActive,
        lastUsed
      });
    }
    
    // Check for additional profiles
    const items = fs.readdirSync(userDataDir);
    const profileDirs = items.filter(item => 
      item.startsWith('Profile ') && 
      fs.statSync(path.join(userDataDir, item)).isDirectory()
    );
    
    // Get active instances to check which profiles are active
    const instances = await detectRunningChromeInstances();
    
    for (const profileDir of profileDirs) {
      const profilePath = path.join(userDataDir, profileDir);
      const preferencesPath = path.join(profilePath, 'Preferences');
      let lastUsed: Date | undefined;
      let profileName = profileDir;
      
      if (fs.existsSync(preferencesPath)) {
        try {
          const preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
          if (preferences?.profile?.name) {
            profileName = preferences.profile.name;
          }
          
          const lastUsedStr = preferences?.profile?.last_used;
          if (lastUsedStr) {
            lastUsed = new Date(lastUsedStr);
          }
        } catch (error) {
          logger.warn(`Error parsing Chrome preferences for profile ${profileDir}`);
        }
      }
      
      // Check if profile is currently in use
      const isActive = instances.some(instance => 
        instance.userDataDir === userDataDir && 
        instance.profileName === profileDir);
      
      profiles.push({
        name: profileName,
        path: profilePath,
        isActive,
        lastUsed
      });
    }
    
    // Sort profiles by last used (most recent first)
    profiles.sort((a, b) => {
      if (!a.lastUsed && !b.lastUsed) return 0;
      if (!a.lastUsed) return 1;
      if (!b.lastUsed) return -1;
      return b.lastUsed.getTime() - a.lastUsed.getTime();
    });
    
    logger.info(`Found ${profiles.length} Chrome profiles`);
    return profiles;
  } catch (error) {
    logger.exception(error, 'Error getting Chrome profiles');
    return [];
  }
}

/**
 * Launches Chrome with a specific user profile
 * 
 * This function will launch a new Chrome instance with debugging enabled
 * and using a specific user profile.
 * 
 * @param profileName Name of the profile to use ('Default' or 'Profile X')
 * @param debugPort Optional port to use for debugging (default: random available port)
 * @returns Promise<{browser: Browser, port: number}> Connected browser and debug port
 */
export async function launchWithProfile(
  profileName: string = 'Default',
  debugPort?: number
): Promise<{browser: Browser, port: number}> {
  const platform = os.platform();
  let userDataDir = '';
  let chromePath = '';
  
  logger.info(`Launching Chrome with profile ${profileName}`);
  
  // Platform-specific paths
  switch (platform) {
    case 'linux':
      userDataDir = path.join(os.homedir(), '.config', 'google-chrome');
      chromePath = '/usr/bin/google-chrome';
      break;
    case 'darwin': // macOS
      userDataDir = path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome');
      chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      break;
    case 'win32': // Windows
      userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
      chromePath = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe');
      if (!fs.existsSync(chromePath)) {
        // Try Program Files path
        chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
        if (!fs.existsSync(chromePath)) {
          chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
        }
      }
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
  
  // Ensure Chrome path exists
  if (!fs.existsSync(chromePath)) {
    throw new Error(`Chrome executable not found: ${chromePath}`);
  }
  
  // Use a random port if none specified
  const port = debugPort || Math.floor(Math.random() * 1000) + 9222;
  
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`
  ];
  
  // Add profile-directory if not Default
  if (profileName !== 'Default') {
    args.push(`--profile-directory=${profileName}`);
  }
  
  logger.debug(`Launching Chrome with command: ${chromePath} ${args.join(' ')}`);
  
  // Launch Chrome process
  const chromeProcess = exec(`"${chromePath}" ${args.join(' ')}`);
  
  // Wait for Chrome to initialize and debugging port to be available
  await new Promise<void>((resolve) => {
    const checkPort = async () => {
      try {
        await fetch(`http://localhost:${port}/json/version`);
        resolve();
      } catch (error) {
        // Port not ready yet, wait and try again
        setTimeout(checkPort, 100);
      }
    };
    checkPort();
  });
  
  logger.info(`Chrome launched with debugging port ${port}`);
  
  // Connect to the browser
  const browser = await puppeteer.connect({
    browserURL: `http://localhost:${port}`,
    defaultViewport: null
  });
  
  // The casts are needed because puppeteer-core and puppeteer have slightly different Browser types
  return { browser: browser as any, port };
}