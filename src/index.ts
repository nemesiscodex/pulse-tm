#!/usr/bin/env bun

import { parseArgs } from './cli/args';
import { handleCommand } from './cli/commands';
import { getProjectPath } from './utils/project-path';

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    // Resolve working directory: use override if provided, otherwise detect from cwd
    const resolvedWorkingDir = getProjectPath(args.workingDir);
    // Update args with resolved path
    args.workingDir = resolvedWorkingDir;
    await handleCommand(args);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();