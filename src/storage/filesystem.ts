import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { parse, stringify } from 'yaml';
import type { TagFile, Task } from '../types';
import { sanitizeTagName } from '../utils/tag-sanitizer';

export class Storage {
  private pulseDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.pulseDir = join(baseDir, '.pulse');
    this.ensurePulseDir();
  }

  private ensurePulseDir(): void {
    if (!existsSync(this.pulseDir)) {
      mkdirSync(this.pulseDir, { recursive: true });
    }
  }

  private getTagFilePath(tag: string): string {
    const sanitizedTag = sanitizeTagName(tag);
    return join(this.pulseDir, `${sanitizedTag}.yml`);
  }

  private getGlobalIdPath(): string {
    return join(this.pulseDir, 'global-id.yml');
  }

  loadTagFile(tag: string): TagFile {
    const filePath = this.getTagFilePath(tag);
    
    if (!existsSync(filePath)) {
      return { next_id: 1, tasks: [] };
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const data = parse(content) as TagFile;
      
      // Ensure the file has the correct structure
      if (!data.next_id) data.next_id = 1;
      if (!data.tasks) data.tasks = [];
      
      // Convert date strings back to Date objects
      data.tasks = data.tasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        subtasks: task.subtasks.map(subtask => ({
          ...subtask,
          createdAt: new Date(subtask.createdAt),
          updatedAt: new Date(subtask.updatedAt)
        }))
      }));
      
      return data;
    } catch (error) {
      console.error(`Error loading tag file for ${tag}:`, error);
      return { next_id: 1, tasks: [] };
    }
  }

  saveTagFile(tag: string, data: TagFile): void {
    const filePath = this.getTagFilePath(tag);
    
    try {
      const yamlContent = stringify(data);
      writeFileSync(filePath, yamlContent, 'utf-8');
    } catch (error) {
      console.error(`Error saving tag file for ${tag}:`, error);
      throw error;
    }
  }

  getAllTags(): string[] {
    try {
      const files = require('fs').readdirSync(this.pulseDir);
      return files
        .filter((file: string) => file.endsWith('.yml'))
        .map((file: string) => file.replace('.yml', ''));
    } catch (error) {
      return [];
    }
  }

  findTask(taskId: number): { task: Task; tag: string } | null {
    const tags = this.getAllTags();
    
    for (const tag of tags) {
      const tagFile = this.loadTagFile(tag);
      const task = tagFile.tasks.find(t => t.id === taskId);
      if (task) {
        return { task, tag };
      }
    }
    
    return null;
  }
}