export async function handleMcp(args: { workingDir?: string }): Promise<void> {
  // Import and start the MCP server with working directory
  const { startMcpServer } = await import('../../mcp/server.js');
  await startMcpServer(args.workingDir);
}