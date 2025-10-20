import type { CommandArgs } from '../types';

export function parseArgs(argv: string[]): CommandArgs {
  if (argv.length === 0) {
    return { command: 'help', args: [], flags: {} };
  }

  const command = argv[0]!;
  
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};
  
  let i = 1;
  
  while (i < argv.length) {
    const arg = argv[i];
    if (!arg) break;
    
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
      args.push(arg);
      i += 1;
    }
  }

  return { command, args, flags };
}