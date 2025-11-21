import { useState, useCallback, useEffect, useRef } from 'react';
import { TaskManager } from '../../core/task-manager';
import type { Task } from '../../types';
import { sanitizeTagName, isValidTagName } from '../../utils/tag-sanitizer';

export function useTaskData() {
  // Lazy initialization of TaskManager
  const managerRef = useRef<TaskManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = new TaskManager();
  }
  const manager = managerRef.current;

  const [tags, setTags] = useState<string[]>(['base']);
  const [byTag, setByTag] = useState<Record<string, Task[]>>({ base: [] });
  const [activeTag, setActiveTagState] = useState('base');
  const setActiveTag = useCallback((tag: string) => {
    const normalized = sanitizeTagName(tag);
    setActiveTagState(isValidTagName(normalized) ? normalized : 'base');
  }, []);

  const refresh = useCallback(() => {
    const allTags = manager.getAllTags();
    const uniqueTags = Array.from(new Set(['base', ...allTags])).sort((a, b) =>
      (a === 'base' ? -1 : b === 'base' ? 1 : a.localeCompare(b))
    );
    
    const nextByTag: Record<string, Task[]> = {};
    for (const t of uniqueTags) {
      nextByTag[t] = manager.listTasks(t);
    }
    
    setTags(uniqueTags);
    setByTag(nextByTag);
    if (!uniqueTags.includes(activeTag)) {
      setActiveTag(uniqueTags[0] ?? 'base');
    }
  }, [manager, activeTag, setActiveTag]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  const safeActiveTag = isValidTagName(sanitizeTagName(activeTag)) ? sanitizeTagName(activeTag) : 'base';
  const tasks = byTag[safeActiveTag] ?? [];

  return {
    manager,
    tags,
    activeTag: safeActiveTag,
    setActiveTag,
    tasks,
    refresh
  };
}
