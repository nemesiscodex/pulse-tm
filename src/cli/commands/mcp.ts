export async function handleMcp(): Promise<void> {
  // Import and start the MCP server
  await import('../../mcp/server.js');
}