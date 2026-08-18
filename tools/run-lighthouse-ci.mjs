import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import lighthouseConfig from '../lighthouserc.cjs';

const reportDir = path.resolve(lighthouseConfig.outputDir);
fs.mkdirSync(reportDir, { recursive: true });

async function waitForServer(url) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 404) return;
    } catch {
      // The static server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function assertionFailure(report, assertion, value) {
  const [, options] = Array.isArray(value) ? value : [value, {}];
  if (assertion.startsWith('categories:')) {
    const category = assertion.slice('categories:'.length);
    const score = report.categories?.[category]?.score;
    return score == null || score < (options.minScore ?? 1)
      ? `${assertion} score ${score ?? 'missing'} is below ${options.minScore ?? 1}`
      : null;
  }

  const score = report.audits?.[assertion]?.score;
  return score !== 1 ? `${assertion} did not pass` : null;
}

const server = spawn(process.execPath, ['tools/run-test-server.mjs'], {
  stdio: 'ignore',
});
const env = {
  ...process.env,
  CHROME_PATH: process.env.CHROME_PATH || chromium.executablePath(),
};
const lighthouseCli = path.resolve('node_modules/lighthouse/cli/index.js');
let failures = 0;

try {
  await waitForServer(lighthouseConfig.urls[0]);

  for (const url of lighthouseConfig.urls) {
    const pathname = new URL(url).pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
    const outputPath = path.join(reportDir, pathname);
    const args = [
      lighthouseCli,
      url,
      '--quiet',
      '--preset=desktop',
      '--output=json',
      '--output=html',
      `--output-path=${outputPath}`,
      '--skip-audits=uses-http2',
    ];
    if (process.env.CI) args.push('--chrome-flags=--no-sandbox --disable-dev-shm-usage');

    const result = spawnSync(process.execPath, args, { env, stdio: 'inherit' });
    if (result.status !== 0) {
      failures += 1;
      continue;
    }

    const report = JSON.parse(fs.readFileSync(`${outputPath}.report.json`, 'utf8'));
    for (const [assertion, value] of Object.entries(lighthouseConfig.assertions)) {
      const [severity] = Array.isArray(value) ? value : [value];
      const failure = assertionFailure(report, assertion, value);
      if (failure && severity === 'error') {
        console.error(`[Lighthouse] ${url}: ${failure}`);
        failures += 1;
      }
    }
  }
} finally {
  server.kill('SIGTERM');
}

process.exit(failures ? 1 : 0);
