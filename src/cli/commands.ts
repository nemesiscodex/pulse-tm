import type { CommandArgs } from '../types';
import { handleAdd } from './commands/add';
import { handleList } from './commands/list';
import { handleUpdate } from './commands/update';
import { handleStatus } from './commands/status';
import { handleNext } from './commands/next';
import { handleSubtask } from './commands/subtask';
import { handleShow } from './commands/show';

export async function handleCommand(args: CommandArgs): Promise<void> {
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

COMMANDS:
  add [title]           Create a new task
  list                  List all tasks
  update <id>           Update an existing task
  status <id> <status>  Change task status
  next                  Get next task to work on
  subtask <action>      Manage subtasks
  show <id>             Show detailed task information

FLAGS:
  -d, --description     Task description
  -t, --tag            Task tag
  -s, --status         Filter by status
  --subtasks           Include subtasks
  --all                Show all tasks including completed

EXAMPLES:
  pulse add "Fix bug" -d "Critical issue in login" --tag bug
  pulse list --tag feature
  pulse status 1 done
  pulse next --tag frontend
  pulse subtask add 1 "Write tests"
  pulse show 1 --tag bug
`);
}