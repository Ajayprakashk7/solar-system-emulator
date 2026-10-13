import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HOST = '127.0.0.1';
const PORT = 3210;
const BASE_URL = `http://${HOST}:${PORT}`;
const nextCli = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url));

const server = spawn(process.execPath, [nextCli, 'start', '-H', HOST, '-p', String(PORT)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
});

let serverOutput = '';
server.stdout.on('data', (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  serverOutput += chunk.toString();
});

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const waitForServer = async () => {
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Production server exited early (${server.exitCode}).\n${serverOutput}`);
    }

    try {
      const response = await fetch(BASE_URL, { redirect: 'manual' });
      if (response.ok) return response;
    } catch {
      // Server is still starting.
    }

    await sleep(300);
  }

  throw new Error(`Production server did not become ready in time.\n${serverOutput}`);
};

try {
  const home = await waitForServer();
  assert.equal(home.status, 200, 'Home page should return HTTP 200');
  assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(home.headers.get('x-frame-options'), 'DENY');
  assert.equal(home.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.match(home.headers.get('permissions-policy') || '', /camera=\(\)/);

  const health = await fetch(`${BASE_URL}/api/health`, { cache: 'no-store' });
  assert.equal(health.status, 200, 'Health endpoint should return HTTP 200');
  assert.match(health.headers.get('cache-control') || '', /no-store/);
  const healthPayload = await health.json();
  assert.equal(healthPayload.status, 'ok');
  assert.equal(healthPayload.service, 'solar-system-emulator');
  assert.equal(typeof healthPayload.uptimeSeconds, 'number');

  // These validation checks intentionally never contact NASA; they prove the
  // production server boots and API boundaries reject invalid input correctly.
  const invalidPlanet = await fetch(`${BASE_URL}/api/nasa/planet/pluto`);
  assert.equal(invalidPlanet.status, 400, 'Unsupported planet should return HTTP 400');

  const futureApod = await fetch(`${BASE_URL}/api/nasa/apod?date=2999-01-01`);
  assert.equal(futureApod.status, 400, 'Future APOD date should return HTTP 400');

  const oversizedNeoRange = await fetch(
    `${BASE_URL}/api/nasa/neo?start_date=2026-01-01&end_date=2026-01-10`
  );
  assert.equal(oversizedNeoRange.status, 400, 'Oversized NEO date range should return HTTP 400');

  console.log('Production smoke checks passed.');
} finally {
  server.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => server.once('exit', resolve)),
    sleep(3_000),
  ]);
  if (server.exitCode === null) server.kill('SIGKILL');
}
