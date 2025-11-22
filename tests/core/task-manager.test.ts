import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskManager } from '../../src/core/task-manager';
import { rmSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// For open-source friendliness and CI, keep test artifacts inside the project
// working directory instead of writing into the user's home directory. This
// avoids permission issues in sandboxed environments and keeps tests hermetic.
const TEST_DIR = join(process.cwd(), '.pulse-test');

describe('TaskManager', () => {
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

  it('should create a task', () => {
    const task = manager.createTask('Test Task', 'Description');
    expect(task.title).toBe('Test Task');
    expect(task.description).toBe('Description');
    expect(task.status).toBe('PENDING');
    expect(task.id).toBe(1);
  });

  it('should list tasks', () => {
    manager.createTask('Task 1');
    manager.createTask('Task 2');
    const tasks = manager.listTasks();
    expect(tasks).toHaveLength(2);
    expect(tasks[0]?.title).toBe('Task 1');
    expect(tasks[1]?.title).toBe('Task 2');
  });

  it('should update task status', () => {
    const task = manager.createTask('Task 1');
    manager.updateTaskStatus(task.id, 'INPROGRESS', task.tag);
    const updated = manager.getTask(task.id, task.tag);
    expect(updated?.status).toBe('INPROGRESS');
  });

  it('should update task details', () => {
    const task = manager.createTask('Task 1');
    manager.updateTask(task.id, { title: 'Updated Task', description: 'New Desc' });
    const updated = manager.getTask(task.id, task.tag);
    expect(updated?.title).toBe('Updated Task');
    expect(updated?.description).toBe('New Desc');
  });

  it('should delete a task', () => {
    const task = manager.createTask('Task 1');
    const result = manager.deleteTask(task.id, task.tag);
    expect(result).toBe(true);
    const tasks = manager.listTasks();
    expect(tasks).toHaveLength(0);
  });

  it('should manage subtasks', () => {
    const task = manager.createTask('Parent Task');
    const subtask = manager.addSubtask(task.id, 'Subtask 1');
    expect(subtask).not.toBeNull();
    expect(subtask?.title).toBe('Subtask 1');

    const updatedParent = manager.getTask(task.id, task.tag);
    expect(updatedParent?.subtasks).toHaveLength(1);
    expect(updatedParent?.subtasks[0]?.title).toBe('Subtask 1');
  });

  it('should handle tags', () => {
    manager.createTag('feature');
    const tags = manager.getAllTags();
    expect(tags).toContain('feature');

    const task = manager.createTask('Feature Task', undefined, 'feature');
    expect(task.tag).toBe('feature');
    
    const featureTasks = manager.listTasks('feature');
    expect(featureTasks).toHaveLength(1);
    expect(featureTasks[0]?.title).toBe('Feature Task');
  });

  it('should handle multiple tags and filtering', () => {
    // Create tasks in different tags
    manager.createTask('Work Task 1', undefined, 'work');
    manager.createTask('Work Task 2', undefined, 'work');
    manager.createTask('Personal Task 1', undefined, 'personal');
    manager.createTask('Urgent Task 1', undefined, 'urgent');

    // Test filtering by specific tag
    const workTasks = manager.listTasks('work');
    expect(workTasks).toHaveLength(2);
    expect(workTasks.every(t => t.tag === 'work')).toBe(true);

    const personalTasks = manager.listTasks('personal');
    expect(personalTasks).toHaveLength(1);
    expect(personalTasks[0]?.title).toBe('Personal Task 1');

    // Test listing all tasks (no tag filter)
    const allTasks = manager.listTasks();
    expect(allTasks).toHaveLength(4);
    // Verify we have tasks from all tags
    const tags = new Set(allTasks.map(t => t.tag));
    expect(tags.has('work')).toBe(true);
    expect(tags.has('personal')).toBe(true);
    expect(tags.has('urgent')).toBe(true);
  });

  it('should filter by status and tag combinations', () => {
    // Setup:
    // work: 1 PENDING, 1 DONE
    // personal: 1 INPROGRESS
    const t1 = manager.createTask('Work Pending', undefined, 'work');
    const t2 = manager.createTask('Work Done', undefined, 'work');
    manager.updateTaskStatus(t2.id, 'DONE', 'work');
    
    const t3 = manager.createTask('Personal InProgress', undefined, 'personal');
    manager.updateTaskStatus(t3.id, 'INPROGRESS', 'personal');

    // Filter: Status=PENDING, Tag=work
    const pendingWork = manager.listTasks('work', 'PENDING');
    expect(pendingWork).toHaveLength(1);
    expect(pendingWork[0]?.title).toBe('Work Pending');

    // Filter: Status=DONE, Tag=work
    const doneWork = manager.listTasks('work', 'DONE');
    expect(doneWork).toHaveLength(1);
    expect(doneWork[0]?.title).toBe('Work Done');

    // Filter: Status=INPROGRESS (across all tags if we supported that, but listTasks takes tag as first arg)
    // The current signature is listTasks(tag?, status?). 
    // If we want to list ALL tasks with a specific status, we'd need to pass undefined for tag.
    // Let's verify if listTasks supports undefined tag for global status search.
    const allInProgress = manager.listTasks(undefined, 'INPROGRESS');
    expect(allInProgress).toHaveLength(1);
    expect(allInProgress[0]?.title).toBe('Personal InProgress');
  });

  it('normalizes tag names on creation and creation via tasks', () => {
    manager.createTag('Feature Epic');
    const tags = manager.getAllTags();
    expect(tags).toContain('feature-epic');

    const task = manager.createTask('T', undefined, 'Feature Epic');
    expect(task.tag).toBe('feature-epic');
  });

  it('rejects invalid tags and falls back to base', () => {
    manager.createTag('!!!'); // invalid -> no-op
    expect(manager.getAllTags()).not.toContain('!!!');

    const task = manager.createTask('T', undefined, '!!!');
    expect(task.tag).toBe('base');
  });

  it('only completes subtasks when explicitly requested', () => {
    const task = manager.createTask('Parent');
    const st1 = manager.addSubtask(task.id, 's1');
    const st2 = manager.addSubtask(task.id, 's2');
    expect(st1?.status).toBe('PENDING');
    expect(st2?.status).toBe('PENDING');

    manager.updateTaskStatus(task.id, 'DONE', task.tag);
    const unchanged = manager.getTask(task.id, task.tag);
    expect(unchanged?.subtasks.filter(s => s.status === 'DONE')).toHaveLength(0);

    manager.updateTaskStatus(task.id, 'DONE', task.tag, { completeSubtasks: true });
    const completed = manager.getTask(task.id, task.tag);
    expect(completed?.subtasks.every(s => s.status === 'DONE')).toBe(true);
  });
});
