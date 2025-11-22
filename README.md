# Pulse - Terminal Task Manager

A powerful terminal-based task and project management tool designed for developers and power users who prefer working in the command line. Pulse provides a simple yet powerful interface for managing tasks with hierarchical subtasks, tags, and status tracking.

## Features

- **Task Management**: Create, update, and delete tasks with titles, descriptions, and tags
- **Status Tracking**: Track tasks through PENDING, INPROGRESS, and DONE states
- **Tag System**: Organize tasks by tags (defaults to "base" tag)
- **Subtasks**: Create hierarchical subtasks with independent status tracking
- **Interactive TUI**: Beautiful terminal user interface for browsing and managing tasks
- **MCP Server**: Model Context Protocol server for AI assistant integration
- **CLI Commands**: Full-featured command-line interface

## Installation

### Using Bun (Recommended)

```bash
bun install -g pulse-tm
```

### Using npm

```bash
npm install -g pulse-tm
```

**Note**: This package requires Bun runtime. After installing via npm, ensure you have [Bun](https://bun.sh) installed on your system.

## Usage

Pulse supports three main usage modes:

### 1. Command Line Interface (CLI)

```bash
# Create a new task
pulse add "Fix bug in login" -d "Critical issue affecting users" --tag bug

# List all tasks
pulse list

# List tasks by tag
pulse list --tag feature

# List tasks by status
pulse list --status pending

# Update a task
pulse update 1 -d "Updated description" --tag bug

# Change task status
pulse status 1 inprogress

# Get next task to work on
pulse next

# Get next task from specific tag
pulse next --tag frontend

# Show detailed task information
pulse show 1

# Delete a task
pulse delete 1

# List all tags
pulse tags
```

### 2. Interactive TUI Dashboard

Launch the interactive dashboard:

```bash
pulse ui
```

**Keyboard Shortcuts**:
- Arrow keys: Navigate tasks
- `Enter`: Focus on subtasks
- `e`/`d`: Edit task
- `s`: Cycle task status
- `x`: Delete task
- `a`: Toggle completed tasks visibility
- `t`: Toggle tabs
- `q`: Quit

### 3. MCP Server (for AI Integration)

Start the MCP server for AI assistant integration:

```bash
# Using npx (installed from npm)
npx pulse-tm mcp

# Using bunx (installed with Bun)
bunx pulse-tm mcp
```

This starts a [Model Context Protocol](https://modelcontextprotocol.io) server that lets AI assistants read and update your tasks.

## Commands Reference

### `pulse add`
Create a new task with optional description and tag.

```bash
pulse add "Task title" -d "Description" --tag feature
```

### `pulse list`
List all tasks, optionally filtered by tag and status.

```bash
pulse list --tag bug --status pending --subtasks
```

### `pulse update`
Update an existing task's title, description, or tag.

```bash
pulse update 1 -d "New description" --tag feature
```

### `pulse status`
Change a task's status.

```bash
pulse status 1 done
```

### `pulse next`
Get the next task to work on (prioritizes in-progress, then pending).

```bash
pulse next --tag frontend
```

### `pulse subtask`
Manage subtasks for a given task.

```bash
pulse subtask add 1 "Write tests"
pulse subtask status 1 1 done
```

### `pulse show`
Show detailed information about a specific task.

```bash
pulse show 1 --tag feature
```

### `pulse delete`
Delete a task permanently.

```bash
pulse delete 1 --tag bug
```

### `pulse tags`
List all tags or tags with open tasks.

```bash
pulse tags --all
```

## Development

If you want to hack on Pulse locally, you’ll need:

- [Bun](https://bun.sh) **1.0.0+** (runtime and package manager)

Install dependencies:

```bash
bun install
```

Run the CLI directly (useful while developing commands):

```bash
bun run src/index.ts -- help
```

Run the TUI dashboard directly:

```bash
bun run src/index.tsx
```

Build and link the CLI globally for local testing:

```bash
bun run build
bun link
```

Type-check and lint:

```bash
# Strict TypeScript type-check (no emit) and ESLint (TypeScript + project style)
bun run lint
```

Run tests:

```bash
bun run test
```

## Requirements

- **Bun**: Version 1.0.0 or higher
- **Node.js**: Not supported (this package uses Bun-specific features)

## Data Storage

Tasks are stored locally in YAML format:
- Location: `.pulse/` directory in your home directory or project root
- One file per tag: `.pulse/<tag>.yml`
- Base tag stored as: `.pulse/base.yml`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.  
See `CONTRIBUTING.md` for setup instructions, coding conventions, and how to run the checks locally.  
See `CODE_OF_CONDUCT.md` for community expectations and reporting guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Repository

[https://github.com/nemesiscodex/pulse-tm](https://github.com/nemesiscodex/pulse-tm)

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/nemesiscodex/pulse-tm/issues) page.
