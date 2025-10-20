# Agent Guidelines for Pulse

## Commands
- **Install dependencies**: `bun install`
- **Run application**: `bun run src/index.tsx`
- **Type checking**: `bun tsc --noEmit` (uses TypeScript strict mode)
- **No test framework configured** - add tests if needed

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