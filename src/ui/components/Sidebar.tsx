import { colors } from '../theme';
import { Pill } from './Pill';

interface SidebarProps {
  width: number;
  tags: string[];
  activeTag: string;
  focused: boolean;
}

export function Sidebar({ width, tags, activeTag, focused }: SidebarProps) {
  const sidebarWidth = width < 100 ? 24 : width < 140 ? 32 : 40;
  return (
    <box style={{
      width: sidebarWidth,
      flexShrink: 0,
      flexDirection: 'column',
      padding: 1,
      gap: 1,
      backgroundColor: colors.panel,
      border: true,
      borderColor: focused ? colors.accent : colors.panelAlt
    }}>
      <text fg={colors.accent}><strong>Pulse{focused ? ' ←' : ''}</strong></text>
      <text fg={colors.muted}>{'Tags'}</text>
      <scrollbox style={{ flexGrow: 1, flexDirection: 'row', gap: 0 }}>
        <box flexDirection="column">
          {tags.map(t => (
            <text
              key={t}
              fg={t === activeTag ? '#000000' : colors.text}
              bg={t === activeTag ? (focused ? colors.accent : colors.warn) : colors.panel}
            >
              {' '}{t.length > (width > 140 ? 44 : 24) ? t.slice(0, (width > 140 ? 44 : 24)) + '...' : t}{' '}
            </text>
          ))}
        </box>
      </scrollbox>
      <box style={{ marginTop: 'auto', flexDirection: 'column', gap: 0 }}>
        <Pill label="Tag" hotkey="[ / ]" />
        <Pill label="Sidebar" hotkey="b" />
      </box>
    </box>
  );
}
