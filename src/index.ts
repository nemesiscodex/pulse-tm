#!/usr/bin/env bun

import { parseArgs } from './cli/args';
import { handleCommand } from './cli/commands';

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    await handleCommand(args);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();