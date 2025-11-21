import { colors } from '../theme';

export function Pill({ label, hotkey, fg = colors.text, bg = colors.panelAlt }: { label: string; hotkey?: string; fg?: string; bg?: string }) {
  return (
    <box style={{ flexDirection: 'row', gap: 0, alignItems: 'center' }}>
      {hotkey ? (
        <text fg="#000000" bg={colors.accent}>
          &nbsp;{hotkey}&nbsp;
        </text>
      ) : null}
      <text fg={fg} bg={bg}>
        {' '}{label}{' '}
      </text>
    </box>
  );
}
