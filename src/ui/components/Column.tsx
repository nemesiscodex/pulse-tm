import { useEffect, useRef } from 'react';
import type { ScrollBoxRenderable } from '@opentui/core';
import type { Task } from '../../types';
import { colors, STATUS_LABELS } from '../theme';

interface ColumnProps {
  title: string;
  color: string;
  tasks: Task[];
  focused: boolean;
  selectedIndex: number;
  onSelect: (i: number) => void;
}

export function Column({ title, color, tasks, focused, selectedIndex, onSelect }: ColumnProps) {
  const scrollRef = useRef<ScrollBoxRenderable | null>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const rowHeight = 3; // approx 2 text lines + gap
    const targetY = Math.max(0, selectedIndex * rowHeight - 1);
    scrollRef.current.scrollTo({ x: 0, y: targetY });
  }, [selectedIndex, tasks.length]);

  return (
    <box style={{
      flexGrow: 1,
      minWidth: 28,
      flexDirection: 'column',
      gap: 1,
      backgroundColor: colors.panel,
      padding: 1,
      border: true,
      borderColor: focused ? color : colors.panelAlt
    }}>
      <text fg={color}><strong>{title}{focused ? ' ←' : ''}</strong></text>
      {tasks.length === 0 ? (
        <scrollbox
          key="empty"
          style={{ flexGrow: 1, flexDirection: 'row', gap: 1 }}
          ref={node => { scrollRef.current = node as ScrollBoxRenderable | null; }}
          paddingRight={1}
          scrollbarOptions={{
            trackOptions: {
              backgroundColor: colors.panelAlt,
              foregroundColor: colors.dim
            }
          }}
        >
          <box style={{ flexDirection: 'column', gap: 1, padding: 1, backgroundColor: colors.panelAlt }}>
            <text fg={focused ? color : colors.muted}><strong>No items</strong></text>
          </box>
        </scrollbox>
      ) : (
        <scrollbox
          key="list"
          stickyScroll={true}
          style={{ flexGrow: 1, flexDirection: 'row' }}
          ref={node => { scrollRef.current = node as ScrollBoxRenderable | null; }}
          scrollbarOptions={{
            trackOptions: {
              backgroundColor: colors.panelAlt,
              foregroundColor: colors.dim
            }
          }}
        >
          <box flexDirection="column" flexShrink={0} gap={1}>
            {tasks.map((t, i) => {
              const selected = focused && i === selectedIndex;
              return (
                <box
                  key={t.id}
                  flexShrink={0}
                  style={{ backgroundColor: selected ? colors.info : colors.panelAlt }}
                  onMouseDown={() => onSelect(i)}
                >
                  <text fg={selected ? '#000000' : colors.text}>
                    <strong>#{t.id}</strong> {t.title}
                  </text>
                  <text fg={selected ? '#000000' : colors.muted}>
                    [{STATUS_LABELS[t.status]}] {t.subtasks.length > 0 ? ` · [${t.subtasks.filter(s => s.status !== 'DONE').length}/${t.subtasks.length} open]` : ' · [no subtasks]'}
                  </text>
                </box>
              );
            })}
          </box>
        </scrollbox>
      )}
    </box>
  );
}
