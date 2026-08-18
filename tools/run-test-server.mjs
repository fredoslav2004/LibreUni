import { spawn } from 'node:child_process';
import process from 'node:process';

const env = { ...process.env, FORCE_COLOR: '0' };
delete env.NO_COLOR;

const child = spawn(process.execPath, ['tools/serve-test-apps.mjs'], {
  env,
  stdio: 'inherit',
});

child.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on('exit', (code, signal) => {
  process.exitCode = typeof code === 'number' ? code : 1;
  if (signal) process.kill(process.pid, signal);
});
