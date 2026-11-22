import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const backend = path.join(root, 'backend');
export const python = path.join(backend, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');

export async function ensureLocalSettings(workspace = root) {
  await mkdir(path.join(workspace, '.cache/tmp'), { recursive: true });
  try {
    await writeFile(path.join(workspace, 'backend/.env'), `CAMPUSLINK_JWT_SECRET_KEY=${randomBytes(48).toString('base64url')}\nCAMPUSLINK_DEBUG=false\n`, { flag: 'wx' });
    return true;
  } catch (error) { if (error.code !== 'EEXIST') throw error; return false; }
}

export function run(command, args, options = {}) {
  const child = spawn(command, args, { cwd: root, windowsHide: true, stdio: 'inherit', ...options });
  child.on('error', error => console.error(`Unable to start process: ${error.message}`));
  return child;
}

export function finished(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`Process exited with ${signal || code}`)));
  });
}

export async function stop(child) {
  if (!child?.pid || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    await new Promise(resolve => {
      const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
      killer.once('error', resolve); killer.once('exit', resolve);
    });
  } else child.kill('SIGTERM');
}

export async function waitFor(url, child, timeout = 20000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (child.exitCode !== null) throw new Error(`Server exited before becoming ready: ${url}`);
    try { const response = await fetch(url, { signal: AbortSignal.timeout(1000) }); if (response.ok) return; } catch { /* starting */ }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Server startup timed out: ${url}`);
}
