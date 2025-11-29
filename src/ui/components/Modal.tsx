import { colors } from '../theme';
import { Pill } from './Pill';

export type ModalState =
  | { type: 'editTitle'; taskId: number; tag: string; value: string }
  | { type: 'editDescription'; taskId: number; tag: string; value: string }
  | { type: 'confirmDelete'; taskId: number; tag: string }
  | { type: 'confirmDeleteSubtask'; taskId: number; tag: string; subtaskId: number }
  | { type: 'confirmComplete'; taskId: number; tag: string; pendingSubtasks: number; nextStatus: 'DONE' }
  | { type: 'subtaskEdit'; taskId: number; tag: string; subtaskId: number; value: string }
  | { type: 'subtaskNew'; taskId: number; tag: string; value: string }
  | { type: 'newTag'; value: string }
  | { type: 'newTagDesc'; tagName: string; value: string }
  | { type: 'help' }
  | null;

interface ModalProps {
  modal: Exclude<ModalState, null>;
  onInput: (v: string) => void;
  onSubmit: (v: string) => void;
}

type InputModal = Extract<
  ModalState,
  { type: 'newTag' | 'newTagDesc' | 'subtaskNew' | 'subtaskEdit' | 'editTitle' | 'editDescription' }
>;

function getInputModalTitle(modal: InputModal): string {
  switch (modal.type) {
    case 'newTag':
      return 'New Tag - Name';
    case 'newTagDesc':
      return 'New Tag - Description';
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
    case 'newTag':
    case 'newTagDesc':
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
                      <text fg={colors.muted}>  ? / h      Show this help</text>
                      <text fg={colors.muted}>  q / Ctrl+C Quit</text>
                      <text fg={colors.muted}>  r          Refresh</text>

                      <text fg={colors.text}><strong>Navigation</strong></text>
                      <text fg={colors.muted}>  Arrows     Navigate tasks/columns</text>
                      <text fg={colors.muted}>  Enter      Focus subtasks</text>
                      <text fg={colors.muted}>  Esc        Back / Close modal</text>
                      <text fg={colors.muted}>  b          Toggle Sidebar</text>
                      <text fg={colors.muted}>  [ / ]      Cycle Tags</text>

                      <text fg={colors.text}><strong>Tasks</strong></text>
                      <text fg={colors.muted}>  n          New Task</text>
                      <text fg={colors.muted}>  e          Edit Title</text>
                      <text fg={colors.muted}>  d          Edit Description</text>
                      <text fg={colors.muted}>  s          Cycle Status</text>
                      <text fg={colors.muted}>  x          Delete Task</text>
                      <text fg={colors.muted}>  a          Toggle Done Tasks</text>

                      <text fg={colors.text}><strong>Subtasks</strong></text>
                      <text fg={colors.muted}>  u          New Subtask</text>
                      <text fg={colors.muted}>  i          Edit Subtask</text>
                      <text fg={colors.muted}>  c          Cycle Subtask Status</text>
                      <text fg={colors.muted}>  Shift+Up/Dn Move Subtask</text>
                    </box>
                  </box>
                </scrollbox>
                <box style={{ marginTop: 1, flexShrink: 0 }}>
                <Pill label="Close" hotkey="Esc" />
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
                modal.type === 'newTag'
                  ? 'Enter tag name...'
                  : modal.type === 'newTagDesc'
                    ? 'Enter tag description (optional)...'
                    : modal.type === 'subtaskNew'
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
