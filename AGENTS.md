# Agent Guidelines for Pulse

## Examples for TUI
As examples for the TUI, included in the project folder `./opentui/` is the opentui library with examples, `./opencode/` a cli made using opentui with best practices, for reference only, never update.

## Commands
- **Install dependencies**: `bun install`
- **Run application**: `bun run src/index.tsx`
- **Type checking**: `bun tsc --noEmit` (uses TypeScript strict mode)
- **Tests**: `bun run test` (only runs project tests; vendored suites are excluded)
- **Subtasks**: Enter to focus. Subtask hotkeys: `u` add, `i` edit, `c` cycle status, `Del/Backspace` delete, `Shift+↑↓` reorder.

## Code Style Guidelines
- **Framework**: React with OpenTUI components
- **TypeScript**: Strict mode enabled with ESNext target
- **Imports**: Use verbatim module syntax, import React components from `@opentui/react`
- **Components**: Use lowercase HTML-like elements (e.g., `<box>`, `<text>`)
- **JSX**: React JSX with `@opentui/react` as import source
- **File structure**: Single entry point at `src/index.tsx`
- **Dependencies**: Bun runtime, React 19, OpenTUI core/react libraries

## Key TypeScript Settings
- Strict mode enabled with noUncheckedIndexedAccess
- Bundler module resolution
- Allow importing TS extensions
- No unused locals/parameters warnings disabled
