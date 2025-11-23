import type { TaskStatus } from '../types';

export const colors = {
  bg: '#0f1115',
  panel: '#151922',
  panelAlt: '#10141b',
  panelSelected: '#13171eff',
  accent: '#06D6A0',
  info: '#118AB2',
  warn: '#FFD166',
  danger: '#EF476F',
  text: '#DADDE1',
  muted: '#9AA0A6',
  dim: '#5f6770'
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pending',
  INPROGRESS: 'In Progress',
  DONE: 'Done'
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  PENDING: colors.text,
  INPROGRESS: colors.warn,
  DONE: colors.accent
};

export const STATUS_SEQUENCE: TaskStatus[] = ['PENDING', 'INPROGRESS', 'DONE'];
