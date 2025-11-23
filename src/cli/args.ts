import type { CommandArgs } from '../types';

export function parseArgs(argv: string[]): CommandArgs {
  if (argv.length === 0) {
    return { command: 'help', args: [], flags: {} };
  }

  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};
  
  let i = 0;
  let command: string | undefined;
  
  // First pass: extract global flags (--working-dir, -w) and find command
  while (i < argv.length) {
    const arg = argv[i];
    if (!arg) break;
    
    // Check for --working-dir or -w flag (global flag)
    if (arg === '--working-dir' || arg === '-w') {
      if (argv[i + 1] && !argv[i + 1]!.startsWith('-')) {
        flags.workingDir = argv[i + 1]!;
        i += 2;
        continue;
      }
      // If -w is used without a value, treat it as invalid but continue
      // (will fall through to auto-detection)
    }
    
    // If it's a flag, parse it
    if (arg.startsWith('--')) {
      const flag = arg.slice(2);
      if (argv[i + 1] && !argv[i + 1]!.startsWith('-')) {
        flags[flag] = argv[i + 1]!;
        i += 2;
      } else {
        flags[flag] = true;
        i += 1;
      }
    } else if (arg.startsWith('-')) {
      const flag = arg.slice(1);
      if (argv[i + 1] && !argv[i + 1]!.startsWith('-')) {
        flags[flag] = argv[i + 1]!;
        i += 2;
      } else {
        flags[flag] = true;
        i += 1;
      }
    } else {
      // First non-flag argument is the command
      if (!command) {
        command = arg;
        i += 1;
      } else {
        args.push(arg);
        i += 1;
      }
    }
  }

  // If no command found, default to help
  if (!command) {
    command = 'help';
  }

  const tag = flags.tag as string | undefined;
  const workingDir = (flags.workingDir || flags.w) as string | undefined;
  
  return { command, args, flags, tag, workingDir };
}