import { colors } from '../theme';
import { Pill } from './Pill';
import { SHORTCUTS } from '../shortcuts';

export type ModalState =
  | { type: 'editTitle'; taskId: number; tag: string; value: string }
  | { type: 'editDescription'; taskId: number; tag: string; value: string }
  | { type: 'confirmDelete'; taskId: number; tag: string }
  | { type: 'confirmDeleteSubtask'; taskId: number; tag: string; subtaskId: number }
  | { type: 'confirmComplete'; taskId: number; tag: string; pendingSubtasks: number; nextStatus: 'DONE' }
  | { type: 'subtaskEdit'; taskId: number; tag: string; subtaskId: number; value: string }
  | { type: 'subtaskNew'; taskId: number; tag: string; value: string }
  | { type: 'newTagCombined'; name: string; description: string; focus: 'name' | 'description' }
  | { type: 'inspectTag'; tagName: string; description: string; taskCount: number }
  | { type: 'help' }
  | null;

interface ModalProps {
  modal: Exclude<ModalState, null>;
  onInput: (v: string, field?: string) => void;
  onSubmit: (v: string) => void;
}

type InputModal = Extract<
  ModalState,
  { type: 'subtaskNew' | 'subtaskEdit' | 'editTitle' | 'editDescription' }
>;

function getInputModalTitle(modal: InputModal): string {
  switch (modal.type) {
    case 'subtaskNew':
      return 'New Subtask';
    case 'subtaskEdit':
      return 'Edit Subtask';
    case 'editTitle':
      return modal.taskId === -1 ? 'New Task - Title' : 'Edit - Title';
    case 'editDescription':
      return modal.taskId === -1 ? 'New Task - Description' : 'Edit - Description';
  }
}

function isInputModal(modal: ModalProps['modal']): modal is InputModal {
  switch (modal.type) {
    case 'subtaskNew':
    case 'subtaskEdit':
    case 'editTitle':
    case 'editDescription':
      return true;
    default:
      return false;
  }
}

export function Modal({ modal, onInput, onSubmit }: ModalProps) {
  return (
    <box style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 999
    }}>
      <box style={{
        width: 60, padding: 1, gap: 1, flexDirection: 'column', backgroundColor: colors.panel,
        borderStyle: 'double', border: true, borderColor: colors.accent,
        maxHeight: '80%'
      }}>
        {modal.type === 'confirmDelete' ? (
          <text fg={colors.danger}>
            {modal.taskId === -1 ? `Delete tag "${modal.tag}" and all tasks? (Y/N)` : `Delete task #${modal.taskId}? (Y/N)`}
          </text>
        ) : modal.type === 'confirmDeleteSubtask' ? (
          <text fg={colors.danger}>Delete subtask #{modal.subtaskId}? (Y/N)</text>
        ) : modal.type === 'confirmComplete' ? (
          <text fg={colors.warn}>
            Mark #{modal.taskId} as done and close {modal.pendingSubtasks} open subtasks? (Y/N)
          </text>
        ) : modal.type === 'help' ? (
          <>
            <scrollbox style={{ flexDirection: 'row', flexGrow: 1 }}>
              <box style={{ flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                <text fg={colors.accent}><strong>Keyboard Shortcuts</strong></text>
                <box style={{ flexDirection: 'column', gap: 1 }}>
                  <text fg={colors.text}><strong>General</strong></text>
                  {SHORTCUTS.GENERAL.map(s => <text key={s.key} fg={colors.muted}>  {s.key.padEnd(10)} {s.label}</text>)}

                  <text fg={colors.text} style={{ marginTop: 1 }}><strong>Navigation</strong></text>
                  {SHORTCUTS.NAVIGATION.map(s => <text key={s.key} fg={colors.muted}>  {s.key.padEnd(10)} {s.label}</text>)}

                  <text fg={colors.text} style={{ marginTop: 1 }}><strong>Tasks</strong></text>
                  {SHORTCUTS.TASKS.map(s => <text key={s.key} fg={colors.muted}>  {s.key.padEnd(10)} {s.label}</text>)}

                  <text fg={colors.text} style={{ marginTop: 1 }}><strong>Subtasks</strong></text>
                  {SHORTCUTS.SUBTASKS.map(s => <text key={s.key} fg={colors.muted}>  {s.key.padEnd(10)} {s.label}</text>)}

                  <text fg={colors.text} style={{ marginTop: 1 }}><strong>Tags</strong></text>
                  {SHORTCUTS.TAGS.map(s => <text key={s.key} fg={colors.muted}>  {s.key.padEnd(10)} {s.label}</text>)}
                </box>
              </box>
            </scrollbox>
            <box style={{ marginTop: 1, flexShrink: 0 }}>
              <Pill label="Close" hotkey="Esc" />
            </box>
          </>
        ) : modal.type === 'inspectTag' ? (
          <>
             <text fg={colors.accent}><strong>Tag Details</strong></text>
             <box style={{ flexDirection: 'column', gap: 1 }}>
                <box style={{ flexDirection: 'column' }}>
                  <text fg={colors.muted}>Name</text>
                  <text fg={colors.text}><strong>{modal.tagName}</strong></text>
                </box>
                <box style={{ flexDirection: 'column' }}>
                  <text fg={colors.muted}>Description</text>
                  <text fg={colors.text}>{modal.description || '(No description)'}</text>
                </box>
                 <box style={{ flexDirection: 'column' }}>
                  <text fg={colors.muted}>Tasks</text>
                  <text fg={colors.text}>{modal.taskCount}</text>
                </box>
             </box>
             <box style={{ marginTop: 1, flexDirection: 'row', gap: 1 }}>
                <Pill label="Close" hotkey="Esc" />
             </box>
          </>
        ) : modal.type === 'newTagCombined' ? (
          <>
            <text fg={colors.text}><strong>New Tag</strong></text>
            
            <text fg={modal.focus === 'name' ? colors.accent : colors.muted}>Name</text>
            <box style={{ border: modal.focus === 'name', borderColor: colors.accent, flexDirection: 'column' }}>
              <input
                style={{ width: '100%', padding: 1 }}
                value={modal.name}
                focused={modal.focus === 'name'}
                placeholder="Enter tag name..."
                onInput={v => onInput(v, 'name')}
                onSubmit={() => onSubmit('next')}
              />
            </box>

            <text fg={modal.focus === 'description' ? colors.accent : colors.muted}>Description</text>
            <box style={{ border: modal.focus === 'description', borderColor: colors.accent, flexDirection: 'column' }}>
              <input
                style={{ width: '100%', padding: 1 }}
                value={modal.description}
                focused={modal.focus === 'description'}
                placeholder="Enter description (optional)..."
                onInput={v => onInput(v, 'description')}
                onSubmit={() => onSubmit('submit')}
              />
            </box>

            <box style={{ flexDirection: 'row', gap: 1, padding: 1 }}>
              <Pill label="Next/Save" hotkey="Enter" />
              <Pill label="Switch Focus" hotkey="Tab" />
              <Pill label="Cancel" hotkey="Esc" />
            </box>
          </>
        ) : isInputModal(modal) ? (
          <>
            <text fg={colors.text}>
              <strong>
                {getInputModalTitle(modal)}
              </strong>
            </text>
            <input
              style={{ width: '100%', padding: 1 }}
              value={modal.value}
              focused
              placeholder={
                  modal.type === 'subtaskNew'
                  ? 'Enter subtask title...'
                  : 'Enter text...'
              }
              onInput={onInput}
              onSubmit={onSubmit}
            />
            <box style={{ flexDirection: 'row', gap: 1, padding: 1 }}>
              <Pill label="Save" hotkey="Enter" />
              <Pill label="Cancel" hotkey="Esc" />
            </box>
          </>
        ) : null}
      </box>
    </box>
  );
}
