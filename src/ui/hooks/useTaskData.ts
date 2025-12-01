import { useState, useCallback, useEffect, useRef } from 'react';
import * as fs from 'fs';
import { TaskManager } from '../../core/task-manager';
import type { Task } from '../../types';
import { sanitizeTagName, isValidTagName } from '../../utils/tag-sanitizer';

export function useTaskData(workingDir?: string) {
  // Lazy initialization of TaskManager
  const managerRef = useRef<TaskManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = new TaskManager(workingDir);
  }
  const manager = managerRef.current;

  const [tags, setTags] = useState<string[]>(['base']);
  const [byTag, setByTag] = useState<Record<string, Task[]>>({ base: [] });
  const [activeTag, setActiveTagState] = useState('base');
  const [dataVersion, setDataVersion] = useState(0);
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
    setDataVersion(v => v + 1);
  }, [manager, activeTag, setActiveTag]);

  // Initial load and file watching
  useEffect(() => {
    refresh();

    const pulseDir = manager.getPulseDir();
    let debounceTimer: NodeJS.Timeout;

    // Watch the .pulse directory for changes
    // We use fs.watch which is efficient and event-driven
    const watcher = fs.watch(pulseDir, { recursive: false }, (eventType: string, filename: string | Buffer | null) => {
      if (!filename || typeof filename !== 'string' || !filename.endsWith('.yml')) return;

      // Debounce the refresh to avoid multiple updates for a single save
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        refresh();
      }, 100);
    });

    return () => {
      watcher.close();
      clearTimeout(debounceTimer);
    };
  }, [refresh, manager]);

  const safeActiveTag = isValidTagName(sanitizeTagName(activeTag)) ? sanitizeTagName(activeTag) : 'base';
  const tasks = byTag[safeActiveTag] ?? [];

  return {
    manager,
    tags,
    activeTag: safeActiveTag,
    setActiveTag,
    tasks,
    refresh,
    dataVersion
  };
}
