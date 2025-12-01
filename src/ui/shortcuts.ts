import { colors } from './theme';

export interface ShortcutDef {
  key: string;
  label: string;
  action: string; // Internal action identifier
  hotkeyDisplay?: string; // Optional override for display (e.g. "Shift+D")
  fg?: string;
  bg?: string;
}

export const SHORTCUTS = {
  GENERAL: [
    { key: '?', label: 'Help', action: 'help' },
    { key: 'q', label: 'Quit', action: 'quit' },
    { key: 'r', label: 'Refresh', action: 'refresh' },
  ],
  NAVIGATION: [
    { key: 'Arrows ↑↓', label: 'Navigate', action: 'navigate' },
    { key: 'Enter', label: 'Focus Subtasks', action: 'focus_subtasks' },
    { key: 'Esc', label: 'Back', action: 'back' },
    { key: 'b', label: 'Sidebar', action: 'toggle_sidebar' },
    { key: '[ ]', label: 'Cycle Tags', action: 'cycle_tags' },
  ],
  TASKS: [
    { key: 'n', label: 'New Task', action: 'new_task' },
    { key: 'e', label: 'Edit', action: 'edit_title' },
    { key: 'd', label: 'Desc', action: 'edit_desc' },
    { key: 's', label: 'Status', action: 'cycle_status' },
    { key: 'x', label: 'Delete', action: 'delete_task', fg: '#ffffff', bg: colors.danger },
    { key: 'a', label: 'Toggle Done', action: 'toggle_done' },
    { key: 'Shift+↑↓', label: 'Move', action: 'move_task' }, // Added for task movement
  ],
  SUBTASKS: [
    { key: 'u', label: 'Add', action: 'new_subtask' },
    { key: 'i', label: 'Edit', action: 'edit_subtask' },
    { key: 'c', label: 'Status', action: 'cycle_subtask_status' },
    { key: 'Shift+↑↓', label: 'Reorder', action: 'move_subtask' },
    { key: 'Del/Bksp', label: 'Delete', action: 'delete_subtask', fg: '#ffffff', bg: colors.danger },
  ],
  TAGS: [
    { key: 't', label: 'New Tag', action: 'new_tag' },
    { key: 'Shift+D', label: 'Delete Tag', action: 'delete_tag', fg: '#ffffff', bg: colors.danger },
    { key: 'Shift+I', label: 'Inspect Tag', action: 'inspect_tag' },
  ],
};

export const ALL_SHORTCUTS = [
  ...SHORTCUTS.GENERAL,
  ...SHORTCUTS.NAVIGATION,
  ...SHORTCUTS.TASKS,
  ...SHORTCUTS.SUBTASKS,
  ...SHORTCUTS.TAGS,
];

