// File: src/cli/commands/version.ts
import { PULSE_VERSION } from '../../version';

/**
 * Print the current Pulse version.
 *
 * This uses the central `PULSE_VERSION` constant, which in turn prefers the
 * package manager–provided version (npm_package_version) when available.
 */
export async function handleVersion(): Promise<void> {
  console.log(`Pulse version: ${PULSE_VERSION}`);
}


