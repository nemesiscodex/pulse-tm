import { colors } from '../theme';
import { Pill } from './Pill';

export type ModalState =
  | { type: 'editTitle'; taskId: number; tag: string; value: string }
  | { type: 'editDescription'; taskId: number; tag: string; value: string }
  | { type: 'confirmDelete'; taskId: number; tag: string }
  | { type: 'confirmComplete'; taskId: number; tag: string; pendingSubtasks: number; nextStatus: 'DONE' }
  | { type: 'subtaskEdit'; taskId: number; tag: string; subtaskId: number; value: string }
  | { type: 'subtaskNew'; taskId: number; tag: string; value: string }
  | { type: 'newTag'; value: string }
  | null;

interface ModalProps {
  modal: Exclude<ModalState, null>;
  onInput: (v: string) => void;
  onSubmit: (v: string) => void;
}

export function Modal({ modal, onInput, onSubmit }: ModalProps) {
  return (
    <box style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <box style={{
        width: 60, padding: 1, gap: 1, flexDirection: 'column', backgroundColor: colors.panel,
        borderStyle: 'double', border: true, borderColor: colors.accent
      }}>
        {modal.type === 'confirmDelete' ? (
          <text fg={colors.danger}>Delete task #{modal.taskId}? (Y/N)</text>
        ) : modal.type === 'confirmComplete' ? (
          <text fg={colors.warn}>
            Mark #{modal.taskId} as done and close {modal.pendingSubtasks} open subtasks? (Y/N)
          </text>
        ) : (
          <>
            <text fg={colors.text}>
              <strong>
                {modal.type === 'newTag'
                  ? 'New Tag'
                  : modal.type === 'subtaskNew'
                    ? 'New Subtask'
                    : modal.type === 'subtaskEdit'
                      ? 'Edit Subtask'
                      : (modal as any).taskId === -1
                        ? 'New Task - ' + (modal.type === 'editTitle' ? 'Title' : 'Description')
                        : 'Edit - ' + (modal.type === 'editTitle' ? 'Title' : 'Description')}
              </strong>
            </text>
            <input
              style={{ width: '100%', padding: 1 }}
              value={(modal as any).value || ''}
              focused
              placeholder={
                modal.type === 'newTag'
                  ? 'Enter tag name...'
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
        )}
      </box>
    </box>
  );
}
