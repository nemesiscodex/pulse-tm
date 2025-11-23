import type { CommandArgs } from '../../types';
import { runDashboard } from '../../ui/dashboard';

export async function handleUi(args: CommandArgs): Promise<void> {
  await runDashboard(args.workingDir);
}
