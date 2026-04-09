import { TranscribeAudioTool } from './tools/transcribe-audio';
import { AnalyzeMusicTool } from './tools/analyze-music';
import { IdentifySongTool } from './tools/identify-song';
import { GetTabsTool } from './tools/get-tabs';
import { GetChordProgressionTool } from './tools/get-chord-progression';

interface MCPMessage {
  jsonrpc: string;
  id?: string | number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: string;
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class MCPHandler {
  private tools: Map<string, any>;
  private env: any;

  constructor(env: any) {
    this.env = env;
    this.tools = new Map([
      ['transcribe_audio', new TranscribeAudioTool(env)],
      ['analyze_music', new AnalyzeMusicTool(env)],
      ['identify_song', new IdentifySongTool(env)],
      ['get_tabs', new GetTabsTool(env)],
      ['get_chord_progression', new GetChordProgressionTool(env)],
    ]);
  }

  async handleSSE(request: Request): Promise<Response> {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Handle MCP protocol over SSE
    this.setupSSEConnection(request, writer);

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  private async setupSSEConnection(request: Request, writer: WritableStreamDefaultWriter) {
    try {
      const body = await request.text();
      const messages = body.split('\n').filter(line => line.trim());

      for (const line of messages) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const message: MCPMessage = JSON.parse(data);
            const response = await this.handleMCPMessage(message);
            await this.writeSSEMessage(writer, response);
          } catch (error) {
            console.error('Error parsing MCP message:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error in SSE connection:', error);
    } finally {
      await writer.close();
    }
  }

  private async handleMCPMessage(message: MCPMessage): Promise<MCPResponse> {
    try {
      switch (message.method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
              },
              serverInfo: {
                name: 'Riot Sheets MCP Server',
                version: '1.0.0',
              },
            },
          };

        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              tools: Array.from(this.tools.entries()).map(([name, tool]) => ({
                name,
                description: tool.description,
                inputSchema: tool.inputSchema,
              })),
            },
          };

        case 'tools/call':
          const { name, arguments: args } = message.params;
          const tool = this.tools.get(name);
          
          if (!tool) {
            return {
              jsonrpc: '2.0',
              id: message.id,
              error: {
                code: -32601,
                message: `Tool '${name}' not found`,
              },
            };
          }

          const result = await tool.execute(args);
          return {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            },
          };

        default:
          return {
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32601,
              message: `Method '${message.method}' not found`,
            },
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  private async writeSSEMessage(writer: WritableStreamDefaultWriter, response: MCPResponse) {
    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify(response)}\n\n`;
    await writer.write(encoder.encode(data));
  }
}