import { z } from 'zod';
import { McpServer as BaseMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

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
    const transport = new StdioServerTransport();
    await this.connect(transport);
    console.error('🚀 Chrome Control MCP Server running on stdio');
    
    // Initialize the handlers to enable tools.list and tools.call methods
    try {
      // Try to call the setToolRequestHandlers method
      if (callMethod(this, 'setToolRequestHandlers')) {
        console.error('✅ Tool handlers initialized successfully (using setToolRequestHandlers)');
      } else {
        console.error('⚠️ setToolRequestHandlers not available, trying to register manually');
        
        // Get transport and see if it has a handle method
        const transport = getProperty(this, '_transport');
        
        if (transport && typeof transport.handle === 'function') {
          // Register tools.list handler
          transport.handle('tools.list', async (params: any) => {
            const tools = this.toolsList.map(tool => ({
              name: tool.name,
              description: tool.options.description
            }));
            return { tools };
          });
          
          // Register tools.call handler
          transport.handle('tools.call', async (params: { name: string; arguments?: any }) => {
            const { name, arguments: args } = params;
            const tool = this.toolsList.find(t => t.name === name);
            
            if (!tool) {
              throw new Error(`Tool not found: ${name}`);
            }
            
            console.error(`Executing tool: ${name}`);
            return await tool.handler(args || {});
          });
          
          console.error('✅ Tool handlers registered manually');
        } else {
          console.error('❌ Cannot register handlers, transport.handle not available');
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize tool handlers:', error);
    }
    
    // Return a close function that uses the transport's close method
    return {
      close: () => {
        transport.close();
        console.error('MCP server closed');
      }
    };
  }
}