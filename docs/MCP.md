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
      "args": ["pulse-tm@latest", "mcp"]
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
      "args": ["pulse-tm@latest", "mcp"]
    }
  }
}
```

The MCP server automatically detects the project root by walking up from the current working directory to find a `.git` folder. If you need to work with tasks in a specific directory, ensure the MCP server is invoked from that directory or its subdirectories.

## Available Tools

The MCP server exposes the following tools to AI agents:

1.  **`pulse_add_task`**: Create a new task or subtask.
2.  **`pulse_update_task`**: Update a task or subtask (title, description, status).
3.  **`pulse_get_tasks`**: List tasks, get details, or find the next task to work on.
4.  **`pulse_manage_tags`**: Manage tags (list, update, delete).
5.  **`pulse_get_info`**: Get system information.

## Best Practices for Agents

### Context via Tags
You can add descriptions to tags to provide high-level context, such as links to PRD documents or project overviews. This is extremely useful for agents to understand the broader goal when picking up tasks from a specific tag.

### Strict Workflow
Pulse enforces a strict workflow for tasks:
1.  **Pick**: Find the next task (`pulse_get_tasks mode="next"`).
2.  **In Progress**: Move it to `INPROGRESS` (`pulse_update_task`).
3.  **Work**: Perform the actual work.
4.  **Done**: Move it to `DONE` (`pulse_update_task`).
