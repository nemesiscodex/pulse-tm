export type TaskStatus = 'PENDING' | 'INPROGRESS' | 'DONE';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  tag: string;
  order: number;
  subtasks: Subtask[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Subtask {
  id: number;
  title: string;
  status: TaskStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TagFile {
  next_id: number;
  tasks: Task[];
}

export interface CommandArgs {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
  tag?: string;
  workingDir?: string;
}