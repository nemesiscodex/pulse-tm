import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskManager } from '../../src/core/task-manager';
import { handleSubtask } from '../../src/cli/commands/subtask';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), '.pulse-test-cli-subtasks');

// Mock console.log and console.error
const logs: string[] = [];
const errors: string[] = [];
const originalLog = console.log;
const originalError = console.error;

describe('CLI Subtask Commands', () => {
  let manager: TaskManager;

  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    manager = new TaskManager(TEST_DIR);
    
    logs.length = 0;
    errors.length = 0;
    console.log = (msg: string) => logs.push(msg);
    console.error = (msg: string) => errors.push(msg);
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should add subtask to tagged task via CLI', async () => {
    // Setup: Create task #1 in 'devops'
    manager.createTag('devops');
    const task = manager.createTask('Devops Task', undefined, 'devops');
    
    // Execute CLI command: pulse subtask add 1 "Subtask" --tag devops
    await handleSubtask({
      command: 'subtask',
      args: ['add', '1', 'Subtask'],
      flags: { tag: 'devops' },
      workingDir: TEST_DIR
    });

    // Verify
    const updatedTask = manager.getTask(task.id, 'devops');
    expect(updatedTask?.subtasks).toHaveLength(1);
    expect(updatedTask?.subtasks[0]?.title).toBe('Subtask');
    
    // Verify logs
    expect(logs.some(l => l.includes('Added subtask'))).toBe(true);
  });

  it('should update subtask status via CLI with tag', async () => {
    // Setup: Create task and subtask
    manager.createTag('devops');
    const task = manager.createTask('Devops Task', undefined, 'devops');
    const subtask = manager.addSubtask(task.id, 'Subtask', 'devops');
    
    // Execute CLI command: pulse subtask status 1.1 done --tag devops
    await handleSubtask({
      command: 'subtask',
      args: ['status', `1.${subtask!.id}`, 'done'],
      flags: { tag: 'devops' },
      workingDir: TEST_DIR
    });

    // Verify
    const updatedTask = manager.getTask(task.id, 'devops');
    expect(updatedTask?.subtasks[0]?.status).toBe('DONE');
    
    // Verify logs
    expect(logs.some(l => l.includes('status updated to DONE'))).toBe(true);
  });
});
