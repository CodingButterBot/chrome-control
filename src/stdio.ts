import { z } from 'zod';
import { McpServer as BaseMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

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
    
    // Return a close function that uses the transport's close method
    return {
      close: () => {
        transport.close();
        console.error('MCP server closed');
      }
    };
  }
}