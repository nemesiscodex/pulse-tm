// File: src/version.ts
/**
 * Central place for the CLI/app version string.
 *
 * We default to the value provided by the package manager when available
 * (e.g. npm sets `npm_package_version`), and fall back to the current
 * package.json version for global installs or direct execution.
 */
export const PULSE_VERSION: string =
  process.env.npm_package_version ?? '0.1.0';


