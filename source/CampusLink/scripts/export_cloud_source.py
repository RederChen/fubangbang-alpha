"""Export only version-controlled deploy inputs into a new independent checkout."""
from pathlib import Path
import json
import shutil
import subprocess
import zipfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent


def git(folder, *args):
    return subprocess.check_output(['git', *args], cwd=folder, encoding='utf-8').strip()


def main():
    for folder in [ROOT, ROOT / 'backend']:
        if git(folder, 'status', '--porcelain'):
            raise RuntimeError('Commit source repositories before exporting')
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    destination = ROOT / '.integration' / ('cloud-source-' + stamp)
    destination.mkdir(parents=True, exist_ok=False)
    root_files = {'package.json', 'package-lock.json', 'index.html', 'vite.config.ts',
                  'tsconfig.json', 'tsconfig.node.json', 'render.yaml', '.dockerignore'}
    for repository, prefix in [(ROOT, ''), (ROOT / 'backend', 'backend/')]:
        for name in git(repository, 'ls-files', '-z').split('\0'):
            if not name:
                continue
            if prefix:
                keep = name.startswith(('src/', 'tools/', 'tests/')) or name in {'requirements.txt', 'requirements.lock.txt'}
            else:
                keep = name in root_files or name.startswith(('src/', 'public/', 'deploy/'))
            if not keep:
                continue
            source = repository / name
            parts = Path(name).parts
            if source.is_symlink() or any(part in {'.git', '.venv', '__pycache__', 'data'} for part in parts) or source.name.startswith('.env'):
                raise RuntimeError('Unexpected private or linked source input')
            target = destination / prefix / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
    (destination / 'README.md').write_text((ROOT / 'deploy/README.md').read_text(encoding='utf-8'), encoding='utf-8')
    (destination / '.gitignore').write_text('.env\n.env.*\n!.env.example\nnode_modules/\n.venv/\n__pycache__/\n*.py[cod]\n.cache/\n.local/\nbackend/data/\ndist/\n', encoding='utf-8')
    package = json.loads((destination / 'package.json').read_text())
    package['scripts'] = {key: value for key, value in package['scripts'].items() if key in {'dev', 'build', 'preview', 'typecheck'}}
    (destination / 'package.json').write_text(json.dumps(package, indent=2) + '\n', encoding='utf-8')
    versions = dict(frontend_commit=git(ROOT, 'rev-parse', 'HEAD'), backend_commit=git(ROOT / 'backend', 'rev-parse', 'HEAD'),
                    frontend_upstream='https://github.com/Aurowisp/Frontend', backend_upstream='https://github.com/Aurowisp/Backend')
    (destination / 'UPSTREAM.json').write_text(json.dumps(versions, indent=2) + '\n', encoding='utf-8')
    archive = ROOT / '.releases' / ('CampusLink-cloud-source-' + stamp + '.zip')
    with zipfile.ZipFile(archive, 'x', compression=zipfile.ZIP_DEFLATED) as output:
        for item in destination.rglob('*'):
            if item.is_file():
                output.write(item, item.relative_to(destination).as_posix())
    record = {'directory': str(destination.relative_to(ROOT)), 'archive': str(archive.relative_to(ROOT)), **versions}
    (ROOT / '.integration/cloud-source-latest.json').write_text(json.dumps(record, indent=2), encoding='utf-8')
    print(json.dumps(record))


if __name__ == '__main__':
    main()
