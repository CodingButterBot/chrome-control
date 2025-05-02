/**
 * MCP Server Implementation
 * 
 * Provides a standardized server for Chrome Control specifically designed for
 * integration with AI Large Language Models (LLMs) through the Model Context 
 * Protocol (MCP).
 * 
 * This module implements the core MCP server functionality that powers the Chrome Control
 * system. It handles tool registration, execution, and communication with LLM platforms
 * through the MCP protocol.
 * 
 * @module mcp-server
 * @preferred
 * 
 * @example
 * ```typescript
 * import { McpServer, createTool } from './mcp-server.js';
 * import { z } from 'zod';
 * 
 * // Create a new MCP server
 * const server = new McpServer();
 * 
 * // Create and register a simple tool
 * const helloTool = createTool(
 *   'chrome_hello',
 *   z.object({ name: z.string().optional() }),
 *   async (params) => {
 *     return {
 *       content: [
 *         { type: 'text', text: `Hello, ${params.name || 'World'}!` }
 *       ]
 *     };
 *   },
 *   { description: 'Say hello to someone' }
 * );
 * 
 * // Register the tool with the server
 * server.registerTool(helloTool);
 * 
 * // Start the server
 * await server.start();
 * ```
 */

import { z } from 'zod';
import { McpServer as BaseMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Tool } from './types/tool.js';

/**
 * Configuration interface for the MCP Server
 * 
 * Defines the configuration options that can be provided when creating
 * a new MCP server instance. These options control the server's behavior
 * and metadata.
 * 
 * @public
 */
export interface McpServerConfig {
  /**
   * The name of the MCP server
   * 
   * This name is used in MCP protocol communications and documentation.
   */
  name: string;
  
  /**
   * The version of the MCP server
   * 
   * Should follow semantic versioning (e.g., "1.4.0").
   */
  version: string;
  
  /**
   * A brief description of the MCP server
   * 
   * Explains the purpose and capabilities of the server.
   */
  description: string;
  
  /**
   * URL to the server's documentation or homepage
   */
  homepage: string;
  
  /**
   * The license under which the server is distributed
   * 
   * Typically "MIT" for Chrome Control.
   */
  license: string;
  
  /**
   * Enable debug mode for additional logging
   * 
   * When true, the server will output more detailed logs for debugging purposes.
   */
  debug?: boolean;
}

/**
 * Default configuration for the MCP server
 * 
 * These values are used if specific options are not provided when
 * creating a new server instance.
 * 
 * @internal
 */
const DEFAULT_CONFIG: McpServerConfig = {
  name: 'Chrome Control MCP Server',
  version: '1.5.0',
  description: 'Chrome browser control via Puppeteer and Model Context Protocol',
  homepage: 'https://github.com/codingbutter/chrome-control',
  license: 'MIT'
};

/**
 * MCP Server for Chrome Control
 * 
 * Provides a standardized server for browser automation through MCP,
 * specifically optimized for LLM integration. This class is the main entry point
 * for creating and managing an MCP server that exposes browser automation
 * capabilities to LLMs.
 * 
 * The server handles tool registration, request processing, and response formatting
 * according to the MCP protocol specification. It communicates with LLM platforms
 * through standard input/output streams.
 * 
 * @example
 * ```typescript
 * // Create a new server
 * const server = new McpServer();
 * 
 * // Register tools
 * registerTools(server);
 * 
 * // Start the server
 * await server.start();
 * ```
 * 
 * @public
 */
export class McpServer {
  private tools: Tool<any>[] = [];
  private config: McpServerConfig;
  private sdkServer: BaseMcpServer;
  private transport: StdioServerTransport | null = null;
  
  /**
   * Create a new MCP server
   * @param config Server configuration
   */
  constructor(config: Partial<McpServerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // @ts-expect-error - There's a type mismatch in the SDK, but this works at runtime
    this.sdkServer = new BaseMcpServer(this.config);
  }
  
  /**
   * Register a single tool with the server
   * @param tool Tool to register
   * @returns The server instance for chaining
   */
  registerTool(tool: Tool<any>): McpServer {
    this.tools.push(tool);
    
    // Register with MCP SDK using any type to bypass type checking
    // Convert Zod schema to rawZod object for MCP compatibility
    // Use a more robust method to convert schema to JSON
    let rawSchema;
    
    // Early return for null/undefined schemas
    if (!tool.schema) {
      console.error(`Error: Schema for tool ${tool.name} is ${tool.schema === null ? 'null' : 'undefined'}`);
      rawSchema = { type: "object", properties: {} };
    } else {
      try {
        // Check if schema has toJSON method (newer Zod versions)
        if (typeof tool.schema.toJSON === 'function') {
          rawSchema = tool.schema.toJSON();
        } 
        // Check if schema has _def property (older Zod versions)
        else if (tool.schema._def && typeof tool.schema._def === 'object') {
          try {
            rawSchema = JSON.parse(JSON.stringify(tool.schema));
          } catch (jsonError) {
            console.error(`JSON serialization error for schema ${tool.name}:`, jsonError);
            // Fallback to minimal schema
            rawSchema = { type: "object", properties: {} };
          }
        } 
        // Last resort: schema may be a raw object already
        else if (typeof tool.schema === 'object') {
          // Check if it's a raw schema directly
          if (tool.schema.type || tool.schema.properties) {
            rawSchema = tool.schema;
          } else {
            console.warn(`Warning: Schema for ${tool.name} does not appear to be a valid Zod schema`);
            rawSchema = { type: "object", properties: {} };
          }
        } 
        // Invalid schema type
        else {
          console.error(`Error: Schema for ${tool.name} has unexpected type: ${typeof tool.schema}`);
          rawSchema = { type: "object", properties: {} };
        }
      } catch (error) {
        console.error(`Failed to convert schema for tool ${tool.name}:`, error);
        // Always provide a valid fallback schema
        rawSchema = { type: "object", properties: {} };
      }
    }
    
    // Extract the shape from schema _def if available (like in gh_cli_mcp)
    // This works around the "keyValidator._parse is not a function" error
    const extractedSchema = (tool.schema as any)?._def?.shape || rawSchema;
    
    this.sdkServer.tool(
      tool.name,
      JSON.stringify(tool.options),
      extractedSchema,
      // @ts-expect-error - There are type mismatches in the SDK, but this works at runtime
      async (args: any) => {
        // Execute the tool handler
        const result = await tool.handler(args || {});
        
        // Transform the result to match the MCP SDK format
        return {
          content: result.content.map(item => {
            if (typeof item.text === 'string') {
              return { 
                type: 'text', 
                text: item.text 
              };
            } else if (item.text && typeof item.text === 'object' && 'src' in item.text) {
              // Handle image content
              const src = item.text.src as string;
              const base64Match = src.match(/^data:image\/\w+;base64,(.+)$/);
              
              if (base64Match) {
                return {
                  type: 'image',
                  data: base64Match[1],
                  mimeType: src.split(';')[0].split(':')[1]
                };
              } else {
                // Return as text if not base64
                return {
                  type: 'text',
                  text: `Image: ${src}`
                };
              }
            } else {
              // Default to text for anything else
              return { 
                type: 'text', 
                text: JSON.stringify(item.text) 
              };
            }
          })
        };
      }
    );
    
    return this;
  }
  
  /**
   * Register multiple tools with the server
   * @param tools Array of tools to register
   * @returns The server instance for chaining
   */
  registerTools(tools: Tool<any>[]): McpServer {
    for (const tool of tools) {
      this.registerTool(tool);
    }
    return this;
  }
  
  /**
   * Start the MCP server
   * @returns Promise that resolves when the server is started
   */
  async start(): Promise<void> {
    // Create transport
    this.transport = new StdioServerTransport();
    
    // Connect the transport to the server
    console.error('Connecting transport to server...');
    await this.sdkServer.connect(this.transport);
    console.error('🚀 Chrome Control MCP Server running');
    
    // Log registered tools
    console.error(`📋 Tools available through MCP: ${this.tools.map(t => t.name).join(', ')}`);
  }
  
  /**
   * Stop the MCP server
   */
  stop(): void {
    if (this.transport) {
      this.transport.close();
      this.transport = null;
    }
    console.error('MCP server closed');
  }
}

/**
 * Creates a Tool instance for use with the MCP server
 * 
 * This factory function provides a convenient way to create properly typed tool
 * objects that can be registered with the MCP server. It ensures that all required
 * fields are present and correctly typed.
 * 
 * @template T - The Zod schema type used for parameter validation
 * 
 * @param name - Unique name for the tool (should be prefixed with "chrome_")
 * @param schema - Zod schema used to validate parameters
 * @param handler - Async function that implements the tool's functionality
 * @param options - Tool metadata including description
 * 
 * @returns A properly typed Tool instance ready for registration
 * 
 * @example
 * ```typescript
 * // Create a navigation tool
 * const navigateTool = createTool(
 *   'chrome_navigate',
 *   z.object({ url: z.string() }),
 *   async (params) => {
 *     // Navigation implementation
 *     return {
 *       content: [
 *         { type: 'text', text: `Navigated to ${params.url}` }
 *       ]
 *     };
 *   },
 *   { description: 'Navigate to a URL' }
 * );
 * ```
 * 
 * @public
 */
export function createTool<T extends z.ZodTypeAny>(
  name: string,
  schema: T,
  handler: (params: z.infer<T>) => Promise<{
    content: Array<{ type: string; text: string | { src: string; alt: string } }>;
  }>,
  options: {
    description: string;
  }
): Tool<T> {
  // Validate that schema is a proper Zod schema
  if (!schema) {
    console.error(`⚠️ Warning: Null or undefined schema provided for tool ${name}`);
    // Create a minimal valid schema as fallback
    schema = z.object({}) as any;
  } else if (typeof schema !== 'object') {
    console.error(`⚠️ Warning: Invalid schema type for tool ${name} (expected object, got ${typeof schema})`);
    // Create a minimal valid schema as fallback
    schema = z.object({}) as any;
  } else if (!schema['_def'] && typeof (schema as any).toJSON !== 'function') {
    // Additional check for Zod-like structure
    console.warn(`⚠️ Warning: Schema for tool ${name} doesn't appear to be a valid Zod schema`);
    // Try to wrap it in a Zod object if it's not already a Zod schema
    try {
      schema = z.object(schema as any) as any;
    } catch (error) {
      console.error(`⚠️ Error wrapping schema for tool ${name}:`, error);
      schema = z.object({}) as any;
    }
  }
  
  // Note: schema is kept as the Zod object, conversion to rawZod happens in registerTool
  return {
    name,
    schema,
    handler,
    options
  };
}