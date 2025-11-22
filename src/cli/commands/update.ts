import type { CommandArgs, Task, Subtask } from '../../types';
import { TaskManager } from '../../core/task-manager';

export async function handleUpdate(args: CommandArgs): Promise<void> {
  if (args.args.length === 0) {
    console.error('Error: Target is required.');
    console.log('Usage: pulse update <task-id|task.subtask-id> --title "new title" --description "new description" --tag "new-tag"');
    return;
  }

  const target = args.args[0]!;
  const taskManager = new TaskManager();
  
  // Check if it's a subtask (format: task.subtask)
  const parts = target.split('.');
  const isSubtask = parts.length === 2;
  
  if (isSubtask) {
    await handleUpdateSubtask(args, taskManager, parts);
  } else {
    await handleUpdateTask(args, taskManager, target);
  }
}

async function handleUpdateTask(args: CommandArgs, taskManager: TaskManager, taskIdStr: string): Promise<void> {
  const taskId = parseInt(taskIdStr, 10);
  if (isNaN(taskId)) {
    console.error('Error: Invalid task ID.');
    return;
  }
  
  const updates: Partial<Pick<Task, 'title' | 'description' | 'tag'>> = {};
  
  if (typeof args.flags.title === 'string') {
    updates.title = args.flags.title;
  }
  
  if (typeof args.flags.description === 'string') {
    updates.description = args.flags.description;
  }
  
  if (typeof args.flags.tag === 'string') {
    updates.tag = args.flags.tag;
  }

  if (Object.keys(updates).length === 0) {
    console.error('Error: At least one field to update must be specified.');
    console.log('Usage: pulse update <id> --title "new title" --description "new description" --tag "new-tag"');
    return;
  }

  try {
    const updatedTask = taskManager.updateTask(taskId, updates);
    
    if (!updatedTask) {
      console.error(`Error: Task #${taskId} not found.`);
      return;
    }

    console.log(`✓ Updated task #${taskId}:`);
    if (updates.title) console.log(`  Title: ${updatedTask.title}`);
    if (updates.description !== undefined) console.log(`  Description: ${updatedTask.description || '(none)'}`);
    if (updates.tag) console.log(`  Tag: ${updatedTask.tag}`);
  } catch (error) {
    console.error('Error updating task:', error instanceof Error ? error.message : String(error));
  }
}

async function handleUpdateSubtask(args: CommandArgs, taskManager: TaskManager, parts: string[]): Promise<void> {
  const parentTaskId = parseInt(parts[0]!, 10);
  const subtaskId = parseInt(parts[1]!, 10);
  
  if (isNaN(parentTaskId) || isNaN(subtaskId)) {
    console.error('Error: Invalid task or subtask ID format. Use "task.subtask" format (e.g., "1.2").');
    return;
  }

  const updates: Partial<Pick<Subtask, 'title'>> = {};
  
  if (typeof args.flags.title === 'string') {
    updates.title = args.flags.title;
  }

  if (Object.keys(updates).length === 0) {
    console.error('Error: At least one field to update must be specified.');
    console.log('Usage: pulse update <task.subtask-id> --title "new title" --description "new description"');
    return;
  }

  try {
    const updatedSubtask = taskManager.updateSubtask(parentTaskId, subtaskId, updates);
    
    if (!updatedSubtask) {
      console.error(`Error: Subtask ${parentTaskId}.${subtaskId} not found.`);
      return;
    }

    console.log(`✓ Updated subtask ${parentTaskId}.${subtaskId}:`);
    if (updates.title) console.log(`  Title: ${updatedSubtask.title}`);

  } catch (error) {
    console.error('Error updating subtask:', error instanceof Error ? error.message : String(error));
  }
}