import type { CommandArgs } from '../../types';
import { TaskManager } from '../../core/task-manager';

export async function handleNext(args: CommandArgs): Promise<void> {
  const taskManager = new TaskManager();
  
  const tag = args.flags.t as string || args.flags.tag as string;

  try {
    const nextTask = taskManager.getNextTask(tag);
    
    if (!nextTask) {
      console.log(tag ? `No pending tasks found for tag "${tag}".` : 'No pending tasks found.');
      return;
    }

    const statusIcon = getStatusIcon(nextTask.status);
    console.log(`${statusIcon} Next task: #${nextTask.id} ${nextTask.title}`);
    console.log(`   Tag: ${nextTask.tag}`);
    console.log(`   Status: ${nextTask.status}`);
    
    if (nextTask.description) {
      console.log(`   Description: ${nextTask.description}`);
    }
    
    if (nextTask.subtasks.length > 0) {
      const completedSubtasks = nextTask.subtasks.filter(st => st.status === 'DONE').length;
      console.log(`   Subtasks: ${completedSubtasks}/${nextTask.subtasks.length} completed`);
      
      // Show incomplete subtasks
      const incompleteSubtasks = nextTask.subtasks.filter(st => st.status !== 'DONE');
      if (incompleteSubtasks.length > 0) {
        console.log('   Incomplete subtasks:');
        incompleteSubtasks.forEach(subtask => {
          const subtaskIcon = getStatusIcon(subtask.status);
          console.log(`     ${subtaskIcon} ${nextTask.id}.${subtask.id}: ${subtask.title}`);
        });
      }
    }
  } catch (error) {
    console.error('Error getting next task:', error instanceof Error ? error.message : String(error));
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'PENDING': return '○';
    case 'INPROGRESS': return '◐';
    case 'DONE': return '●';
    default: return '?';
  }
}