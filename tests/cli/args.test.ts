import { describe, it, expect } from 'vitest';
import { parseArgs } from '../../src/cli/args';

describe('parseArgs', () => {
  it('should parse command and arguments', () => {
    const result = parseArgs(['add', 'My Task']);
    expect(result.command).toBe('add');
    expect(result.args).toEqual(['My Task']);
  });

  it('should parse flags', () => {
    const result = parseArgs(['add', 'Task', '--tag', 'feature', '-d', 'Description']);
    expect(result.flags).toEqual({
      tag: 'feature',
      d: 'Description'
    });
    expect(result.tag).toBe('feature');
  });

  it('should handle boolean flags', () => {
    const result = parseArgs(['list', '--all']);
    expect(result.flags).toEqual({
      all: true
    });
  });

  it('should default to help command if no args provided', () => {
    const result = parseArgs([]);
    expect(result.command).toBe('help');
  });
});
