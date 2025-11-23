import type { CommandArgs } from '../../types';
import { TaskManager } from '../../core/task-manager';
import type { TaskStatus, Task } from '../../types';

export async function handleList(args: CommandArgs): Promise<void> {
  const taskManager = new TaskManager(args.workingDir);
  
  const tag = args.flags.t as string || args.flags.tag as string;
  const status = (args.flags.s as string || args.flags.status as string) as TaskStatus;
  const includeSubtasks = args.flags.subtasks === true;
  const showAll = args.flags.all === true;

  try {
    // If a specific status is provided, use it. Otherwise, default to PENDING and INPROGRESS unless --all
    let tasks: Task[];
    if (status) {
      // Convert status to uppercase
      const upperStatus = status.toUpperCase() as TaskStatus;
      tasks = taskManager.listTasks(tag, upperStatus);
    } else if (showAll) {
      tasks = taskManager.listTasks(tag);
    } else {
      // Get all tasks and filter out DONE ones
      const allTasks = taskManager.listTasks(tag);
      tasks = allTasks.filter(task => task.status !== 'DONE');
    }
    
    const filteredTasks = tasks;
    
    if (filteredTasks.length === 0) {
      if (status) {
        console.log(`No tasks found with status "${status}".`);
      } else if (showAll) {
        console.log('No tasks found.');
      } else {
        console.log('No pending or in-progress tasks found. Use --all to see completed tasks.');
      }
      return;
    }

    if (tag) {
      // Single tag view - existing format
      const statusText = showAll ? (status ? ` [${status}]` : '') : (status ? ` [${status}]` : ' [pending/in-progress]');
      console.log(`\nTasks (${tag})${statusText}:\n`);
      
      filteredTasks.forEach(task => {
        const statusIcon = getStatusIcon(task.status);
        console.log(`${statusIcon} #${task.id}: ${task.title}`);
        
        if (task.description) {
          console.log(`   ${task.description}`);
        }
        
        if (includeSubtasks && task.subtasks.length > 0) {
          task.subtasks.forEach(subtask => {
            const subtaskIcon = getStatusIcon(subtask.status);
            console.log(`   ${subtaskIcon} ${task.id}.${subtask.id}: ${subtask.title}`);
          });
        }
      });
    } else {
      // All tags view - group by tag
      const statusText = showAll ? (status ? ` [${status}]` : '') : (status ? ` [${status}]` : ' [pending/in-progress]');
      console.log(`\nTasks${statusText}:\n`);
      
      // Group tasks by tag
      const tasksByTag = filteredTasks.reduce((acc, task) => {
        if (!acc[task.tag]) acc[task.tag] = [];
        acc[task.tag]!.push(task);
        return acc;
      }, {} as Record<string, Task[]>);
      
      // Display each tag group
      Object.entries(tasksByTag).forEach(([tagName, tagTasks]) => {
        console.log(`${tagName}:`);
        (tagTasks as Task[]).forEach(task => {
          const statusIcon = getStatusIcon(task.status);
          console.log(`  ${statusIcon} #${task.id}: ${task.title}`);
          
          if (task.description) {
            console.log(`     ${task.description}`);
          }
          
          if (includeSubtasks && task.subtasks.length > 0) {
            task.subtasks.forEach(subtask => {
              const subtaskIcon = getStatusIcon(subtask.status);
              console.log(`     ${subtaskIcon} ${task.id}.${subtask.id}: ${subtask.title}`);
            });
          }
        });
        console.log(''); // Empty line between tags
      });
    }
    
    const totalCount = showAll ? tasks.length : filteredTasks.length;
    const countText = showAll ? '' : ' (pending/in-progress)';
    console.log(`Total: ${totalCount} task${totalCount !== 1 ? 's' : ''}${countText}`);
  } catch (error) {
    console.error('Error listing tasks:', error instanceof Error ? error.message : String(error));
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