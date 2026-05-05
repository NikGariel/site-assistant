import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SiteAssistantServer } from '../server.js'
import { createMCPServer } from '../mcp.js'

describe('MCP Server', () => {
  let server: SiteAssistantServer
  const port = 9873

  beforeEach(async () => {
    server = new SiteAssistantServer({ port })
    await new Promise((r) => setTimeout(r, 100))
  })

  afterEach(() => {
    server.close()
  })

  it('creates MCP server with tools', () => {
    const mcp = createMCPServer(server)
    expect(mcp).toBeDefined()
  })
})
