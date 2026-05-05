import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { SiteAssistantServer } from './server.js'
import type { Action } from 'site-assistant-shared'

export function createMCPServer(server: SiteAssistantServer): McpServer {
  const mcp = new McpServer({
    name: 'site-assistant',
    version: '0.1.0',
  })

  mcp.tool('list_clients', 'List all connected clients with their metadata', {}, async () => {
    const clients = server.listClients()
    return { content: [{ type: 'text', text: JSON.stringify(clients, null, 2) }] }
  })

  mcp.tool(
    'find_clients',
    'Find connected clients by metadata filter',
    { filter: z.record(z.any()).describe('Key-value pairs to match against client meta') },
    async ({ filter }) => {
      const clients = server.findClients(filter)
      return { content: [{ type: 'text', text: JSON.stringify(clients, null, 2) }] }
    }
  )

  mcp.tool(
    'send_command',
    'Send a single action command to a specific client',
    {
      clientId: z.string().describe('Target client ID'),
      action: z.object({
        action: z.enum(['highlight', 'scroll', 'click', 'fill', 'show_message', 'ghost_cursor']),
        target: z.string(),
        value: z.string().optional(),
        text: z.string().optional(),
        options: z.record(z.any()).optional(),
      }).describe('Action to execute'),
    },
    async ({ clientId, action }) => {
      const actionId = server.sendCommand(clientId, action as Action)
      return { content: [{ type: 'text', text: JSON.stringify({ actionId, sent: true }) }] }
    }
  )

  mcp.tool(
    'send_message',
    'Send a text message to a specific client',
    {
      clientId: z.string().describe('Target client ID'),
      text: z.string().describe('Message text'),
    },
    async ({ clientId, text }) => {
      server.sendMessage(clientId, text)
      return { content: [{ type: 'text', text: JSON.stringify({ sent: true }) }] }
    }
  )

  mcp.tool(
    'send_scenario',
    'Send a step-by-step scenario to a specific client',
    {
      clientId: z.string().describe('Target client ID'),
      steps: z.array(z.object({
        action: z.enum(['highlight', 'scroll', 'click', 'fill', 'show_message', 'ghost_cursor']),
        target: z.string(),
        value: z.string().optional(),
        text: z.string().optional(),
        options: z.record(z.any()).optional(),
      })).describe('Ordered list of actions'),
    },
    async ({ clientId, steps }) => {
      server.sendScenario(clientId, steps as Action[])
      return { content: [{ type: 'text', text: JSON.stringify({ sent: true }) }] }
    }
  )

  return mcp
}
