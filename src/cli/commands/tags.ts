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
        const details = taskManager.getTagDetails(tag);
        const desc = details?.description ? ` - ${details.description}` : '';
        console.log(`  ${tag} (${tasks.length} tasks)${desc}`);
      }
    } else {
      console.log('Tags with open tasks:');
      let foundOpenTasks = false;
      
      for (const tag of allTags) {
        const openTasks = taskManager.listTasks(tag).filter(task => 
          task.status === 'PENDING' || task.status === 'INPROGRESS'
        );
        
        if (openTasks.length > 0) {
          const details = taskManager.getTagDetails(tag);
          const desc = details?.description ? ` - ${details.description}` : '';
          console.log(`  ${tag} (${openTasks.length} open)${desc}`);
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