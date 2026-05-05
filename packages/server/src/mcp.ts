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
    { filter: z.record(z.string(), z.any()).describe('Key-value pairs to match against client meta') },
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
        options: z.record(z.string(), z.any()).optional(),
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
        options: z.record(z.string(), z.any()).optional(),
      })).describe('Ordered list of actions'),
    },
    async ({ clientId, steps }) => {
      server.sendScenario(clientId, steps as Action[])
      return { content: [{ type: 'text', text: JSON.stringify({ sent: true }) }] }
    }
  )

  mcp.tool(
    'get_page_state',
    'Get the last known page state for a client (URL, title, all elements with visibility and values)',
    { clientId: z.string().describe('Target client ID') },
    async ({ clientId }) => {
      const state = server.getPageState(clientId)
      return { content: [{ type: 'text', text: JSON.stringify(state ?? { error: 'No state available yet' }, null, 2) }] }
    }
  )

  mcp.tool(
    'request_page_state',
    'Request fresh page state from a client (waits for response). Use before deciding which actions to take.',
    { clientId: z.string().describe('Target client ID') },
    async ({ clientId }) => {
      const state = await server.requestState(clientId)
      return { content: [{ type: 'text', text: JSON.stringify(state, null, 2) }] }
    }
  )

  return mcp
}
