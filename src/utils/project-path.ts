// File: src/utils/project-path.ts
import { existsSync } from 'fs';
import { resolve, dirname, join, isAbsolute } from 'path';
import { homedir } from 'os';

/**
 * Walk up the directory tree to find a .git folder
 * @param startDir - Starting directory to search from
 * @returns The directory containing .git, or null if not found
 */
function findGitRoot(startDir: string): string | null {
  let current = resolve(startDir);
  const root = dirname(current); // Stop at filesystem root

  while (current !== root) {
    const gitPath = join(current, '.git');
    if (existsSync(gitPath)) {
      return current;
    }
    current = dirname(current);
  }

  // Check root directory as well
  const gitPath = join(current, '.git');
  if (existsSync(gitPath)) {
    return current;
  }

  return null;
}

/**
 * Get normalized project root path
 * Precedence:
 * 1. workingDirOverride if provided (normalize to absolute)
 * 2. Walk up from startDir (or process.cwd()) to find .git folder
 * 3. Return directory containing .git as project root
 * 4. Fallback to startDir or process.cwd() with warning
 * 
 * @param workingDirOverride - Explicit working directory override
 * @param startDir - Starting directory for search (defaults to process.cwd())
 * @returns Normalized absolute path to project root
 */
export function getProjectPath(workingDirOverride?: string, startDir?: string): string {
  // 1. If override is provided, use it (normalize to absolute)
  if (workingDirOverride) {
    // Expand ~ to home directory
    const expanded = workingDirOverride.startsWith('~')
      ? workingDirOverride.replace('~', homedir())
      : workingDirOverride;
    
    const absolute = isAbsolute(expanded)
      ? resolve(expanded)
      : resolve(process.cwd(), expanded);
    return absolute;
  }

  // 2. Determine starting directory
  const searchStart = startDir ? resolve(startDir) : process.cwd();

  // 3. Walk up to find .git folder
  const gitRoot = findGitRoot(searchStart);
  if (gitRoot) {
    return gitRoot;
  }

  // 4. Fallback to starting directory with warning
  console.warn(
    `Warning: No .git folder found. Using ${searchStart} as project root.`
  );
  console.warn(
    'Consider using --working-dir to specify the correct project location.'
  );
  return searchStart;
}

