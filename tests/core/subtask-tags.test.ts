import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskManager } from '../../src/core/task-manager';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), '.pulse-test-subtasks');

describe('Subtask Tag Isolation', () => {
  let manager: TaskManager;

  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    manager = new TaskManager(TEST_DIR);
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should add subtask to the correct task when IDs collide across tags', () => {
    // 1. Create task #1 in 'base'
    const baseTask = manager.createTask('Base Task', undefined, 'base');
    expect(baseTask.id).toBe(1);
    expect(baseTask.tag).toBe('base');

    // 2. Create task #1 in 'devops'
    // We need to ensure 'devops' tag exists first or is created
    manager.createTag('devops');
    const devopsTask = manager.createTask('Devops Task', undefined, 'devops');
    expect(devopsTask.id).toBe(1); // Should be 1 as it's the first in this tag
    expect(devopsTask.tag).toBe('devops');

    // 3. Add subtask to 'devops' #1
    // We pass the tag now, so it should work correctly.
    const subtask = manager.addSubtask(devopsTask.id, 'Subtask for Devops', 'devops');
    
    // Refresh tasks to check where it went
    const updatedBase = manager.getTask(baseTask.id, 'base');
    const updatedDevops = manager.getTask(devopsTask.id, 'devops');

    // ASSERTION:
    // The subtask should be in the devops task, NOT the base task.
    
    expect(updatedBase?.subtasks).toHaveLength(0);
    
    expect(updatedDevops?.subtasks).toHaveLength(1);
    expect(updatedDevops?.subtasks[0]?.title).toBe('Subtask for Devops');
  });
});
