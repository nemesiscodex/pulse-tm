import type { CommandArgs } from '../../types';
import { TaskManager } from '../../core/task-manager';

export async function handleTags(args: CommandArgs): Promise<void> {
  const taskManager = new TaskManager(args.workingDir);

  try {
    const allTags = taskManager.getAllTags();
    const showAll = args.flags.all || false;

    if (showAll) {
      console.log('All tags:');
      for (const tag of allTags) {
        const tasks = taskManager.listTasks(tag);
        console.log(`  ${tag} (${tasks.length} tasks)`);
      }
    } else {
      console.log('Tags with open tasks:');
      let foundOpenTasks = false;
      
      for (const tag of allTags) {
        const openTasks = taskManager.listTasks(tag).filter(task => 
          task.status === 'PENDING' || task.status === 'INPROGRESS'
        );
        
        if (openTasks.length > 0) {
          console.log(`  ${tag} (${openTasks.length} open)`);
          foundOpenTasks = true;
        }
      }
      
      if (!foundOpenTasks) {
        console.log('  No tags with open tasks found.');
      }
    }
  } catch (error) {
    console.error('Error listing tags:', error instanceof Error ? error.message : String(error));
  }
}