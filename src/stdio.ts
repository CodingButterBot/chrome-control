import { z } from 'zod';
import { McpServer as BaseMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as fs from 'fs';

// Augment the StdioServerTransport with additional functionality to handle MCP requests
class MCP_StdioTransport extends StdioServerTransport {
  // Store handlers for methods
  private methodHandlers: Map<string, (params: any) => Promise<any>> = new Map();
  
  constructor() {
    super();
    
    // Keep a reference to the original onmessage
    const originalOnmessage = this.onmessage;
    
    // Replace onmessage with our custom implementation
    this.onmessage = async (message: any) => {
      // Log the received message for debugging
      console.error(`Received message: ${JSON.stringify(message).substring(0, 200)}...`);
      
      try {
        // Check if we have a handler for this method
        if (message && message.method && this.methodHandlers.has(message.method)) {
          console.error(`Handling method: ${message.method}`);
          const handler = this.methodHandlers.get(message.method)!;
          
          try {
            // Call the handler with the parameters
            const result = await handler(message.params);
            
            // Respond with the result
            await this.send({
              jsonrpc: '2.0',
              id: message.id,
              result: result
            });
            
            // Handled successfully
            return;
          } catch (error: any) {
            // Error in handler
            console.error(`Error in handler for ${message.method}:`, error.message);
            
            await this.send({
              jsonrpc: '2.0',
              id: message.id,
              error: {
                code: -32000,
                message: error.message || 'Error processing request'
              }
            });
            
            return;
          }
        }
        
        // If no handler was found, fall back to the original implementation
        if (originalOnmessage) {
          await originalOnmessage.call(this, message);
        } else {
          // No handler found and no fallback - respond with method not found
          if (message.id) {
            await this.send({
              jsonrpc: '2.0',
              id: message.id,
              error: {
                code: -32601,
                message: 'Method not found',
                data: { method: message.method }
              }
            });
          }
        }
      } catch (error: any) {
        console.error('Error processing message:', error);
        
        // Send error response if possible
        if (message && message.id) {
          await this.send({
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32603,
              message: 'Internal error',
              data: { error: error.message }
            }
          });
        }
      }
    };
  }
  
  // Method to register a handler for a specific method
  registerMethodHandler(method: string, handler: (params: any) => Promise<any>) {
    this.methodHandlers.set(method, handler);
    console.error(`Registered handler for method: ${method}`);
  }
}

// Helper to access any object property
function getProperty(obj: any, prop: string): any {
  return obj[prop];
}

// Helper to call any method
function callMethod(obj: any, method: string, ...args: any[]): any {
  if (typeof obj[method] === 'function') {
    return obj[method](...args);
  }
  return undefined;
}

/**
 * Tool class for defining Puppeteer tools
 */
export class Tool<T extends z.ZodTypeAny> {
  constructor(
    public name: string,
    public schema: T,
    public handler: (params: z.infer<T>) => Promise<{
      content: Array<{ type: string; text: string | { src: string; alt: string } }>;
    }>,
    public options: {
      description: string;
    }
  ) {}

  definition(): [string, z.ZodTypeAny, (params: any) => Promise<any>, { description: string }] {
    return [this.name, this.schema, this.handler, this.options];
  }
}

/**
 * MCP Server for Puppeteer tools
 */
export class PuppeteerMcpServer extends BaseMcpServer {
  private toolsList: Tool<any>[] = [];
  public readonly config: any;

  /**
   * Create a new Puppeteer MCP server
   */
  constructor() {
    const config = {
      name: 'Chrome Control MCP Server',
      version: '1.0.0',
      description: 'Chrome browser control via Puppeteer and Model Context Protocol',
      homepage: 'https://github.com/codingbutter/chrome-control',
      license: 'MIT'
    };
    super(config);
    this.config = config;
  }

  /**
   * Add a tool with the given name, schema, handler, and options
   */
  addTool<T extends z.ZodTypeAny>(
    name: string,
    schema: T,
    handler: (params: z.infer<T>) => Promise<{
      content: Array<{ type: string; text: string | { src: string; alt: string } }>;
    }>,
    options: {
      description: string;
    }
  ) {
    const tool = new Tool(name, schema, handler, options);
    this.toolsList.push(tool);
    
    // Register with MCP server
    const [toolName, toolSchema, toolHandler, toolOptions] = tool.definition();
    super.tool(toolName, JSON.stringify(toolOptions), (toolSchema as any)?._def?.shape || toolSchema, toolHandler);
    
    return this;
  }

  /**
   * Register multiple tools
   */
  tools(toolsList: Tool<any>[]) {
    for (const tool of toolsList) {
      const [name, schema, handler, options] = tool.definition();
      this.addTool(name, schema, handler, options);
    }
  }

  /**
   * Start the server with stdio transport
   */
  async start() {
    // Create our enhanced transport
    const transport = new MCP_StdioTransport();
    
    // Register the tools.list handler
    transport.registerMethodHandler('tools.list', async () => {
      console.error('Handling tools.list request');
      const tools = this.toolsList.map(tool => ({
        name: tool.name,
        description: tool.options.description,
        inputSchema: tool.schema ? tool.schema : { type: "object" }
      }));
      console.error(`Returning ${tools.length} tools`);
      return { tools };
    });
    
    // Register the tools.call handler
    transport.registerMethodHandler('tools.call', async (params: any) => {
      const { name, arguments: args } = params;
      console.error(`Handling tools.call for ${name}`);
      
      const tool = this.toolsList.find(t => t.name === name);
      
      if (!tool) {
        console.error(`Tool not found: ${name}`);
        throw new Error(`Tool not found: ${name}`);
      }
      
      console.error(`Executing tool: ${name} with args:`, JSON.stringify(args).substring(0, 100));
      try {
        const result = await tool.handler(args || {});
        console.error(`Tool ${name} executed successfully`);
        return result;
      } catch (error: any) {
        console.error(`Error executing tool ${name}:`, error);
        throw error;
      }
    });
    
    // Connect the transport to the server
    console.error('Connecting transport to server...');
    await this.connect(transport);
    console.error('🚀 Chrome Control MCP Server running on stdio');
    
    // Try to use the standard handlers if available, but we have our direct handlers as backup
    try {
      if (callMethod(this, 'setToolRequestHandlers')) {
        console.error('✅ Standard tool request handlers initialized');
      } else {
        console.error('ℹ️ Using direct transport handlers for MCP requests');
      }
    } catch (error) {
      console.error('ℹ️ Using direct transport handlers due to error:', error);
    }
    
    // Log all the registered tools
    console.error(`📋 Tools available through MCP: ${this.toolsList.map(t => t.name).join(', ')}`);
    
    // Return a close function
    return {
      close: () => {
        transport.close();
        console.error('MCP server closed');
      }
    };
  }
}