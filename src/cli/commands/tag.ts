import type { CommandArgs } from '../../types';
import { TaskManager } from '../../core/task-manager';
import { handleTags } from './tags';

export async function handleTag(args: CommandArgs): Promise<void> {
  const taskManager = new TaskManager(args.workingDir);
  const subcommand = args.args[0];

  if (!subcommand) {
    // Default to listing tags if no subcommand
    await handleTags(args);
    return;
  }

  switch (subcommand) {
    case 'list':
      await handleTags(args);
      break;

    case 'delete': {
      const tagName = args.args[1];
      if (!tagName) {
        console.error('Error: Tag name required for delete command');
        return;
      }
      // TODO: Add confirmation prompt if not forced? For CLI, usually force or interactive.
      // For now, just delete as requested.
      const success = taskManager.deleteTag(tagName);
      if (success) {
        console.log(`Tag "${tagName}" deleted successfully.`);
      } else {
        console.error(`Error: Tag "${tagName}" not found.`);
      }
      break;
    }

    case 'update': {
      const tagName = args.args[1];
      if (!tagName) {
        console.error('Error: Tag name required for update command');
        return;
      }
      const description = args.flags.description || args.flags.d;
      if (typeof description !== 'string') {
        console.error('Error: Description required (-d "desc")');
        return;
      }
      const success = taskManager.updateTag(tagName, description);
      if (success) {
        console.log(`Tag "${tagName}" updated successfully.`);
      } else {
        console.error(`Error: Tag "${tagName}" not found.`);
      }
      break;
    }

    case 'show': {
      const tagName = args.args[1];
      if (!tagName) {
        console.error('Error: Tag name required for show command');
        return;
      }
      const details = taskManager.getTagDetails(tagName);
      if (details) {
        console.log(`Tag: ${tagName}`);
        if (details.description) {
          console.log(`Description: ${details.description}`);
        }
        console.log(`Tasks: ${details.taskCount}`);
      } else {
        console.error(`Error: Tag "${tagName}" not found.`);
      }
      break;
    }

    default:
      console.error(`Unknown tag subcommand: ${subcommand}`);
      console.log('Available subcommands: list, delete, update, show');
  }
}
