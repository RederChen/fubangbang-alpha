"""Temporary public demo, using a new database and upload copy on every run."""
from pathlib import Path
import hashlib
import json
import os
import re
import secrets
import socket
import subprocess
import sys
import time
import urllib.request
import uuid

import postgres_local as pg

ROOT = pg.ROOT
FLAGS = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0


def connector():
    folder = ROOT / '.cache/cloudflared'
    folder.mkdir(parents=True, exist_ok=True)
    metadata = folder / 'source.json'
    if not metadata.exists():
        request = urllib.request.Request('https://api.github.com/repos/cloudflare/cloudflared/releases/latest',
                                         headers={'User-Agent': 'CampusLink-local-demo'})
        with urllib.request.urlopen(request, timeout=30) as response:
            release = json.load(response)
        asset = next(a for a in release['assets'] if a['name'] == 'cloudflared-windows-amd64.exe')
        if not re.fullmatch(r'\d{4}\.\d+\.\d+', release['tag_name']):
            raise RuntimeError('Unexpected connector release version')
        filename = release['tag_name'] + '-cloudflared.exe'
        target = folder / filename
        if target.exists():
            raise RuntimeError('Unverified connector file already exists; preserving it')
        with urllib.request.urlopen(asset['browser_download_url'], timeout=60) as source, target.open('xb') as output:
            while chunk := source.read(1024 * 1024):
                output.write(chunk)
        checksum = hashlib.file_digest(target.open('rb'), 'sha256').hexdigest()
        if asset.get('digest') != 'sha256:' + checksum:
            raise RuntimeError('Connector does not match the vendor checksum')
        metadata.write_text(json.dumps(dict(filename=filename, sha256=checksum, vendor_digest_verified=True)), encoding='utf-8')
    saved = json.loads(metadata.read_text(encoding='utf-8'))
    target = pg.inside(folder / saved['filename'])
    if target.parent != folder or not saved.get('vendor_digest_verified'):
        raise RuntimeError('Unverified connector metadata')
    if hashlib.file_digest(target.open('rb'), 'sha256').hexdigest() != saved['sha256']:
        raise RuntimeError('Connector checksum mismatch')
    return target


def main():
    executable = connector()
    pg.start()
    identifier = uuid.uuid4().hex
    state = ROOT / '.local/public-demo' / identifier
    state.mkdir(parents=True, exist_ok=False)
    backup = ROOT / '.handoff-backups' / f'postgres-before-public-demo-{identifier}'
    pg.backend_tool('backup', '--output', backup)
    database = pg.create_database('campuslink_demo_', role='admin', owner='app')
    uploads = state / 'uploads'
    pg.backend_tool('restore', '--backup', backup, database=database,
                    env_extra={'CAMPUSLINK_UPLOAD_DIR': str(uploads)})
    latest = json.loads((ROOT / '.releases/latest.json').read_text(encoding='utf-8'))
    site = pg.inside(ROOT / '.releases' / latest['directory'] / 'site')
    if not (site / 'index.html').is_file():
        raise RuntimeError('Build a release before starting the demo')
    with socket.socket() as server:
        server.bind(('127.0.0.1', 0))
        port = server.getsockname()[1]
    env = pg.backend_env(database)
    env.update(CAMPUSLINK_APP_ENV='production', CAMPUSLINK_DEBUG='false',
               CAMPUSLINK_AUTO_CREATE_TABLES='false', CAMPUSLINK_UPLOAD_DIR=str(uploads),
               CAMPUSLINK_FRONTEND_DIST=str(site), CAMPUSLINK_JWT_SECRET_KEY=secrets.token_urlsafe(48))
    record = dict(database=database, uploads=str(uploads), backup=str(backup), port=port,
                  release=latest['directory'], status='starting', supervisor_pid=os.getpid())
    registry = ROOT / '.local/public-demo/latest.json'

    def save():
        registry.write_text(json.dumps(record, indent=2), encoding='utf-8')

    save()
    web = None
    tunnel = None
    try:
        with (state / 'web.log').open('w', encoding='utf-8') as log:
            web = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'src.main:app', '--host', '127.0.0.1',
                                    '--port', str(port), '--log-level', 'warning'],
                                   cwd=pg.BACKEND, env=env, stdout=log, stderr=log, creationflags=FLAGS)
        record['web_pid'] = web.pid
        for _ in range(100):
            if web.poll() is not None:
                raise RuntimeError('Demo server failed; inspect its private web.log')
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{port}/api/health', timeout=1) as response:
                    if response.status == 200:
                        break
            except OSError:
                time.sleep(0.2)
        else:
            raise RuntimeError('Demo server did not become ready')
        print('Isolated demo copy ready; requesting a temporary public address...', flush=True)
        tunnel = subprocess.Popen([str(executable), 'tunnel', '--no-autoupdate', '--protocol', 'http2',
                                   '--url', f'http://127.0.0.1:{port}', '--metrics', '127.0.0.1:0'],
                                  cwd=state, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                  text=True, encoding='utf-8', errors='replace', creationflags=FLAGS)
        record['tunnel_pid'] = tunnel.pid
        save()
        with (state / 'tunnel.log').open('w', encoding='utf-8') as log:
            for line in tunnel.stdout:
                log.write(line)
                log.flush()
                match = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', line)
                if match:
                    record.update(url=match[0], status='connecting')
                    save()
                    print('PUBLIC_DEMO_URL=' + match[0], flush=True)
                if 'Registered tunnel connection' in line:
                    record['status'] = 'connected'
                    save()
                    print('Public tunnel connected. Ctrl+C stops this demo; local data remains separate.', flush=True)
                if web.poll() is not None:
                    raise RuntimeError('Demo web service exited')
        raise RuntimeError('Temporary tunnel exited; inspect its private tunnel.log')
    finally:
        for child in (tunnel, web):
            if child and child.poll() is None:
                if os.name == 'nt':
                    subprocess.run(['taskkill', '/PID', str(child.pid), '/T', '/F'],
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=FLAGS)
                    continue
                child.terminate()
                try:
                    child.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    child.kill()
        record['status'] = 'stopped'
        save()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Temporary demo stopped. Data copies and backups retained.')
    except Exception as error:
        # Do not emit DSNs, credentials, row contents, or raw database exceptions.
        print('Temporary demo failed: ' + type(error).__name__ + '. Inspect .local/public-demo logs.', file=sys.stderr)
        sys.exit(1)
