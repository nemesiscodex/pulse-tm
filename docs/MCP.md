# Model Context Protocol (MCP) Server

[← Back to README](../README.md)


Pulse includes an MCP server that lets AI assistants (like Claude Desktop or Cursor) read and update your tasks directly.

## Starting the Server

```bash
# Using npx (installed from npm)
npx pulse-tm mcp

# Using bunx (installed with Bun)
bunx pulse-tm mcp
```

## Configuration

Add Pulse to your MCP configuration file (typically `mcp.json` or `claude_desktop_config.json`).

### Using Bun (Recommended)

```json
{
  "mcpServers": {
    "pulse": {
      "command": "bunx",
      "args": ["pulse-tm", "mcp"]
    }
  }
}
```

### Using npx

```json
{
  "mcpServers": {
    "pulse": {
      "command": "npx",
      "args": ["pulse-tm", "mcp"]
    }
  }
}
```

## Automatic Project Detection

The MCP server automatically detects the project root by walking up from the current working directory to find a `.git` folder. If you need to work with tasks in a specific directory, ensure the MCP server is invoked from that directory or its subdirectories.
