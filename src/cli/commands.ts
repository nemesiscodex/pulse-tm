import type { CommandArgs } from '../types';
import { handleAdd } from './commands/add';
import { handleList } from './commands/list';
import { handleUpdate } from './commands/update';
import { handleStatus } from './commands/status';
import { handleNext } from './commands/next';
import { handleSubtask } from './commands/subtask';
import { handleShow } from './commands/show';
import { handleMcp } from './commands/mcp';
import { handleTags } from './commands/tags';
import { handleTag } from './commands/tag';
import { handleDelete } from './commands/delete';
import { handleUi } from './commands/ui';
import { handleVersion } from './commands/version';

export async function handleCommand(args: CommandArgs): Promise<void> {
  // Check for --help flag on any command
  if (args.flags.help || args.flags.h) {
    showCommandHelp(args.command);
    return;
  }

  switch (args.command) {
    case 'add':
      await handleAdd(args);
      break;
    case 'list':
      await handleList(args);
      break;
    case 'update':
      await handleUpdate(args);
      break;
    case 'status':
      await handleStatus(args);
      break;
    case 'next':
      await handleNext(args);
      break;
    case 'subtask':
      await handleSubtask(args);
      break;
    case 'show':
      await handleShow(args);
      break;
    case 'delete':
      await handleDelete(args);
      break;
    case 'ui':
      await handleUi(args);
      break;
    case 'mcp':
      await handleMcp(args);
      break;
    case 'tags':
      await handleTags(args);
      break;
    case 'tag':
      await handleTag(args);
      break;
    case 'version':
    case '--version':
    case '-v':
      await handleVersion();
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      throw new Error(`Unknown command: ${args.command}. Use "pulse --help" for usage.`);
  }
}

function showHelp(): void {
  console.log(`
Pulse - Terminal Task Manager

USAGE:
  pulse <command> [arguments] [flags]

GLOBAL FLAGS:
  --working-dir, -w <path>  Override project root directory (default: auto-detect from .git)

COMMANDS:
  add                   Create a new task
  list                  List all tasks
  update <id>           Update an existing task
  status <id> <status>  Change task status
  next                  Get next task to work on
  subtask <action>      Manage subtasks
  show <id>             Show detailed task information
  delete <id>           Delete a task
  ui                    Launch the interactive dashboard
  mcp                   Start MCP server for AI integration
  tags                  List tags
  tag <subcommand>      Manage tags (list, delete, update, show)
  version               Show Pulse version
  help                  Show this help message

Use "pulse <command> --help" for detailed help on each command.

EXAMPLES:
  pulse add "Fix bug" -d "Critical issue in login" --tag bug
  pulse list --tag feature
  pulse --working-dir /path/to/project list
  pulse status 1 done
  pulse next --tag frontend
  pulse subtask add 1 "Write tests"
  pulse show 1 --tag bug
  pulse delete 1
  pulse tags
  pulse tags --all
`);
}

function showCommandHelp(command: string): void {
  switch (command) {
    case 'add':
      console.log(`
USAGE:
  pulse add [title] [flags]

DESCRIPTION:
  Create a new task with optional description and tag.

ARGUMENTS:
  title                 Task title (can be provided with -d flag instead)

FLAGS:
  -d, --description     Task description
  -t, --tag            Task tag (default: base)

EXAMPLES:
  pulse add "Fix bug" -d "Critical issue in login" --tag bug
  pulse add "New feature" --tag feature
  pulse add -d "Research topic" --tag research
`);
      break;
    case 'list':
      console.log(`
USAGE:
  pulse list [flags]

DESCRIPTION:
  List all tasks, optionally filtered by tag and status.

FLAGS:
  -t, --tag            Filter by tag
  -s, --status         Filter by status (pending, inprogress, done)
  --subtasks           Include subtasks in output
  --all                Show all tasks including completed

EXAMPLES:
  pulse list
  pulse list --tag feature
  pulse list --status pending
  pulse list --tag bug --subtasks
  pulse list --all
`);
      break;
    case 'update':
      console.log(`
USAGE:
  pulse update <task-id> [flags]

DESCRIPTION:
  Update an existing task's title, description, or tag.

ARGUMENTS:
  task-id              ID of the task to update

FLAGS:
  -d, --description     New task description
  -t, --tag            New task tag

EXAMPLES:
  pulse update 1 -d "Updated description"
  pulse update 1 --tag feature
  pulse update 1 -d "New desc" --tag bug
`);
      break;
    case 'status':
      console.log(`
USAGE:
  pulse status <task-id> <status> [flags]

DESCRIPTION:
  Change a task's status.

ARGUMENTS:
  task-id              ID of the task to update
  status               New status: pending, inprogress, done

FLAGS:
  -t, --tag            Task tag (if multiple tags have same ID)

EXAMPLES:
  pulse status 1 done
  pulse status 2 inprogress --tag feature
  pulse status 3 pending
`);
      break;
    case 'next':
      console.log(`
USAGE:
  pulse next [flags]

DESCRIPTION:
  Get the next task to work on (prioritizes in-progress, then pending).

FLAGS:
  -t, --tag            Get next task from specific tag

EXAMPLES:
  pulse next
  pulse next --tag feature
  pulse next --tag bug
`);
      break;
    case 'ui':
      console.log(`
USAGE:
  pulse ui

DESCRIPTION:
  Launch the interactive dashboard for browsing and updating tasks.

SHORTCUTS:
  Arrow keys to navigate, e/d to edit, s to cycle status, x to delete, a to toggle completed, t to toggle tabs, q to quit.
`);
      break;
    case 'subtask':
      console.log(`
USAGE:
  pulse subtask <action> <task-id> [subtask-id] [title] [flags]

DESCRIPTION:
  Manage subtasks for a given task.

ACTIONS:
  add <task-id> <title>     Add a new subtask
  status <task-id> <subtask-id> <status>  Update subtask status
  update <task-id> <subtask-id> <title>   Update subtask title

FLAGS:
  -t, --tag            Task tag (if multiple tags have same ID)

EXAMPLES:
  pulse subtask add 1 "Write tests"
  pulse subtask status 1 1 done
  pulse subtask update 1 1 "Updated test title"
`);
      break;
    case 'show':
      console.log(`
USAGE:
  pulse show <task-id> [flags]

DESCRIPTION:
  Show detailed information about a specific task.

ARGUMENTS:
  task-id              ID of the task to show

FLAGS:
  -t, --tag            Task tag (if multiple tags have same ID)

EXAMPLES:
  pulse show 1
  pulse show 1 --tag feature
`);
      break;
    case 'delete':
      console.log(`
USAGE:
  pulse delete <task-id> [flags]

DESCRIPTION:
  Delete a task permanently. This action cannot be undone.

ARGUMENTS:
  task-id              ID of the task to delete

FLAGS:
  -t, --tag            Task tag (if multiple tags have same ID)

EXAMPLES:
  pulse delete 1
  pulse delete 1 --tag feature
`);
      break;
    case 'tags':
      console.log(`
USAGE:
  pulse tags [flags]

DESCRIPTION:
  List all tags or tags with open tasks.

FLAGS:
  --all                Show all tags including empty ones

EXAMPLES:
  pulse tags
  pulse tags --all
`);
      break;
    case 'version':
      console.log(`
USAGE:
  pulse version

DESCRIPTION:
  Show the current Pulse CLI version.

EXAMPLES:
  pulse version
  pulse --version
  pulse -v
`);
      break;
    case 'mcp':
      console.log(`
USAGE:
  pulse mcp

DESCRIPTION:
  Start MCP (Model Context Protocol) server for AI integration.
  This allows AI assistants to interact with your tasks.

EXAMPLES:
  pulse mcp
`);
      break;
    default:
      console.log(`Unknown command: ${command}`);
      showHelp();
  }
}
