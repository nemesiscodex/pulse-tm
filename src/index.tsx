#!/usr/bin/env bun

import { runDashboard } from './ui/dashboard.tsx';

async function main() {
  await runDashboard();
}

void main();
