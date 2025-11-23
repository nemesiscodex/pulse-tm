import type { CommandArgs } from '../../types';
import { TaskManager } from '../../core/task-manager';
import type { TaskStatus } from '../../types';

export async function handleStatus(args: CommandArgs): Promise<void> {
  if (args.args.length < 2) {
    console.error('Error: Task ID and status are required.');
    console.log('Usage: pulse status <id> <pending|inprogress|done>');
    return;
  }

  const taskId = parseInt(args.args[0]!, 10);
  if (isNaN(taskId)) {
    console.error('Error: Invalid task ID.');
    return;
  }

  const statusArg = args.args[1]!.toLowerCase();
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

  const taskManager = new TaskManager(args.workingDir);

  try {
    const updatedTask = taskManager.updateTaskStatus(taskId, status, args.tag);
    
    if (!updatedTask) {
      console.error(`Error: Task #${taskId} not found.`);
      return;
    }

    const statusIcon = getStatusIcon(status);
    console.log(`${statusIcon} Task #${taskId} status updated to ${status}`);
    console.log(`   ${updatedTask.title}`);
    
    if (updatedTask.subtasks.length > 0 && status === 'DONE') {
      const completedSubtasks = updatedTask.subtasks.filter(st => st.status === 'DONE').length;
      console.log(`   ${completedSubtasks}/${updatedTask.subtasks.length} subtasks completed`);
    }
  } catch (error) {
    console.error('Error updating task status:', error instanceof Error ? error.message : String(error));
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