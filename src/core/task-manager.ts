import type { Task, Subtask, TaskStatus } from '../types';
import { Storage } from '../storage/filesystem';
import { sanitizeTagName, isValidTagName } from '../utils/tag-sanitizer';

export class TaskManager {
  private storage: Storage;

  constructor(baseDir?: string) {
    this.storage = new Storage(baseDir);
  }

  /**
   * Create a new tag by initializing its tag file if it doesn't exist yet.
   * Also safe to call if the tag already exists (will no-op unless description is provided).
   */
  createTag(tag: string, description?: string): void {
    const normalized = sanitizeTagName(tag);
    if (!isValidTagName(normalized)) return;

    // Simply persist an empty TagFile; storage handles creating the file.
    const existing = this.storage.getAllTags();
    if (existing.includes(normalized)) {
      // If description is provided, update it
      if (description) {
        const tagFile = this.storage.loadTagFile(normalized);
        tagFile.description = description;
        this.storage.saveTagFile(normalized, tagFile);
      }
      return;
    }
    this.storage.saveTagFile(normalized, { next_id: 1, description, tasks: [] });
  }

  createTask(title: string, description?: string, tag: string = 'base'): Task {
    const normalizedTag = isValidTagName(sanitizeTagName(tag)) ? sanitizeTagName(tag) : 'base';
    const tagFile = this.storage.loadTagFile(normalizedTag);
    const now = new Date();
    
    const task: Task = {
      id: tagFile.next_id,
      title,
      description,
      status: 'PENDING',
      tag: normalizedTag,
      order: tagFile.tasks.length + 1,
      subtasks: [],
      createdAt: now,
      updatedAt: now
    };

    tagFile.tasks.push(task);
    tagFile.next_id++;
    
    this.storage.saveTagFile(tag, tagFile);
    
    return task;
  }

  updateTask(taskId: number, updates: Partial<Pick<Task, 'title' | 'description' | 'tag'>>): Task | null {
    const found = this.storage.findTask(taskId);
    if (!found) return null;

    const { task, tag: oldTag } = found;
    const oldTagFile = this.storage.loadTagFile(oldTag);
    const taskIndex = oldTagFile.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return null;

    // Update task properties
    const updatedTask = { ...task, ...updates, updatedAt: new Date() };
    
    // Handle tag change
    if (updates.tag && updates.tag !== oldTag) {
      const normalized = sanitizeTagName(updates.tag);
      if (!isValidTagName(normalized)) return null;

      // Remove from old tag
      oldTagFile.tasks.splice(taskIndex, 1);
      this.storage.saveTagFile(oldTag, oldTagFile);
      
      // Add to new tag
      const newTagFile = this.storage.loadTagFile(normalized);
      updatedTask.tag = normalized;
      updatedTask.order = newTagFile.tasks.length + 1;
      newTagFile.tasks.push(updatedTask);
      this.storage.saveTagFile(normalized, newTagFile);
    } else {
      // Update in same tag
      oldTagFile.tasks[taskIndex] = updatedTask;
      this.storage.saveTagFile(oldTag, oldTagFile);
    }

    return updatedTask;
  }

  updateTaskStatus(
    taskId: number,
    status: TaskStatus,
    tag?: string,
    options?: { completeSubtasks?: boolean }
  ): Task | null {
    const found = this.storage.findTask(taskId, tag);
    if (!found) return null;

    const { task, tag: taskTag } = found;
    const tagFile = this.storage.loadTagFile(taskTag);
    const taskIndex = tagFile.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return null;

    // Optionally mark all subtasks as DONE when explicitly requested
    if (status === 'DONE' && options?.completeSubtasks) {
      task.subtasks = task.subtasks.map(subtask => ({
        ...subtask,
        status: 'DONE',
        updatedAt: new Date()
      }));
    }

    task.status = status;
    task.updatedAt = new Date();
    
    tagFile.tasks[taskIndex] = task;
    this.storage.saveTagFile(taskTag, tagFile);
    
    return task;
  }

  listTasks(tag?: string, status?: TaskStatus): Task[] {
    const tags = tag ? [tag] : this.storage.getAllTags();
    const allTasks: Task[] = [];

    for (const tag of tags) {
      const tagFile = this.storage.loadTagFile(tag);
      const filteredTasks = tagFile.tasks.filter(task => {
        if (status && task.status !== status) return false;
        return true;
      });
      allTasks.push(...filteredTasks);
    }

    return allTasks.sort((a, b) => a.order - b.order);
  }

  getNextTask(tag?: string): Task | null {
    const tasks = this.listTasks(tag);
    
    // First look for INPROGRESS tasks
    const inProgressTask = tasks.find(task => task.status === 'INPROGRESS');
    if (inProgressTask) return inProgressTask;
    
    // Then look for PENDING tasks
    const pendingTask = tasks.find(task => task.status === 'PENDING');
    if (pendingTask) return pendingTask;
    
    return null;
  }

  addSubtask(parentTaskId: number, title: string, tag?: string): Subtask | null {
    const found = this.storage.findTask(parentTaskId, tag);
    if (!found) return null;

    const { task, tag: foundTag } = found;
    const tagFile = this.storage.loadTagFile(foundTag);
    const taskIndex = tagFile.tasks.findIndex(t => t.id === parentTaskId);
    
    if (taskIndex === -1) return null;

    const now = new Date();
    const subtask: Subtask = {
      id: task.subtasks.length + 1,
      title,
      status: 'PENDING',
      order: task.subtasks.length + 1,
      createdAt: now,
      updatedAt: now
    };

    task.subtasks.push(subtask);
    task.updatedAt = now;
    
    tagFile.tasks[taskIndex] = task;
    this.storage.saveTagFile(foundTag, tagFile);
    
    return subtask;
  }

  updateSubtaskStatus(parentTaskId: number, subtaskId: number, status: TaskStatus, tag?: string): Subtask | null {
    return this.updateSubtask(parentTaskId, subtaskId, { status }, tag);
  }

  deleteSubtask(parentTaskId: number, subtaskId: number, tag?: string): boolean {
    const found = this.storage.findTask(parentTaskId, tag);
    if (!found) return false;

    const { task, tag: foundTag } = found;
    const tagFile = this.storage.loadTagFile(foundTag);
    const taskIndex = tagFile.tasks.findIndex(t => t.id === parentTaskId);
    if (taskIndex === -1) return false;

    const subtaskIndex = task.subtasks.findIndex(st => st.id === subtaskId);
    if (subtaskIndex === -1) return false;

    task.subtasks = task.subtasks
      .filter((_, i) => i !== subtaskIndex)
      .map((st, i) => ({ ...st, order: i + 1 }));
    task.updatedAt = new Date();

    tagFile.tasks[taskIndex] = task;
    this.storage.saveTagFile(foundTag, tagFile);
    return true;
  }

  reorderSubtasks(parentTaskId: number, fromIndex: number, toIndex: number, tag?: string): Subtask[] | null {
    const found = this.storage.findTask(parentTaskId, tag);
    if (!found) return null;

    const { task, tag: foundTag } = found;
    const tagFile = this.storage.loadTagFile(foundTag);
    const taskIndex = tagFile.tasks.findIndex(t => t.id === parentTaskId);
    if (taskIndex === -1) return null;

    const arr = [...task.subtasks];
    if (fromIndex < 0 || fromIndex >= arr.length || toIndex < 0 || toIndex >= arr.length) return null;

    const moved = arr[fromIndex];
    if (!moved) return null;
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, moved);
    const now = new Date();
    task.subtasks = arr.map((st, i) => ({ ...st, order: i + 1, updatedAt: now }));
    task.updatedAt = now;

    tagFile.tasks[taskIndex] = task;
    this.storage.saveTagFile(foundTag, tagFile);
    return task.subtasks;
  }

  getAllTags(): string[] {
    return this.storage.getAllTags();
  }

  getTask(taskId: number, tag?: string): Task | null {
    if (tag) {
      const tagFile = this.storage.loadTagFile(tag);
      return tagFile.tasks.find(t => t.id === taskId) || null;
    }
    
    const found = this.storage.findTask(taskId);
    return found ? found.task : null;
  }

  updateSubtask(parentTaskId: number, subtaskId: number, updates: Partial<Pick<Subtask, 'title' | 'status'>>, tag?: string): Subtask | null {
    const found = this.storage.findTask(parentTaskId, tag);
    if (!found) return null;

    const { task, tag: foundTag } = found;
    const tagFile = this.storage.loadTagFile(foundTag);
    const taskIndex = tagFile.tasks.findIndex(t => t.id === parentTaskId);
    
    if (taskIndex === -1) return null;

    const subtaskIndex = task.subtasks.findIndex(st => st.id === subtaskId);
    if (subtaskIndex === -1) return null;

    const updatedSubtask = task.subtasks[subtaskIndex];
    if (!updatedSubtask) return null;

    Object.assign(updatedSubtask, updates);
    updatedSubtask.updatedAt = new Date();
    task.updatedAt = new Date();
    
    tagFile.tasks[taskIndex] = task;
    this.storage.saveTagFile(foundTag, tagFile);
    
    return updatedSubtask;
  }

  deleteTask(taskId: number, tag?: string): boolean {
    const found = this.storage.findTask(taskId, tag);
    if (!found) return false;

    const { tag: taskTag } = found;
    const tagFile = this.storage.loadTagFile(taskTag);
    const taskIndex = tagFile.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return false;

    tagFile.tasks.splice(taskIndex, 1);
    this.storage.saveTagFile(taskTag, tagFile);
    
    return true;
  }

  updateTag(tag: string, description: string): boolean {
    const normalized = sanitizeTagName(tag);
    if (!isValidTagName(normalized)) return false;

    const existing = this.storage.getAllTags();
    if (!existing.includes(normalized)) return false;

    const tagFile = this.storage.loadTagFile(normalized);
    tagFile.description = description;
    this.storage.saveTagFile(normalized, tagFile);
    return true;
  }

  deleteTag(tag: string): boolean {
    const normalized = sanitizeTagName(tag);
    if (!isValidTagName(normalized)) return false;
    
    const existing = this.storage.getAllTags();
    if (!existing.includes(normalized)) return false;

    // Ensure storage supports deletion
    if (typeof this.storage.deleteTagFile !== 'function') {
      throw new Error('Storage implementation does not support deleting tags');
    }

    this.storage.deleteTagFile(normalized);
    return true;
  }

  getTagDetails(tag: string): { description?: string; taskCount: number } | null {
    const normalized = sanitizeTagName(tag);
    if (!isValidTagName(normalized)) return null;
    const existing = this.storage.getAllTags();
    if (!existing.includes(normalized)) return null;

    const tagFile = this.storage.loadTagFile(normalized);
    return {
      description: tagFile.description,
      taskCount: tagFile.tasks.length
    };
  }

  /**
   * Get the full path to the .pulse directory
   * @returns The absolute path to the .pulse directory
   */
  getPulseDir(): string {
    return this.storage.getPulseDir();
  }
}
