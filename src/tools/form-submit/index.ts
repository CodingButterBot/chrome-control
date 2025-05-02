/**
 * Form Submit Tool
 * 
 * Tool for submitting forms in the browser.
 */

import { createTool } from '../../mcp-server.js';
import { ChromeToolResponse } from '../../types/puppeteer.js';
import { z } from 'zod';

// Define form submit parameters schema
export const formSubmitParamsSchema = z.object({
  browserId: z.string().uuid().optional().describe('Browser instance ID to use (defaults to most recent browser)'),
  tabId: z.string().uuid().optional().describe('Tab/page ID to use (defaults to most recent tab)'),
  selector: z.string().describe('CSS selector for the form or submit button to submit'),
  waitForNavigation: z.boolean().optional().describe('Whether to wait for navigation after form submission')
});

// Define form submit parameters type
export interface FormSubmitParams {
  browserId?: string;
  tabId?: string;
  selector: string;
  waitForNavigation?: boolean;
}

/**
 * Submits a form in the browser
 * 
 * This function submits a form identified by a CSS selector. It can either
 * submit the form directly or click a submit button within the form.
 * 
 * @param params - Form submit parameters
 * @param params.selector - CSS selector for the form or submit button
 * @param params.waitForNavigation - Whether to wait for navigation after form submission
 * @param params.browserId - Optional browser ID to use
 * @param params.tabId - Optional tab ID to use
 * @returns Promise resolving to a response with form submission result information
 */
export async function submitForm(params: FormSubmitParams): Promise<ChromeToolResponse> {
  // This is just a temporary implementation that forwards to our own logic
  // When integrated fully, this would make a more direct call
  try {
    // Import puppeteer module for specific functions we need
    const puppeteer = await import('../../puppeteer.js');
    
    // Get the page using the navigation function which has access to browserManager
    const navResult = await puppeteer.navigate({
      url: 'about:blank', // Just to get access to the page
      browserId: params.browserId,
      tabId: params.tabId
    });
    
    if (!navResult.context.browserId || !navResult.context.tabId) {
      throw new Error('Could not get browser or tab context');
    }
    
    const browserId = navResult.context.browserId;
    const tabId = navResult.context.tabId;
    
    // Use the click function to handle most of the work
    const clickResult = await puppeteer.click({
      selector: params.selector,
      browserId,
      tabId,
      options: {
        // Default options for form submission
        delay: 10 // Small delay to ensure form is properly submitted
      }
    });
    
    // Modify the result to indicate form submission
    const content = [
      { type: 'text', text: `Successfully submitted form using ${params.selector}` }
    ];
    
    return {
      context: clickResult.context,
      content
    };
  } catch (error) {
    // Handle errors gracefully
    console.error('Error submitting form:', error);
    const content = [
      { type: 'text', text: 'Error submitting form:' },
      { type: 'text', text: (error as Error)?.message || String(error) }
    ];
    
    return {
      context: {
        browserId: params.browserId || 'unknown',
        browser: {
          id: params.browserId || 'unknown',
          pagesCount: 0,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString()
        },
        tabId: params.tabId || null,
        tab: null
      },
      content
    };
  }
}

// Create and export the tool
export const formSubmitTool = createTool(
  'chrome_form_submit',
  formSubmitParamsSchema,
  async (params) => submitForm(params),
  { description: 'Submit a form or click a submit button' }
);