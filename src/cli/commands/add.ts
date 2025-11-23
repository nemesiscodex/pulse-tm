import type { CommandArgs } from '../../types';
import { TaskManager } from '../../core/task-manager';
import prompts from 'prompts';

export async function handleAdd(args: CommandArgs): Promise<void> {
  const taskManager = new TaskManager(args.workingDir);
  
  let title: string;
  let description: string | undefined;
  let tag: string = 'base';

  if (args.args.length > 0) {
    // Argument mode
    title = args.args[0]!;
    description = args.flags.d as string || args.flags.description as string;
    tag = (args.flags.t as string || args.flags.tag as string) || 'base';
  } else {
    // Interactive mode
    const response = await prompts([
      {
        type: 'text',
        name: 'title',
        message: 'Task title',
        validate: (value: string) => value.trim() !== '' || 'Title is required'
      },
      {
        type: 'text',
        name: 'description',
        message: 'Description (optional)'
      },
      {
        type: 'text',
        name: 'tag',
        message: 'Tag',
        initial: 'base'
      }
    ]);

    if (!response.title) {
      console.log('Cancelled.');
      return;
    }

    title = response.title;
    description = response.description;
    tag = response.tag || 'base';
  }

  try {
    const task = taskManager.createTask(title, description, tag);
    console.log(`✓ Created task #${task.id}: "${task.title}" (${tag})`);
    if (description) {
      console.log(`  Description: ${description}`);
    }
  } catch (error) {
    console.error('Error creating task:', error instanceof Error ? error.message : String(error));
  }
}