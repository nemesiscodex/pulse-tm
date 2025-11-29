import { TaskManager } from '../core/task-manager';

export function formatTagList(taskManager: TaskManager, options?: { showAll?: boolean }): string {
  const allTags = taskManager.getAllTags();
  const showAll = options?.showAll ?? false;

  if (showAll) {
    const lines = ['All tags:'];
    for (const tag of allTags) {
      const tasks = taskManager.listTasks(tag);
      const details = taskManager.getTagDetails(tag);
      const desc = details?.description ? ` - ${details.description}` : '';
      lines.push(`  ${tag} (${tasks.length} tasks)${desc}`);
    }
    return lines.join('\n');
  }

  const lines = ['Tags with open tasks:'];
  let foundOpenTasks = false;
  
  for (const tag of allTags) {
    const openTasks = taskManager.listTasks(tag).filter(task =>
      task.status === 'PENDING' || task.status === 'INPROGRESS'
    );
    if (openTasks.length > 0) {
      const details = taskManager.getTagDetails(tag);
      const desc = details?.description ? ` - ${details.description}` : '';
      lines.push(`  ${tag} (${openTasks.length} open)${desc}`);
      foundOpenTasks = true;
    }
  }

  if (!foundOpenTasks) {
    lines.push('  No tags with open tasks found.');
  }

  return lines.join('\n');
}
