import { useState, useEffect } from 'react';
import type { Task } from '../../types';

export function useSelection(
  visibleColumns: readonly [readonly Task[], readonly Task[], readonly Task[]],
  initialCol: number = 0
) {
  const [col, setCol] = useState(initialCol);
  const [rowIndices, setRowIndices] = useState<[number, number, number]>([0, 0, 0]);
  const [subtaskIndex, setSubtaskIndex] = useState(0);

  // Ensure selection stays within bounds when data changes
  useEffect(() => {
    setRowIndices(prev => {
      const next: [number, number, number] = [0, 0, 0];
      for (let c = 0; c < 3; c++) {
        const arr = visibleColumns[c] ?? [];
        // Keep previous index if valid, otherwise clamp
        next[c] = Math.min(prev[c] ?? 0, Math.max(0, arr.length - 1));
      }
      return next;
    });
  }, [visibleColumns]);

  const moveRow = (delta: number) => {
    const currentColumnTasks = visibleColumns[col] ?? [];
    if (currentColumnTasks.length === 0) return;

    setRowIndices(prev => {
      const next = [...prev] as [number, number, number];
      const newIndex = Math.max(0, Math.min((prev[col] ?? 0) + delta, currentColumnTasks.length - 1));
      next[col] = newIndex;
      return next;
    });
  };

  const moveCol = (delta: number, maxCols: number) => {
    setCol(c => Math.max(0, Math.min(c + delta, maxCols - 1)));
  };

  const selectedTask = visibleColumns[col]?.[rowIndices[col] ?? 0] ?? null;

  return {
    col,
    rowIndices,
    setCol,
    setRowIndices,
    subtaskIndex,
    setSubtaskIndex,
    moveRow,
    moveCol,
    selectedTask
  };
}
