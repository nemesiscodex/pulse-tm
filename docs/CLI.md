# Pulse CLI Reference

[← Back to README](../README.md)


Pulse provides a full-featured command-line interface for managing your tasks.

## Usage

```bash
pulse [command] [options]
```

## Commands

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

## Global Options

### Overriding Working Directory
For CLI commands, you can override the working directory using the `--working-dir` (or `-w`) flag:

```bash
# Use a specific project directory
pulse --working-dir /path/to/project list

# Short form
pulse -w /path/to/project add "New task"
```

The working directory determines where Pulse looks for or creates the `.pulse/` directory containing your task files.
