# Pulse - Terminal Task Manager PRD

## Overview
Pulse is a terminal-based task and project management tool designed for developers and power users who prefer working in the command line. It provides a simple yet powerful interface for managing tasks with hierarchical subtasks, tags, and status tracking.

## Core Features

### Task Management
- **Create Tasks**: Add tasks with title, description, and optional tags
- **Update Tasks**: Modify title and description of existing tasks
- **Task Statuses**: PENDING, INPROGRESS, DONE
- **Task Ordering**: Tasks maintain a user-defined order for prioritization
- **Hierarchical Tasks**: Tasks can contain ordered subtasks

### Tag System
- **Base Tag**: Tasks without explicit tags are assigned to "base" tag
- **Single Tag Assignment**: Each task can only have one tag at a time
- **Tag-based Filtering**: View and manage tasks by specific tags

### Task Discovery
- **List All Tasks**: Display all tasks in their defined order
- **List by Tag**: Show tasks filtered by specific tag, maintaining order
- **Next Task**: Find the next PENDING task (or current INPROGRESS task)
- **Next Task by Tag**: Find next task within a specific tag

### Subtask Management
- **Ordered Subtasks**: Tasks can contain multiple subtasks with defined order
- **Independent Status**: Subtasks have their own PENDING/INPROGRESS/DONE status
- **Bulk Completion**: When marking a parent task as DONE, prompt to complete all incomplete subtasks

## Command Line Interface

### Primary Commands

#### `pulse add`
Create a new task with interactive prompts or command-line arguments.

**Interactive Mode:**
```bash
pulse add
```
- Prompts for title (required)
- Prompts for description (optional)
- Prompts for tag (optional, defaults to "base")

**Argument Mode:**
```bash
pulse add "Task title" -d "Task description" --tag "feature"
```

**Arguments:**
- `title` (positional, required): Task title
- `-d, --description` (optional): Task description
- `-t, --tag` (optional): Task tag (defaults to "base")

#### `pulse list`
Display tasks with filtering options.

```bash
pulse list                    # List all tasks
pulse list --tag "feature"    # List tasks with specific tag
pulse list --status pending   # List tasks by status
```

**Arguments:**
- `-t, --tag` (optional): Filter by tag
- `-s, --status` (optional): Filter by status (pending|inprogress|done)
- `--subtasks` (optional): Include subtasks in output

#### `pulse update`
Modify existing task properties.

```bash
pulse update 1 --title "New title"
pulse update 1 --description "New description"
pulse update 1 --tag "new-tag"
```

**Arguments:**
- `task-id` (positional, required): Numeric task identifier
- `--title` (optional): New task title
- `--description` (optional): New task description
- `--tag` (optional): New task tag

#### `pulse status`
Change task status.

```bash
pulse status 1 pending
pulse status 1 inprogress
pulse status 1 done
```

**Arguments:**
- `task-id` (positional, required): Numeric task identifier
- `status` (positional, required): New status (pending|inprogress|done)

#### `pulse next`
Find and display the next task to work on.

```bash
pulse next              # Next task from any tag
pulse next --tag "bug"  # Next task from specific tag
```

**Arguments:**
- `-t, --tag` (optional): Limit search to specific tag

#### `pulse subtask`
Manage subtasks for a given task.

```bash
pulse subtask add 1 "Subtask title"
pulse subtask list 1
pulse subtask status 1.1 done
```

**Arguments:**
- `parent-id` (positional, required): Numeric parent task identifier
- `subtask-id` (positional, required): Subtask identifier in format "task.subtask" (e.g., "1.2")

### Utility Commands

#### `pulse config`
Configure Pulse settings.

```bash
pulse config set default-tag "personal"
pulse config get default-tag
```

#### `pulse import/export`
Data management.

```bash
pulse export --format yaml > backup.yaml
pulse import backup.yaml
```

## Data Model

### Task Structure
```typescript
interface Task {
  id: number;           // Simple numeric identifier (incremental)
  title: string;        // Task title
  description?: string; // Optional description
  status: TaskStatus;   // PENDING | INPROGRESS | DONE
  tag: string;          // Task tag (defaults to "base")
  order: number;        // Position within tag
  subtasks: Subtask[];  // Ordered array of subtasks
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last modification timestamp
}

interface Subtask {
  id: number;           // Simple numeric identifier (incremental within parent)
  title: string;        // Subtask title
  status: TaskStatus;   // PENDING | INPROGRESS | DONE
  order: number;        // Position within parent task
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last modification timestamp
}
```

### YAML File Structure
Each tag file (`.pulse/<tag>.yml`) contains:
```yaml
# .pulse/frontend.yml
next_id: 3  # Next available task ID for this tag
tasks:
  - id: 1
    title: "Implement login component"
    description: "Create reusable login form with validation"
    status: "INPROGRESS"
    order: 1
    subtasks:
      - id: 1
        title: "Design form layout"
        status: "DONE"
        order: 1
        createdAt: "2025-01-15T10:00:00Z"
        updatedAt: "2025-01-15T11:30:00Z"
      - id: 2
        title: "Add form validation"
        status: "PENDING"
        order: 2
        createdAt: "2025-01-15T10:00:00Z"
        updatedAt: "2025-01-15T10:00:00Z"
    createdAt: "2025-01-15T10:00:00Z"
    updatedAt: "2025-01-15T11:30:00Z"
  - id: 2
    title: "Setup routing"
    description: "Configure React Router for navigation"
    status: "PENDING"
    order: 2
    subtasks: []
    createdAt: "2025-01-16T09:00:00Z"
    updatedAt: "2025-01-16T09:00:00Z"
```

### Tag Name Sanitization
- Convert to lowercase
- Replace spaces and underscores with hyphens
- Remove special characters except hyphens
- Examples:
  - "Front End" → "front-end"
  - "Bug_Fix" → "bug-fix"
  - "Feature!!!" → "feature"
  - "API Integration" → "api-integration"

## User Experience

### Interactive Prompts
- Clean, intuitive prompts for required information
- Default values where appropriate
- Validation and error handling
- Keyboard shortcuts for common actions

### Output Formatting
- Color-coded status indicators
- Hierarchical display of tasks and subtasks
- Compact and verbose output modes
- Search and filtering capabilities

### Error Handling
- Clear error messages for invalid commands
- Graceful handling of missing data
- Confirmation prompts for destructive actions

## Technical Architecture

### Storage
- Local file-based storage (YAML format)
- `.pulse/` directory in user's home or project root
- One file per tag: `.pulse/<tag>.yml`
- Base tag stored as `.pulse/base.yml`
- Tag name sanitization: convert to lowercase, replace spaces with hyphens, remove special characters
- Configurable storage location
- Data integrity validation
- Backup and restore capabilities

### Performance
- Efficient task lookup and filtering
- Minimal memory footprint
- Fast command execution
- Lazy loading for large task sets

### Extensibility
- Plugin architecture for custom commands
- Configurable output formats
- Custom status workflows
- Integration hooks for external tools

## Future Enhancements (Part 2)

### MCP Server Integration
- **MCP Protocol Support**: Expose Pulse functionality via Model Context Protocol
- **LLM Integration**: Allow AI assistants to manage tasks through MCP
- **Natural Language Processing**: Create tasks from natural language descriptions
- **Smart Suggestions**: AI-powered task prioritization and recommendations

### Advanced Features
- **Task Dependencies**: Define prerequisite tasks
- **Time Tracking**: Record time spent on tasks
- **Deadlines and Reminders**: Due dates with notifications
- **Collaboration**: Share and sync tasks across teams
- **Templates**: Reusable task templates
- **Analytics**: Task completion metrics and reporting

## Success Metrics
- **Adoption**: Number of active users
- **Engagement**: Tasks created and completed per user
- **Efficiency**: Time saved in task management workflows
- **Integration**: MCP server usage by AI assistants
- **Satisfaction**: User feedback and feature requests

## Development Roadmap

### Phase 1: Core Functionality
- Basic task CRUD operations
- Tag system implementation
- Command-line interface
- Local storage

### Phase 2: Advanced Features
- Subtask management
- Interactive TUI interface
- Import/export functionality
- Configuration system

### Phase 3: Integration & Ecosystem
- MCP server implementation
- Plugin architecture
- Third-party integrations
- Advanced analytics

## Open Questions
- Preferred storage format (JSON, SQLite, etc.)
- Default task ordering strategy
- Backup and sync requirements
- Integration with existing task management tools
- Accessibility considerations for TUI interface