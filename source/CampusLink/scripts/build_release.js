import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { root, backend, run, finished } from './local_runtime.js';

const name = 'release-' + new Date().toISOString().replace(/[-:.]/g, '');
const folder = path.join(root, '.releases', name);
await mkdir(folder, { recursive: true });
await finished(run(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', path.join(folder, 'site')], {
  env: { ...process.env, VITE_API_BASE_URL: '/api' },
}));
function git(cwd, ...args) {
  try {
    const options = { cwd, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] };
    const top = execFileSync('git', ['rev-parse', '--show-toplevel'], options).trim();
    if (path.resolve(top).toLowerCase() !== path.resolve(cwd).toLowerCase()) return null;
    return execFileSync('git', args, options).trim();
  } catch { return null; }
}
const files = {};
async function hashFiles(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, item.name);
    if (item.isDirectory()) await hashFiles(target);
    else if (item.isFile()) files[path.relative(folder, target).replaceAll('\\', '/')] = createHash('sha256').update(await readFile(target)).digest('hex');
  }
}
await hashFiles(path.join(folder, 'site'));
const frontendCommit = git(root, 'rev-parse', 'HEAD'), backendCommit = git(backend, 'rev-parse', 'HEAD');
const manifest = {
  created_at_utc: new Date().toISOString(), frontend_commit: frontendCommit || 'unversioned',
  backend_commit: backendCommit || 'unversioned',
  source_dirty: !frontendCommit || !backendCommit || Boolean(git(root, 'status', '--porcelain') || git(backend, 'status', '--porcelain')),
  files,
};
await writeFile(path.join(folder, 'manifest.json'), JSON.stringify(manifest, null, 2));
await writeFile(path.join(root, '.releases/latest.json'), JSON.stringify({ directory: name }, null, 2));
console.log(`Release built: .releases/${name}/site`);
