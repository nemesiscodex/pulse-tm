import type { CommandArgs } from '../../types';
import { TaskManager } from '../../core/task-manager';
import { formatTagList } from '../../utils/tag-list';

export async function handleTags(args: CommandArgs): Promise<void> {
  const taskManager = new TaskManager(args.workingDir);

  try {
    const showAll = Boolean(args.flags.all);
    const text = formatTagList(taskManager, { showAll });
    console.log(text);
  } catch (error) {
    console.error('Error listing tags:', error instanceof Error ? error.message : String(error));
  }
}
