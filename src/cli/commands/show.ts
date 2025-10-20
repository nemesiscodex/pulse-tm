import type { CommandArgs } from '../../types';
import { TaskManager } from '../../core/task-manager';
import type { TaskStatus } from '../../types';

export async function handleShow(args: CommandArgs): Promise<void> {
  const taskManager = new TaskManager();

  if (args.args.length === 0) {
    throw new Error('Task ID is required. Usage: pulse show <id> [--tag <tag>]');
  }

  const taskId = parseInt(args.args[0]!, 10);
  if (isNaN(taskId)) {
    throw new Error('Task ID must be a number');
  }

  const tag = args.flags.t as string || args.flags.tag as string || 'base';

  const task = taskManager.getTask(taskId, tag);
  if (!task) {
    throw new Error(`Task ${taskId} not found in tag "${tag}"`);
  }

  const statusIcon = getStatusIcon(task.status);
  console.log(`\n${statusIcon} #${task.id}: ${task.title}`);
  
  if (task.description) {
    console.log(`   ${task.description}`);
  }
  
  if (task.subtasks && task.subtasks.length > 0) {
    task.subtasks.forEach((subtask) => {
      const subtaskIcon = getStatusIcon(subtask.status);
      console.log(`   ${subtaskIcon} ${task.id}.${subtask.id}: ${subtask.title}`);
    });
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