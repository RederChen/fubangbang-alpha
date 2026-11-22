"""Create a source + compiled-site handoff. No databases, secrets or caches."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parent.parent


def git(folder, *args):
    return subprocess.check_output(['git', *args], cwd=folder).decode('utf-8')


def main():
    for folder in [ROOT, ROOT / 'backend']:
        if Path(git(folder, 'rev-parse', '--show-toplevel').strip()).resolve() != folder.resolve():
            raise RuntimeError('Packaging requires independent Git checkouts, not an inherited parent repository')
        if git(folder, 'status', '--porcelain').strip():
            raise RuntimeError('Commit both repositories before packaging a release')
    latest = json.loads((ROOT / '.releases/latest.json').read_text(encoding='utf-8'))
    release = (ROOT / '.releases' / latest['directory']).resolve()
    release.relative_to(ROOT / '.releases')
    manifest = json.loads((release / 'manifest.json').read_text(encoding='utf-8'))
    if manifest['source_dirty']:
        raise RuntimeError('Rebuild the release from clean committed sources before packaging')
    if manifest['frontend_commit'] != git(ROOT, 'rev-parse', 'HEAD').strip() or manifest['backend_commit'] != git(ROOT / 'backend', 'rev-parse', 'HEAD').strip():
        raise RuntimeError('Release commits do not match the current source')
    output = release.parent / f'CampusLink-{latest["directory"]}.zip'
    with zipfile.ZipFile(output, 'x', compression=zipfile.ZIP_DEFLATED) as archive:
        for repository, prefix in [(ROOT, ''), (ROOT / 'backend', 'backend/')]:
            for name in git(repository, 'ls-files', '-z').split('\0'):
                if not name: continue
                if Path(name).name.startswith('.env') and Path(name).name != '.env.example':
                    raise RuntimeError('Refusing to package a tracked private environment file')
                source = repository / name
                if source.is_symlink(): raise RuntimeError('Refusing to package a source symlink')
                archive.write(source, prefix + name)
        archive.write(ROOT / '.releases/latest.json', '.releases/latest.json')
        for file in release.rglob('*'):
            if file.is_file(): archive.write(file, file.relative_to(ROOT).as_posix())
    with output.open('rb') as source: checksum = hashlib.file_digest(source, 'sha256').hexdigest()
    output.with_suffix('.zip.sha256').write_text(f'{checksum}  {output.name}\n', encoding='utf-8')
    print(f'Delivery ZIP created: .releases/{output.name}')


if __name__ == '__main__':
    try: main()
    except RuntimeError as error:
        print(str(error), file=sys.stderr); sys.exit(1)
