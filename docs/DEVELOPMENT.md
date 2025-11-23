# Development Guide

[← Back to README](../README.md)


## Requirements

- [Bun](https://bun.sh) **1.0.0+** (runtime and package manager)
- **Node.js**: Not supported (this package uses Bun-specific features)

## Setup

Install dependencies:

```bash
bun install
```

## Running Locally

Run the CLI directly:

```bash
bun run src/index.ts -- help
```

Run the TUI dashboard directly:

```bash
bun run src/index.tsx
```

## Building

Build and link the CLI globally for local testing:

```bash
bun run build
bun link
```

## Testing & Linting

Type-check and lint:

```bash
bun run lint
```

Run tests:

```bash
bun run test
```

## Data Storage

Tasks are stored locally in YAML format:
- Location: `.pulse/` directory in your home directory or project root
- One file per tag: `.pulse/<tag>.yml`
- Base tag stored as: `.pulse/base.yml`
