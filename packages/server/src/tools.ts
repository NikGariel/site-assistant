import type { SiteAssistantServer } from './server.js'
import type { Action } from 'site-assistant-shared'

interface AnthropicTool {
  name: string
  description: string
  input_schema: Record<string, any>
}

interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, any>
  }
}

const TOOL_DEFS = [
  {
    name: 'list_clients',
    description: 'List all currently connected clients with their metadata',
    schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'find_clients',
    description: 'Find connected clients by metadata filter (matches all key-value pairs)',
    schema: {
      type: 'object',
      properties: {
        filter: {
          type: 'object',
          description: 'Key-value pairs to match against client meta',
          additionalProperties: true,
        },
      },
      required: ['filter'],
    },
  },
  {
    name: 'send_command',
    description: 'Send a single action command to a specific client',
    schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Target client ID' },
        action: {
          type: 'object',
          description: 'Action to execute: { action: "highlight"|"scroll"|"click"|"fill"|"show_message"|"ghost_cursor", target: string, ...options }',
          properties: {
            action: { type: 'string', enum: ['highlight', 'scroll', 'click', 'fill', 'show_message', 'ghost_cursor'] },
            target: { type: 'string' },
          },
          required: ['action', 'target'],
          additionalProperties: true,
        },
      },
      required: ['clientId', 'action'],
    },
  },
  {
    name: 'send_message',
    description: 'Send a text message to a specific client',
    schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Target client ID' },
        text: { type: 'string', description: 'Message text to display' },
      },
      required: ['clientId', 'text'],
    },
  },
  {
    name: 'send_scenario',
    description: 'Send a step-by-step scenario (ordered list of actions) to a specific client',
    schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Target client ID' },
        steps: {
          type: 'array',
          description: 'Ordered list of actions to execute sequentially',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['highlight', 'scroll', 'click', 'fill', 'show_message', 'ghost_cursor'] },
              target: { type: 'string' },
            },
            required: ['action', 'target'],
            additionalProperties: true,
          },
        },
      },
      required: ['clientId', 'steps'],
    },
  },
]

export class ToolExecutor {
  constructor(private server: SiteAssistantServer) {}

  getDefinitions(format: 'anthropic' | 'openai' | 'raw'): any[] {
    switch (format) {
      case 'anthropic':
        return TOOL_DEFS.map((t): AnthropicTool => ({
          name: t.name,
          description: t.description,
          input_schema: t.schema,
        }))
      case 'openai':
        return TOOL_DEFS.map((t): OpenAITool => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.schema,
          },
        }))
      case 'raw':
        return TOOL_DEFS.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.schema,
        }))
    }
  }

  async execute(toolName: string, args: Record<string, any>): Promise<any> {
    switch (toolName) {
      case 'list_clients':
        return this.server.listClients()
      case 'find_clients':
        return this.server.findClients(args.filter)
      case 'send_command': {
        const actionId = this.server.sendCommand(args.clientId, args.action as Action)
        return { actionId, sent: true }
      }
      case 'send_message':
        this.server.sendMessage(args.clientId, args.text)
        return { sent: true }
      case 'send_scenario':
        this.server.sendScenario(args.clientId, args.steps as Action[])
        return { sent: true }
      default:
        throw new Error(`Unknown tool: "${toolName}"`)
    }
  }
}
