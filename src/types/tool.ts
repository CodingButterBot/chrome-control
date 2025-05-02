/**
 * Tool type definitions
 * 
 * Defines the structure of tools used by the Chrome Control MCP server for LLM integration.
 * These types provide the foundation for all browser automation tools exposed via MCP.
 * 
 * @module types/tool
 */

import { z } from 'zod';

/**
 * Represents a tool that can be registered with the MCP server
 * 
 * Each tool implements functionality for browser automation and is exposed
 * to Large Language Models through the Model Context Protocol.
 * 
 * @typeParam T - The Zod schema type used to validate parameters
 */
export interface Tool<T extends z.ZodTypeAny> {
  /**
   * The name of the tool, must be unique
   * 
   * By convention, Chrome Control tools are prefixed with "chrome_"
   * followed by the action name (e.g., "chrome_navigate").
   * 
   * @example "chrome_navigate"
   * @example "chrome_screenshot" 
   */
  name: string;
  
  /**
   * Zod schema for validating tool parameters
   * 
   * Used to validate and type-check parameters passed from LLMs before
   * executing the tool's handler function.
   * 
   * @see {@link https://zod.dev/ | Zod documentation}
   */
  schema: T;
  
  /**
   * Function to handle tool execution
   * 
   * This async function receives validated parameters and performs the actual
   * browser automation task. It returns a standardized response format that
   * can be consumed by LLMs.
   * 
   * @param params - Validated parameters for the tool, typed according to the schema
   * @returns Promise resolving to a structured content object with text and/or image data
   */
  handler: (params: z.infer<T>) => Promise<{
    /**
     * Array of content items that make up the tool's response
     * 
     * Each item has a type and either text content or image content
     * in a format that can be processed by LLMs.
     */
    content: Array<{ 
      /** The type of content, typically "text" */
      type: string; 
      /** 
       * The actual content, either a string for text or an object with src/alt
       * properties for images 
       */
      text: string | { 
        /** Image source, typically a base64-encoded data URI */
        src: string; 
        /** Alt text describing the image for LLMs with vision capabilities */
        alt: string; 
      } 
    }>;
  }>;
  
  /**
   * Tool metadata
   * 
   * Contains information about the tool that is used for documentation
   * and discovery purposes when tools are registered with MCP.
   */
  options: {
    /**
     * Human-readable description of the tool
     * 
     * This description is used to help LLMs understand what the tool does
     * and when to use it.
     * 
     * @example "Navigate to a URL with optional response format customization"
     */
    description: string;
  };
}