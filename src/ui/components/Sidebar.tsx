import { colors } from '../theme';
import { Pill } from './Pill';
import { SHORTCUTS } from '../shortcuts';

interface SidebarProps {
  width: number;
  tags: string[];
  activeTag: string;
  focused: boolean;
  fullWidth?: boolean;
}

export function Sidebar({ width, tags, activeTag, focused, fullWidth }: SidebarProps) {
  const sidebarWidth = width < 100 ? 24 : width < 140 ? 32 : 40;
  
  const tagNav = SHORTCUTS.NAVIGATION.find(s => s.action === 'cycle_tags');
  const sidebarToggle = SHORTCUTS.NAVIGATION.find(s => s.action === 'toggle_sidebar');

  return (
    <box style={{
      width: fullWidth ? '100%' : sidebarWidth,
      height: '100%',
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
        {tagNav && <Pill label={tagNav.label} hotkey={tagNav.key} />}
        {sidebarToggle && <Pill label={sidebarToggle.label} hotkey={sidebarToggle.key} />}
      </box>
    </box>
  );
}
