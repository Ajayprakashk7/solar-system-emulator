import { cp, mkdir, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const standaloneRoot = path.join(projectRoot, '.next', 'standalone');
const standaloneNext = path.join(standaloneRoot, '.next');

const copyRuntimeAssets = async () => {
  await mkdir(standaloneNext, { recursive: true });

  const publicTarget = path.join(standaloneRoot, 'public');
  const staticTarget = path.join(standaloneNext, 'static');

  await Promise.all([
    rm(publicTarget, { recursive: true, force: true }),
    rm(staticTarget, { recursive: true, force: true }),
  ]);

  await Promise.all([
    cp(path.join(projectRoot, 'public'), publicTarget, { recursive: true }),
    cp(path.join(projectRoot, '.next', 'static'), staticTarget, { recursive: true }),
  ]);
};

await copyRuntimeAssets();

const child = spawn(process.execPath, ['server.js'], {
  cwd: standaloneRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    HOSTNAME: process.env.HOSTNAME || '0.0.0.0',
    PORT: process.env.PORT || '3000',
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
  },
});

const forwardSignal = (signal) => {
  if (!child.killed) child.kill(signal);
};

process.once('SIGINT', () => forwardSignal('SIGINT'));
process.once('SIGTERM', () => forwardSignal('SIGTERM'));

child.once('error', (error) => {
  console.error('Failed to start standalone server:', error);
  process.exitCode = 1;
});

child.once('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = code ?? 1;
});
