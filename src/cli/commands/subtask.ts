import type { CommandArgs } from '../../types';
import { TaskManager } from '../../core/task-manager';
import type { TaskStatus } from '../../types';

export async function handleSubtask(args: CommandArgs): Promise<void> {
  if (args.args.length === 0) {
    console.error('Error: Subtask action is required.');
    console.log('Usage: pulse subtask <add|list|status> [arguments]');
    return;
  }

  const action = args.args[0]!;
  const taskManager = new TaskManager(args.workingDir);

  switch (action) {
    case 'add':
      await handleAddSubtask(args, taskManager);
      break;
    case 'list':
      await handleListSubtasks(args, taskManager);
      break;
    case 'status':
      await handleUpdateSubtaskStatus(args, taskManager);
      break;
    default:
      console.error(`Error: Unknown subtask action "${action}". Use add, list, or status.`);
  }
}

async function handleAddSubtask(args: CommandArgs, taskManager: TaskManager): Promise<void> {
  if (args.args.length < 3) {
    console.error('Error: Parent task ID and subtask title are required.');
    console.log('Usage: pulse subtask add <parent-id> "subtask title"');
    return;
  }

  const parentTaskId = parseInt(args.args[1]!, 10);
  if (isNaN(parentTaskId)) {
    console.error('Error: Invalid parent task ID.');
    return;
  }

  const title = args.args.slice(2).join(' ');
  if (!title.trim()) {
    console.error('Error: Subtask title is required.');
    return;
  }

  const tag = typeof args.flags.tag === 'string' ? args.flags.tag : (typeof args.flags.t === 'string' ? args.flags.t : undefined);
  try {
    const subtask = taskManager.addSubtask(parentTaskId, title, tag);
    
    if (!subtask) {
      console.error(`Error: Parent task #${parentTaskId} not found.`);
      return;
    }

    console.log(`✓ Added subtask ${parentTaskId}.${subtask.id}: "${title}"`);
  } catch (error) {
    console.error('Error adding subtask:', error instanceof Error ? error.message : String(error));
  }
}

async function handleListSubtasks(args: CommandArgs, taskManager: TaskManager): Promise<void> {
  if (args.args.length < 2) {
    console.error('Error: Parent task ID is required.');
    console.log('Usage: pulse subtask list <parent-id>');
    return;
  }

  const parentTaskId = parseInt(args.args[1]!, 10);
  if (isNaN(parentTaskId)) {
    console.error('Error: Invalid parent task ID.');
    return;
  }

  try {
    const tag = typeof args.flags.tag === 'string' ? args.flags.tag : (typeof args.flags.t === 'string' ? args.flags.t : undefined);
    const task = taskManager.getTask(parentTaskId, tag);
    
    if (!task) {
      console.error(`Error: Task #${parentTaskId} not found.`);
      return;
    }

    if (task.subtasks.length === 0) {
      console.log(`Task #${parentTaskId} has no subtasks.`);
      return;
    }

    console.log(`\nSubtasks for task #${parentTaskId}: ${task.title}\n`);
    
    task.subtasks.forEach(subtask => {
      const statusIcon = getStatusIcon(subtask.status);
      console.log(`${statusIcon} ${parentTaskId}.${subtask.id}: ${subtask.title}`);
    });
    
    const completedCount = task.subtasks.filter(st => st.status === 'DONE').length;
    console.log(`\nProgress: ${completedCount}/${task.subtasks.length} completed`);
  } catch (error) {
    console.error('Error listing subtasks:', error instanceof Error ? error.message : String(error));
  }
}

async function handleUpdateSubtaskStatus(args: CommandArgs, taskManager: TaskManager): Promise<void> {
  if (args.args.length < 3) {
    console.error('Error: Subtask ID and status are required.');
    console.log('Usage: pulse subtask status <task.subtask-id> <pending|inprogress|done>');
    return;
  }

  const subtaskIdArg = args.args[1]!;
  const parts = subtaskIdArg.split('.');
  
  if (parts.length !== 2) {
    console.error('Error: Invalid subtask ID format. Use "task.subtask" format (e.g., "1.2").');
    return;
  }

  const parentTaskId = parseInt(parts[0]!, 10);
  const subtaskId = parseInt(parts[1]!, 10);
  
  if (isNaN(parentTaskId) || isNaN(subtaskId)) {
    console.error('Error: Invalid task or subtask ID.');
    return;
  }

  const statusArg = args.args[2]!.toLowerCase();
  const statusMap: Record<string, TaskStatus> = {
    'pending': 'PENDING',
    'inprogress': 'INPROGRESS',
    'done': 'DONE'
  };

  const status = statusMap[statusArg];
  if (!status) {
    console.error('Error: Invalid status. Use pending, inprogress, or done.');
    return;
  }

  try {
    const tag = typeof args.flags.tag === 'string' ? args.flags.tag : (typeof args.flags.t === 'string' ? args.flags.t : undefined);
    const updatedSubtask = taskManager.updateSubtaskStatus(parentTaskId, subtaskId, status, tag);
    
    if (!updatedSubtask) {
      console.error(`Error: Subtask ${parentTaskId}.${subtaskId} not found.`);
      return;
    }

    const statusIcon = getStatusIcon(status);
    console.log(`${statusIcon} Subtask ${parentTaskId}.${subtaskId} status updated to ${status}`);
    console.log(`   ${updatedSubtask.title}`);
  } catch (error) {
    console.error('Error updating subtask status:', error instanceof Error ? error.message : String(error));
  }
}

function getStatusIcon(status: TaskStatus): string {
  switch (status) {
    case 'PENDING': return '○';
    case 'INPROGRESS': return '◐';
    case 'DONE': return '●';
    default: return '?';
  }
}