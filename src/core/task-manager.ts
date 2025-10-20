import type { Task, Subtask, TaskStatus } from '../types';
import { Storage } from '../storage/filesystem';

export class TaskManager {
  private storage: Storage;

  constructor(baseDir?: string) {
    this.storage = new Storage(baseDir);
  }

  createTask(title: string, description?: string, tag: string = 'base'): Task {
    const tagFile = this.storage.loadTagFile(tag);
    const now = new Date();
    
    const task: Task = {
      id: tagFile.next_id,
      title,
      description,
      status: 'PENDING',
      tag,
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
      // Remove from old tag
      oldTagFile.tasks.splice(taskIndex, 1);
      this.storage.saveTagFile(oldTag, oldTagFile);
      
      // Add to new tag
      const newTagFile = this.storage.loadTagFile(updates.tag);
      updatedTask.tag = updates.tag;
      updatedTask.order = newTagFile.tasks.length + 1;
      newTagFile.tasks.push(updatedTask);
      this.storage.saveTagFile(updates.tag, newTagFile);
    } else {
      // Update in same tag
      oldTagFile.tasks[taskIndex] = updatedTask;
      this.storage.saveTagFile(oldTag, oldTagFile);
    }

    return updatedTask;
  }

  updateTaskStatus(taskId: number, status: TaskStatus, tag?: string): Task | null {
    const found = this.storage.findTask(taskId, tag);
    if (!found) return null;

    const { task, tag: taskTag } = found;
    const tagFile = this.storage.loadTagFile(taskTag);
    const taskIndex = tagFile.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return null;

    // Check for incomplete subtasks when marking as DONE
    if (status === 'DONE') {
      const incompleteSubtasks = task.subtasks.filter(st => st.status !== 'DONE');
      if (incompleteSubtasks.length > 0) {
        console.log(`Task ${taskId} has ${incompleteSubtasks.length} incomplete subtasks.`);
        console.log('Marking all subtasks as DONE...');
        
        // Mark all subtasks as DONE
        task.subtasks = task.subtasks.map(subtask => ({
          ...subtask,
          status: 'DONE',
          updatedAt: new Date()
        }));
      }
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

  addSubtask(parentTaskId: number, title: string): Subtask | null {
    const found = this.storage.findTask(parentTaskId);
    if (!found) return null;

    const { task, tag } = found;
    const tagFile = this.storage.loadTagFile(tag);
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
    this.storage.saveTagFile(tag, tagFile);
    
    return subtask;
  }

  updateSubtaskStatus(parentTaskId: number, subtaskId: number, status: TaskStatus): Subtask | null {
    const found = this.storage.findTask(parentTaskId);
    if (!found) return null;

    const { task, tag } = found;
    const tagFile = this.storage.loadTagFile(tag);
    const taskIndex = tagFile.tasks.findIndex(t => t.id === parentTaskId);
    
    if (taskIndex === -1) return null;

    const subtaskIndex = task.subtasks.findIndex(st => st.id === subtaskId);
    if (subtaskIndex === -1) return null;

    const updatedSubtask = task.subtasks[subtaskIndex];
    if (!updatedSubtask) return null;

    updatedSubtask.status = status;
    updatedSubtask.updatedAt = new Date();
    task.updatedAt = new Date();
    
    tagFile.tasks[taskIndex] = task;
    this.storage.saveTagFile(tag, tagFile);
    
    return updatedSubtask;
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

  updateSubtask(parentTaskId: number, subtaskId: number, updates: Partial<Pick<Subtask, 'title'>>): Subtask | null {
    const found = this.storage.findTask(parentTaskId);
    if (!found) return null;

    const { task, tag } = found;
    const tagFile = this.storage.loadTagFile(tag);
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
    this.storage.saveTagFile(tag, tagFile);
    
    return updatedSubtask;
  }
}