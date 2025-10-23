import type { CommandArgs } from '../../types';
import { TaskManager } from '../../core/task-manager';

export async function handleDelete(args: CommandArgs): Promise<void> {
  const taskManager = new TaskManager();

  if (args.args.length === 0) {
    console.error('Error: Task ID is required.');
    console.log('Usage: pulse delete <task-id> [--tag <tag>]');
    return;
  }

  const taskId = parseInt(args.args[0]!, 10);
  const tag = args.flags.t as string || args.flags.tag as string;

  if (isNaN(taskId)) {
    console.error('Error: Task ID must be a number.');
    return;
  }

  try {
    const success = taskManager.deleteTask(taskId, tag);
    
    if (success) {
      console.log(`Task #${taskId} deleted successfully.`);
    } else {
      console.error(`Task #${taskId} not found${tag ? ` in tag "${tag}"` : ''}.`);
    }
  } catch (error) {
    console.error('Error deleting task:', error instanceof Error ? error.message : String(error));
  }
}