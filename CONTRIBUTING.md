## Contributing to Pulse

Thank you for considering contributing to Pulse! This document explains how to get a development environment running, the expectations for changes, and how to run checks locally.

### Prerequisites

- [Bun](https://bun.sh) **1.0.0 or higher** (runtime, package manager, and test runner)
- A recent version of macOS, Linux, or WSL is recommended

Pulse is designed as a **Bun-first** project. Node.js is not supported because the code uses Bun-specific features.

### Project layout

- `src/cli` – CLI entrypoints, argument parsing, and subcommand handlers
- `src/ui` – TUI dashboard built with `@opentui/react`
- `src/core` – core task manager logic (pure TypeScript)
- `src/mcp` – Model Context Protocol server for AI integration
- `src/storage` – YAML-based on-disk storage
- `src/types` – shared TypeScript types and interfaces
- `tests` – Vitest test suites for CLI and core logic

### Getting started

Clone the repository and install dependencies:

```bash
bun install
```

Run the CLI during development:

```bash
# General help
bun run src/index.ts -- help

# Example: list tasks
bun run src/index.ts -- list
```

Run the TUI dashboard:

```bash
bun run src/index.tsx
```

Build and link the CLI globally for local testing:

```bash
bun run build
bun link
```

Run the MCP server:

```bash
# Using bunx
bunx pulse-tm mcp
```

This starts a Model Context Protocol server that can be wired into compatible AI tools.

### Linting and tests

Before opening a pull request, please ensure all checks pass:

```bash
# TypeScript strict type-check (no emit) and  ESLint (project style + TypeScript rules)
bun run lint

# Unit tests
bun run test
```

If you touch TypeScript files, you should at least run `bun run lint` and `bun run test` locally.

### Coding style and guidelines

- **Language & runtime**: TypeScript targeting **Bun** (ESNext)
- **TUI components**: Use OpenTUI primitives from `@opentui/react`:
  - Use lowercase JSX tags like `<box>`, `<text>` for layout
  - Import React bindings from `@opentui/react`
- **TypeScript**:
  - Strict mode is enabled; keep it that way
  - Prefer explicit types on public functions and exported symbols
  - Avoid loosening compiler options as a fix
- **Comments**:
  - Focus comments on **why** code exists or tradeoffs made
  - Keep comments concise and avoid duplicating obvious behavior

### Making changes

- **Small, focused PRs** are easier to review and merge.
- If you’re changing behavior, prefer adding or updating tests in `tests/` to cover the new behavior.
- Avoid introducing breaking CLI changes without discussion (e.g., removing commands or flags).
- For changes that impact how tasks are stored on disk, please document the migration path or compatibility story.

### Opening a pull request

1. Fork the repository and create a feature branch.
2. Make your changes and ensure:
   - `bun run lint`
   - `bun run test`
   all succeed.
3. Open a PR with:
   - A short summary of the change
   - Any relevant screenshots (for TUI changes) or examples
   - Notes about compatibility or migration (if applicable)

### Reporting bugs and requesting features

- Use the GitHub Issues page to file:
  - Bug reports (include reproduction steps and environment details)
  - Feature requests (describe the use case and what you’re trying to solve)

Thank you again for contributing to Pulse!


