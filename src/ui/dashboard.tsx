import { createRoot, useKeyboard } from '@opentui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TaskStatus } from '../types';
import { colors, STATUS_COLORS, STATUS_LABELS, STATUS_SEQUENCE } from './theme';
import { useTaskData } from './hooks/useTaskData';
import { useTerminalSize } from './hooks/useTerminalSize';
import { useSelection } from './hooks/useSelection';
import { Sidebar } from './components/Sidebar';
import { Column } from './components/Column';
import { Pill } from './components/Pill';
import { Modal, type ModalState } from './components/Modal';
import { sanitizeTagName, isValidTagName } from '../utils/tag-sanitizer';
import { createCliRenderer, type ScrollBoxRenderable } from '@opentui/core';

export async function runDashboard(): Promise<void> {
  // Create a CLI renderer instance using the OpenTUI core utilities.
  // We then attach our React application tree to that renderer via `createRoot`,
  // which is the current, supported integration API for @opentui/react.
  const renderer = await createCliRenderer();
  createRoot(renderer).render(<BoardApp />);
}

function BoardApp() {
  const { manager, tags, activeTag, setActiveTag, tasks, refresh } = useTaskData();
  const { width } = useTerminalSize();
  const stacked = width < 120;
  const compact = width < 120;
  const superCompact = width < 120;
  const [showDone, setShowDone] = useState(true);
  const [showSidebar, setShowSidebar] = useState(width >= 120);
  const [sidebarMode, setSidebarMode] = useState<'auto' | 'manual'>('auto');
  const [modal, setModal] = useState<ModalState>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [focusArea, setFocusArea] = useState<'columns' | 'tags' | 'subtasks'>('columns');

  const notify = useCallback((m: string) => {
    setMessage(m);
    setTimeout(() => setMessage(null), 2000);
  }, []);

  // Group tasks
  const grouped = useMemo(() => [
    tasks.filter(t => t.status === 'PENDING'),
    tasks.filter(t => t.status === 'INPROGRESS'),
    tasks.filter(t => t.status === 'DONE')
  ] as const, [tasks]);

  const visibleColumns = useMemo(() => [
    grouped[0],
    grouped[1],
    showDone ? grouped[2] : []
  ] as const, [grouped, showDone]);

  const { col, rowIndices, setCol, setRowIndices, subtaskIndex, setSubtaskIndex, moveRow, moveCol, selectedTask } = useSelection(visibleColumns);
  const subtasks = selectedTask?.subtasks ?? [];
  const pendingSubtasks = subtasks.filter(s => s.status !== 'DONE').length;
  const subtaskSelection = Math.min(subtaskIndex, Math.max(0, subtasks.length - 1));
  const subtaskScrollRef = useRef<ScrollBoxRenderable | null>(null);

  useEffect(() => {
    setSubtaskIndex(0);
  }, [selectedTask?.id, setSubtaskIndex]);

  useEffect(() => {
    if (!subtaskScrollRef.current) return;
    const targetY = Math.max(0, subtaskSelection * 3); // each subtask row is 3 lines
    subtaskScrollRef.current.scrollTo({ x: 0, y: targetY });
  }, [subtaskSelection, subtasks.length]);
  useEffect(() => {
    if (!showDone && col > 1) {
      setCol(1);
    }
  }, [showDone, col, setCol]);

  useEffect(() => {
    if (!showSidebar && focusArea === 'tags') {
      setFocusArea('columns');
    }
  }, [showSidebar, focusArea]);

  useEffect(() => {
    if (sidebarMode === 'auto') {
      setShowSidebar(width >= 120);
    } else if (width < 80 && showSidebar) {
      // Force hide on extremely small viewports
      setShowSidebar(false);
    }
  }, [width, sidebarMode, showSidebar]);

  useEffect(() => {
    if (superCompact && showSidebar && focusArea !== 'tags') {
      setFocusArea('tags');
    }
  }, [superCompact, showSidebar, focusArea]);

  const applyStatus = useCallback((taskId: number, status: TaskStatus, tag: string, opts?: { completeSubtasks?: boolean }) => {
    manager.updateTaskStatus(taskId, status, tag, opts);
    refresh();
    notify(`Task #${taskId} -> ${STATUS_LABELS[status]}`);
  }, [manager, refresh, notify]);

  const cycleSubtaskStatus = useCallback(() => {
    if (!selectedTask || subtasks.length === 0) return;
    const st = subtasks[subtaskSelection];
    if (!st) return;
    const i = STATUS_SEQUENCE.indexOf(st.status);
    const next = STATUS_SEQUENCE[(i + 1) % STATUS_SEQUENCE.length]!;
    manager.updateSubtaskStatus(selectedTask.id, st.id, next);
    refresh();
    notify(`Subtask #${st.id} -> ${STATUS_LABELS[next]}`);
  }, [selectedTask, subtasks, subtaskSelection, manager, refresh, notify]);

  const deleteSubtask = useCallback(() => {
    if (!selectedTask || subtasks.length === 0) return;
    const st = subtasks[subtaskSelection];
    if (!st) return;
    const ok = manager.deleteSubtask(selectedTask.id, st.id);
    notify(ok ? `Deleted subtask #${st.id}` : 'Subtask not found');
    setSubtaskIndex(i => Math.max(0, Math.min(i, subtasks.length - 2)));
    refresh();
  }, [manager, notify, refresh, selectedTask, subtasks, subtaskSelection, setSubtaskIndex]);

  const moveSubtask = useCallback((delta: number) => {
    if (!selectedTask || subtasks.length === 0) return;
    const from = subtaskSelection;
    const to = Math.max(0, Math.min(subtasks.length - 1, from + delta));
    if (from === to) return;
    const result = manager.reorderSubtasks(selectedTask.id, from, to);
    if (result) {
      setSubtaskIndex(to);
      refresh();
      notify(`Moved subtask to position ${to + 1}`);
    }
  }, [selectedTask, subtasks, subtaskSelection, manager, refresh, notify, setSubtaskIndex]);

  const beginSubtaskNew = useCallback(() => {
    if (!selectedTask) return notify('Select a task first');
    setModal({ type: 'subtaskNew', taskId: selectedTask.id, tag: selectedTask.tag, value: '' });
  }, [selectedTask, setModal, notify]);

  const beginSubtaskEdit = useCallback(() => {
    if (!selectedTask || subtasks.length === 0) return;
    const st = subtasks[subtaskSelection];
    if (!st) return;
    setModal({ type: 'subtaskEdit', taskId: selectedTask.id, tag: selectedTask.tag, subtaskId: st.id, value: st.title });
  }, [selectedTask, subtasks, subtaskSelection]);

  const cycle = useCallback(() => {
    if (!selectedTask) return;
    const i = STATUS_SEQUENCE.indexOf(selectedTask.status);
    const next = STATUS_SEQUENCE[(i + 1) % STATUS_SEQUENCE.length]!;
    if (next === 'DONE') {
      const pending = selectedTask.subtasks.filter(s => s.status !== 'DONE').length;
      if (pending > 0) {
        setModal({ type: 'confirmComplete', taskId: selectedTask.id, tag: selectedTask.tag, pendingSubtasks: pending, nextStatus: 'DONE' });
        return;
      }
    }
    applyStatus(selectedTask.id, next, selectedTask.tag);
  }, [selectedTask, applyStatus]);

  const beginNew = useCallback(() => setModal({ type: 'editTitle', taskId: -1, tag: activeTag, value: '' }), [activeTag]);
  const beginNewTag = useCallback(() => setModal({ type: 'newTag', value: '' }), []);
  const beginEdit = useCallback(() => { if (selectedTask) setModal({ type: 'editTitle', taskId: selectedTask.id, tag: selectedTask.tag, value: selectedTask.title }); }, [selectedTask]);
  const beginDesc = useCallback(() => { if (selectedTask) setModal({ type: 'editDescription', taskId: selectedTask.id, tag: selectedTask.tag, value: selectedTask.description ?? '' }); }, [selectedTask]);
  const beginDelete = useCallback(() => { if (selectedTask) setModal({ type: 'confirmDelete', taskId: selectedTask.id, tag: selectedTask.tag }); }, [selectedTask]);

  const submitModal = useCallback((value: string) => {
    if (!modal || modal.type === 'confirmDelete' || modal.type === 'confirmComplete' || modal.type === 'help') return;
    const text = value.trim();
    if (!text) return notify('Text required');

    if (modal.type === 'newTag') {
      const normalized = sanitizeTagName(text);
      if (!isValidTagName(normalized)) return notify('Invalid tag name');
      if (tags.includes(normalized)) {
        setActiveTag(normalized);
        notify(`Switched to tag "${normalized}"`);
      } else {
        manager.createTag(normalized);
        setActiveTag(normalized);
        notify(`Created tag "${normalized}"`);
      }
    } else if (modal.taskId === -1) {
      const t = manager.createTask(text, undefined, activeTag);
      notify(`Created #${t.id}`);
    } else if (modal.type === 'editTitle') {
      manager.updateTask(modal.taskId, { title: text });
      notify(`Updated #${modal.taskId}`);
    } else if (modal.type === 'editDescription') {
      manager.updateTask(modal.taskId, { description: text });
      notify(`Saved desc for #${modal.taskId}`);
    } else if (modal.type === 'subtaskNew') {
      const st = manager.addSubtask(modal.taskId, text);
      notify(st ? `Added subtask #${st.id}` : 'Subtask not added');
      setSubtaskIndex(subtasks.length); // jump to new
    } else if (modal.type === 'subtaskEdit') {
      const updated = manager.updateSubtask(modal.taskId, modal.subtaskId, { title: text });
      notify(updated ? `Updated subtask #${modal.subtaskId}` : 'Subtask not found');
    }
    setModal(null);
    refresh();
  }, [modal, manager, activeTag, notify, refresh, setActiveTag, tags, subtasks.length, setSubtaskIndex]);

  const moveTag = useCallback((delta: number) => {
    if (tags.length === 0) return;
    const i = Math.max(0, tags.indexOf(activeTag));
    const n = Math.max(0, Math.min(i + delta, tags.length - 1));
    setActiveTag(tags[n]!);
  }, [tags, activeTag, setActiveTag]);

  useKeyboard(key => {
    if (key.ctrl && key.name === 'c') process.exit(0);
    const seq = key.sequence?.toLowerCase?.() ?? '';
    if (seq === 'q') process.exit(0);

    if (modal) {
      if (modal.type === 'confirmDelete') {
        if (seq === 'y' || key.name === 'return') {
          const ok = manager.deleteTask(modal.taskId, modal.tag);
          notify(ok ? `Deleted #${modal.taskId}` : 'Not found');
          setModal(null);
          refresh();
        } else if (seq === 'n' || key.name === 'escape') setModal(null);
        return;
      }
      if (modal.type === 'confirmComplete') {
        if (seq === 'y' || key.name === 'return') {
          applyStatus(modal.taskId, modal.nextStatus, modal.tag, { completeSubtasks: true });
          setModal(null);
        } else if (seq === 'n' || key.name === 'escape') setModal(null);
        return;
      }
      if (key.name === 'escape') return setModal(null);
      return;
    }

    // Super compact focus mode escape
    if (width < 120 && focusArea === 'subtasks' && key.name === 'escape') {
      setFocusArea('columns');
      return;
    }

    if (focusArea === 'tags') {
      if (key.name === 'up') return moveTag(-1);
      if (key.name === 'down') return moveTag(1);
      if (key.name === 'right' || key.name === 'return') {
        if (superCompact) setShowSidebar(false);
        setFocusArea('columns');
        notify('Focus: columns');
        return;
      }
    }
    if (focusArea === 'columns' && key.name === 'return') {
      if (selectedTask) {
        setFocusArea('subtasks');
        notify('Focus: subtasks');
      }
      return;
    }
    if (focusArea === 'subtasks') {
      if (key.name === 'up') {
        setSubtaskIndex(i => Math.max(0, i - 1));
        return;
      }
      if (key.name === 'down') {
        const len = selectedTask?.subtasks.length ?? 0;
        setSubtaskIndex(i => Math.min(len - 1, Math.max(0, i + 1)));
        return;
      }
      if (key.shift && key.name === 'up') { moveSubtask(-1); return; }
      if (key.shift && key.name === 'down') { moveSubtask(1); return; }
      if (seq === 'c') { cycleSubtaskStatus(); return; }
      if (seq === 'u') { beginSubtaskNew(); return; }
      if (seq === 'i') { beginSubtaskEdit(); return; }
      if (key.name === 'backspace' || key.name === 'delete') { deleteSubtask(); return; }
      if (key.name === 'left') { setFocusArea('columns'); notify('Focus: columns'); return; }
    }

    switch (key.name) {
      case 'up': return moveRow(-1);
      case 'down': return moveRow(1);
      case 'left':
        if (key.meta || key.option) return moveTag(-1);
        if (focusArea === 'subtasks') { setFocusArea('columns'); notify('Focus: columns'); return; }
        if (col === 0 && showSidebar) { setFocusArea('tags'); notify('Focus: tags'); return; }
        return moveCol(-1, showDone ? 3 : 2);
      case 'right':
        if (key.meta || key.option) return moveTag(1);
        if (focusArea === 'tags') { setFocusArea('columns'); notify('Focus: columns'); return; }
        if (focusArea === 'subtasks') return;
        return moveCol(1, showDone ? 3 : 2);
    }

    if (seq === 's') cycle();
    else if (seq === 'e') beginEdit();
    else if (seq === 'd') beginDesc();
    else if (seq === 'x') beginDelete();
    else if (seq === 'n') beginNew();
    else if (seq === 't') beginNewTag();
    else if (seq === 'a') { setShowDone(v => !v); notify(`Done: ${!showDone ? 'show' : 'hide'}`); }
    else if (seq === 'b') { setSidebarMode('manual'); setShowSidebar(v => !v); notify(`Sidebar: ${!showSidebar ? 'show' : 'hide'}`); }
    else if (seq === '?' || seq === 'h') setModal({ type: 'help' });
    else if (seq === '[' || seq === ',') moveTag(-1);
    else if (seq === ']' || seq === '.') moveTag(1);
    else if (seq === 'r') refresh();
  });

  const counts = { todo: grouped[0].length, doing: grouped[1].length, done: grouped[2].length };

  // In superCompact mode, sidebar takes full screen
  if (superCompact && showSidebar) {
    return (
      <box style={{ width: '100%', height: '100%', backgroundColor: colors.bg }}>
        <Sidebar width={width} tags={tags} activeTag={activeTag} focused={focusArea === 'tags'} fullWidth={true} />
      </box>
    );
  }

  // In superCompact mode, if focused on subtasks, show only details
  if (superCompact && focusArea === 'subtasks' && selectedTask) {
    return (
      <box style={{ width: '100%', height: '100%', backgroundColor: colors.bg, flexDirection: 'column', padding: 1 }}>
        <box style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 }}>
          <text fg={colors.muted}>Focus Mode</text>
          <Pill label="Back" hotkey="Esc" />
        </box>
        <box style={{
          backgroundColor: colors.panel,
          padding: 1,
          gap: 1,
          flexDirection: 'column',
          flexGrow: 1,
          border: true,
          borderColor: colors.accent
        }}>
          <text fg={colors.text}>
            <strong>#{selectedTask.id} {selectedTask.title}</strong>
          </text>
          <text fg={colors.muted}>{selectedTask.description?.trim() ? selectedTask.description : 'No description'}</text>
          <text fg={colors.text}><strong>Subtasks ({pendingSubtasks}/{subtasks.length} open)</strong></text>
          {subtasks.length === 0 ? (
            <text fg={colors.muted}>No subtasks</text>
          ) : (
            <scrollbox
              style={{ flexGrow: 1, flexDirection: 'row' }}
              paddingRight={1}
              ref={node => { subtaskScrollRef.current = node as ScrollBoxRenderable | null; }}
            >
              <box flexDirection="column" gap={0}>
                {subtasks.map((st, i) => {
                  const selected = i === subtaskSelection;
                  return (
                    <box
                      key={st.id}
                      flexShrink={0}
                      style={{
                        flexDirection: 'row',
                        height: 3,
                        backgroundColor: colors.panelAlt
                      }}
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
                          <strong>#{st.id} {st.title}</strong>
                        </text>

                        {/* Row 2: Status */}
                        <text fg={STATUS_COLORS[st.status]}>
                          {STATUS_LABELS[st.status]}
                        </text>
                      </box>
                    </box>
                  );
                })}
              </box>
            </scrollbox>
          )}
        </box>
        {modal ? (
          <Modal
            modal={modal}
            onInput={v => setModal(m => (m && m.type !== 'confirmDelete' ? { ...m, value: v } : m))}
            onSubmit={submitModal}
          />
        ) : null}
      </box>
    );
  }

  return (
    <box style={{ width: '100%', height: '100%', backgroundColor: colors.bg, flexDirection: 'row' }}>
      {message ? (
        <box
          style={{
            position: 'absolute',
            top: 1,
            right: 1,
            backgroundColor: colors.panelAlt,
            border: true,
            borderColor: colors.accent,
            padding: 1,
            maxWidth: 48,
            flexDirection: 'row',
            zIndex: 100
          }}
        >
          <text fg={colors.text}>{message}</text>
        </box>
      ) : null}
      {showSidebar ? (
        <Sidebar width={width} tags={tags} activeTag={activeTag} focused={focusArea === 'tags'} />
      ) : null}

      <box style={{ flexGrow: 1, flexDirection: 'column', gap: 1, padding: 1 }}>
        <box style={{ backgroundColor: colors.panel, justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, flexDirection: 'row' }}>
          <box style={{ flexDirection: 'row', gap: 1, padding: 1 }}>
            <text fg={colors.text}>Tag: <span fg={colors.warn}>{activeTag}</span> | {showDone ? 'All' : 'Open'} | {tasks.length}</text>
          </box>
          {superCompact ? (
            <box style={{ flexDirection: 'row', gap: 1, padding: 1 }}>
              <Pill label="Help" hotkey="?" />
            </box>
          ) : compact ? (
            <box style={{ flexDirection: 'column', gap: 1, padding: 1, alignItems: 'center' }}>
              <box style={{ flexDirection: 'row', gap: 1, padding: 1 }}>
                <Pill label="New Task" hotkey="n" />
                <Pill label="New Tag" hotkey="t" />
              </box>
              <box style={{ flexDirection: 'row', gap: 1, padding: 1 }}>
                <Pill label={showDone ? 'Hide Done' : 'Show Done'} hotkey="a" />
                <Pill label="Cycle Status" hotkey="s" />
              </box>
            </box>
          ) : (
            <box style={{ flexDirection: 'column', gap: 1, padding: 1, alignItems: 'center' }}>
              <box style={{ flexDirection: 'row', gap: 1, padding: 1 }}>
                <Pill label="New Task" hotkey="n" />
                <Pill label="New Tag" hotkey="t" />
                <Pill label={showDone ? 'Hide Done' : 'Show Done'} hotkey="a" />
                <Pill label="Cycle Status" hotkey="s" />
              </box>
            </box>
          )}
        </box>

        <box style={{ flexGrow: 1, flexDirection: stacked ? 'column' : 'row', gap: 1 }}>
          {(!superCompact || col === 0) && (
            <Column
              title={`Pending (${counts.todo})`}
              color={colors.warn}
              tasks={visibleColumns[0]}
              focused={col === 0}
              selectedIndex={rowIndices[0] ?? 0}
              onSelect={i => { setFocusArea('columns'); setCol(0); setRowIndices(p => [i, p[1] ?? 0, p[2] ?? 0]); }}
            />
          )}
          {(!superCompact || col === 1) && (
            <Column
              title={`In Progress (${counts.doing})`}
              color={colors.accent}
              tasks={visibleColumns[1]}
              focused={col === 1}
              selectedIndex={rowIndices[1] ?? 0}
              onSelect={i => { setFocusArea('columns'); setCol(1); setRowIndices(p => [p[0] ?? 0, i, p[2] ?? 0]); }}
            />
          )}
          {showDone && (!superCompact || col === 2) && (
            <Column
              title={`Done (${counts.done})`}
              color={colors.info}
              tasks={visibleColumns[2]}
              focused={col === 2}
              selectedIndex={rowIndices[2] ?? 0}
              onSelect={i => { setFocusArea('columns'); setCol(2); setRowIndices(p => [p[0] ?? 0, p[1] ?? 0, i]); }}
            />
          )}
        </box>

        {!superCompact && (
          <box style={{
            backgroundColor: colors.panel,
            padding: 1,
            gap: 1,
            flexDirection: 'column',
            flexShrink: 0,
            border: true,
            borderColor: focusArea === 'subtasks' ? colors.accent : colors.panelAlt,
            minWidth: 36,
            maxHeight: '50%'
          }}>
            <text fg={colors.text}><strong>Details{subtasks.length ? ' / Subtasks' : ''}{focusArea === 'subtasks' ? ' ←' : ''}</strong></text>
            {selectedTask ? (
              <>
                <text fg={colors.muted}>{selectedTask.description?.trim() ? selectedTask.description : 'No description'}</text>
                <text fg={colors.text}><strong>Subtasks ({pendingSubtasks}/{subtasks.length} open)</strong></text>
                {subtasks.length === 0 ? (
                  <text fg={colors.muted}>No subtasks</text>
                ) : (
                  <scrollbox
                      style={{ flexGrow: 1, flexDirection: 'row' }}
                      paddingRight={1}
                      ref={node => { subtaskScrollRef.current = node as ScrollBoxRenderable | null; }}
                    >
                      <box flexDirection="column" gap={0}>
                        {subtasks.map((st, i) => {
                          const selected = focusArea === 'subtasks' && i === subtaskSelection;
                          return (
                            <box
                              key={st.id}
                              flexShrink={0}
                              style={{
                                flexDirection: 'row',
                                height: 3,
                                backgroundColor: colors.panelAlt
                              }}
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
                                  <strong>#{st.id} {st.title}</strong>
                                </text>

                                {/* Row 2: Status */}
                                <text fg={STATUS_COLORS[st.status]}>
                                  {STATUS_LABELS[st.status]}
                                </text>
                              </box>
                            </box>
                          );
                        })}
                    </box>
                  </scrollbox>
                )}
              </>
            ) : (
              <text fg={colors.muted}>Select a task to see details</text>
            )}
          </box>
        )}

        {!superCompact && (
          <box style={{ backgroundColor: colors.panel, padding: 1, justifyContent: 'space-between', alignItems: 'center' }}>
            <box style={{ flexDirection: 'column', gap: 1 }}>
              {compact ? (
                <box style={{ flexDirection: 'column', gap: 1 }}>
                  <box style={{ flexDirection: 'row', gap: 1 }}>
                    <Pill label="Move" hotkey="Arrows" />
                    <Pill label="Change Tag" hotkey="[ / ]" />
                    <Pill label="Sidebar" hotkey="b" />
                  </box>
                  <box style={{ flexDirection: 'row', gap: 1 }}>
                    <Pill label="Edit" hotkey="e" />
                    <Pill label="Description" hotkey="d" />
                    <Pill label="Delete" hotkey="x" fg="#ffffff" bg={colors.danger} />
                  </box>
                </box>
              ) : (
                <box style={{ flexDirection: 'row', gap: 1 }}>
                  <Pill label="Move" hotkey="Arrows" />
                  <Pill label="Change Tag" hotkey="[ / ]" />
                  <Pill label="Edit" hotkey="e" />
                  <Pill label="Desc" hotkey="d" />
                  <Pill label="Sidebar" hotkey="b" />
                  <Pill label="Delete" hotkey="x" fg="#ffffff" bg={colors.danger} />
                </box>
              )}
              {selectedTask ? (
                <box style={{ flexDirection: 'row', gap: 1, marginTop: 1 }}>
                  <Pill label="Focus Subtasks" hotkey="Enter" />
                  <Pill label="Add Subtask" hotkey="u" />
                  <Pill label="Edit Subtask" hotkey="i" />
                  <Pill label="Status" hotkey="c" />
                  <Pill label="Reorder" hotkey="Shift+↑↓" />
                  <Pill label="Delete Subtask" hotkey="Del/Backspace" fg="#ffffff" bg={colors.danger} />
                </box>
              ) : null}
            </box>
            <text fg={colors.muted}>{' '}</text>
          </box>
        )}

        {modal ? (
          <Modal
            modal={modal}
            onInput={v => setModal(m => (m && m.type !== 'confirmDelete' ? { ...m, value: v } : m))}
            onSubmit={submitModal}
          />
        ) : null}
      </box>
    </box>
  );
}
