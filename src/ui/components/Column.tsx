import { useEffect, useRef } from 'react';
import type { ScrollBoxRenderable } from '@opentui/core';
import type { Task } from '../../types';
import { colors, STATUS_LABELS, STATUS_COLORS } from '../theme';

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
              const subtaskCount = t.subtasks.length;
              const completedSubtasks = t.subtasks.filter(s => s.status === 'DONE').length;

              return (
                <box
                  key={t.id}
                  flexShrink={0}
                  style={{
                    flexDirection: 'row',
                    height: 3, // Ensure consistent height for the bar
                    backgroundColor: colors.panelAlt
                  }}
                  onMouseDown={() => onSelect(i)}
                >
                  {/* Selection Bar */}
                  <box
                    style={{
                      width: 1,
                      height: '100%',
                      backgroundColor: selected ? colors.warn : 'transparent',
                      marginRight: 1
                    }}
                  />

                  {/* Content Area */}
                  <box style={{ flexDirection: 'column', flexGrow: 1 }}>
                    {/* Row 1: Title */}
                    <text fg={colors.text}>
                      <strong>#{t.id} {t.title}</strong>
                    </text>

                    {/* Row 2: Status & Subtasks */}
                    <box style={{ flexDirection: 'row', gap: 2 }}>
                      <text fg={STATUS_COLORS[t.status]}>
                        {STATUS_LABELS[t.status]}
                      </text>
                      <text fg={colors.dim}>
                        {subtaskCount > 0
                          ? `${completedSubtasks}/${subtaskCount} subtasks`
                          : 'No subtasks'}
                      </text>
                    </box>
                  </box>
                </box>
              );
            })}
          </box>
        </scrollbox>
      )}
    </box>
  );
}
