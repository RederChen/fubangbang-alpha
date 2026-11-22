"""Workspace-only PostgreSQL runtime. Secrets stay in .local/, never on argv/stdout."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import urllib.request
import uuid
import zipfile

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import psycopg
from psycopg import sql

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / 'backend'
PRIVATE = ROOT / '.local' / 'postgres'
DATA = PRIVATE / 'data'
CACHE = ROOT / '.cache'
BIN = CACHE / 'postgres-17.11-5' / 'pgsql' / 'bin'
CONFIG = PRIVATE / 'credentials.json'
URL = 'https://get.enterprisedb.com/postgresql/postgresql-17.11-5-windows-x64-binaries.zip'
ARCHIVE = CACHE / URL.rsplit('/', 1)[1]
ARCHIVE_SIZE = 381531864
FLAGS = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0


def inside(path):
    path = Path(path).resolve()
    path.relative_to(ROOT)
    return path


def run(args, *, env=None, capture=False, cwd=ROOT):
    if not capture:
        with subprocess.Popen([str(x) for x in args], cwd=cwd, env=env, creationflags=FLAGS,
                              text=True, encoding='utf-8', errors='replace',
                              stdout=subprocess.PIPE, stderr=subprocess.STDOUT) as process:
            for line in process.stdout:
                print(line, end='', flush=True)
            code = process.wait()
        if code:
            raise RuntimeError(f'{Path(str(args[0])).name} failed (exit {code}); no active database was overwritten')
        return ''
    result = subprocess.run([str(x) for x in args], cwd=cwd, env=env, creationflags=FLAGS,
                            text=True, encoding='utf-8', errors='replace',
                            stdout=subprocess.PIPE if capture else None,
                            stderr=subprocess.PIPE if capture else None)
    if result.returncode:
        if capture:
            PRIVATE.mkdir(parents=True, exist_ok=True)
            (PRIVATE / 'last-tool-error.log').write_text((result.stdout or '') + (result.stderr or ''), encoding='utf-8')
        raise RuntimeError(f'{Path(str(args[0])).name} failed (exit {result.returncode}); private logs are under .local/postgres')
    return result.stdout if capture else ''


def config():
    return json.loads(CONFIG.read_text(encoding='utf-8'))


def conninfo(role='admin', database='postgres'):
    cfg = config()
    return dict(host='127.0.0.1', port=cfg['port'], user=cfg[role]['user'],
                password=cfg[role]['password'], dbname=database, connect_timeout=5)


def database_url(role='app', database='campuslink_local'):
    from sqlalchemy.engine import URL as SQLURL
    cfg = config()
    return SQLURL.create('postgresql+psycopg', username=cfg[role]['user'], password=cfg[role]['password'],
                         host='127.0.0.1', port=cfg['port'], database=database).render_as_string(hide_password=False)


def setup():
    if os.name != 'nt':
        raise RuntimeError('This portable setup targets Windows x64; use PostgreSQL or Compose on other systems')
    CACHE.mkdir(exist_ok=True)
    PRIVATE.mkdir(parents=True, exist_ok=True)
    if not ARCHIVE.exists():
        print('Downloading the pinned EDB PostgreSQL 17 ZIP...', flush=True)
        with urllib.request.urlopen(URL, timeout=60) as source, ARCHIVE.open('xb') as target:
            while chunk := source.read(1024 * 1024):
                target.write(chunk)
    if ARCHIVE.stat().st_size != ARCHIVE_SIZE:
        raise RuntimeError('Archive size mismatch; preserving it for inspection, no extraction attempted')
    if not (BIN / 'postgres.exe').is_file():
        with zipfile.ZipFile(ARCHIVE) as archive:
            entries = [e for e in archive.infolist() if e.filename.startswith(('pgsql/bin/', 'pgsql/lib/', 'pgsql/share/'))]
            for entry in entries:
                target = inside(BIN.parent.parent / entry.filename)
                if entry.is_dir():
                    target.mkdir(parents=True, exist_ok=True)
                elif not target.exists():
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with archive.open(entry) as source, target.open('xb') as output:
                        while chunk := source.read(1024 * 1024):
                            output.write(chunk)
        digest = hashlib.file_digest(ARCHIVE.open('rb'), 'sha256').hexdigest()
        (BIN.parent.parent / 'SOURCE.json').write_text(json.dumps({
            'source': URL, 'source_page': 'https://www.enterprisedb.com/download-postgresql-binaries',
            'bytes': ARCHIVE_SIZE, 'sha256_local': digest,
            'checksum_note': 'Locally calculated; not an independent vendor checksum.'
        }, indent=2), encoding='utf-8')
    if not CONFIG.exists():
        cfg = {'port': 55432,
               'admin': {'user': 'campuslink_admin', 'password': secrets.token_urlsafe(36)},
               'app': {'user': 'campuslink_app', 'password': secrets.token_urlsafe(36)},
               'test': {'user': 'campuslink_test', 'password': secrets.token_urlsafe(36)}}
        with CONFIG.open('x', encoding='utf-8') as file:
            json.dump(cfg, file, indent=2)
    cfg = config()
    if not (DATA / 'PG_VERSION').exists():
        if DATA.exists() and any(DATA.iterdir()):
            raise RuntimeError('Incomplete database directory exists; refusing to overwrite it')
        with socket.socket() as probe:
            probe.bind(('127.0.0.1', cfg['port']))
        password_file = PRIVATE / 'bootstrap-password.txt'
        if not password_file.exists():
            password_file.write_text(cfg['admin']['password'] + '\n', encoding='utf-8')
        run([BIN / 'initdb.exe', '-D', DATA, '-U', cfg['admin']['user'], '--encoding=UTF8', '--locale=C',
             '--auth-host=scram-sha-256', '--auth-local=scram-sha-256', f'--pwfile={password_file}'], capture=True)
    start()
    with psycopg.connect(**conninfo(), autocommit=True) as connection:
        for role in ['app', 'test']:
            entry = cfg[role]
            exists = connection.execute('SELECT 1 FROM pg_roles WHERE rolname=%s', [entry['user']]).fetchone()
            if not exists:
                permissions = sql.SQL('CREATEDB') if role == 'test' else sql.SQL('NOCREATEDB')
                connection.execute(sql.SQL('CREATE ROLE {} LOGIN PASSWORD {} NOSUPERUSER {} NOCREATEROLE').format(
                    sql.Identifier(entry['user']), sql.Literal(entry['password']), permissions))
        if not connection.execute('SELECT 1 FROM pg_database WHERE datname=%s', ['campuslink_local']).fetchone():
            connection.execute(sql.SQL('CREATE DATABASE campuslink_local OWNER {} TEMPLATE template0 ENCODING {}').format(
                sql.Identifier(cfg['app']['user']), sql.Literal('UTF8')))
    backend_tool('init')
    print(f'PostgreSQL 17 ready at 127.0.0.1:{cfg["port"]}; application and test roles are separate.')


def start():
    status = subprocess.run([str(BIN / 'pg_ctl.exe'), '-D', str(DATA), 'status'], creationflags=FLAGS,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if status.returncode == 0:
        return
    cfg = config()
    # On Windows, a detached postgres child may retain a captured pipe handle.
    # Use file handles rather than PIPE so readiness doesn't wait for server exit.
    with (PRIVATE / 'control.log').open('a', encoding='utf-8') as log:
        result = subprocess.run([str(BIN / 'pg_ctl.exe'), '-D', str(DATA), '-l', str(PRIVATE / 'server.log'),
                                 '-o', f'-h 127.0.0.1 -p {cfg["port"]}', '-w', '-t', '30', 'start'],
                                stdout=log, stderr=log, creationflags=FLAGS, timeout=40)
    if result.returncode:
        raise RuntimeError('PostgreSQL startup failed; inspect .local/postgres/control.log')


def stop():
    run([BIN / 'pg_ctl.exe', '-D', DATA, '-m', 'fast', '-w', '-t', '30', 'stop'], capture=True)
    print('Workspace PostgreSQL stopped cleanly.')


def create_database(prefix='campuslink_test_', role='test', owner=None):
    name = prefix + uuid.uuid4().hex
    with psycopg.connect(**conninfo(role, 'postgres'), autocommit=True) as connection:
        connection.execute(sql.SQL('CREATE DATABASE {} OWNER {} TEMPLATE template0 ENCODING {}').format(
            sql.Identifier(name), sql.Identifier(config()[owner or role]['user']), sql.Literal('UTF8')))
    return name


def backend_env(database='campuslink_local', role='app'):
    env = dict(os.environ)
    env.update(CAMPUSLINK_DATABASE_URL=database_url(role, database),
               CAMPUSLINK_SEED_DEMO_DATA='false', CAMPUSLINK_DEBUG='false',
               PYTHONIOENCODING='utf-8',
               TEMP=str(CACHE / 'tmp'), TMP=str(CACHE / 'tmp'))
    return env


def backend_tool(action, *args, database='campuslink_local', role='app', env_extra=None):
    env = backend_env(database, role)
    env['CAMPUSLINK_PG_BIN'] = str(BIN)
    if env_extra:
        env.update(env_extra)
    return run([sys.executable, '-m', 'tools.db_admin', action, *args], cwd=BACKEND, env=env)


def validate():
    start()
    database = create_database()
    test_url = database_url('test', database)
    env = backend_env(database, 'test')
    env['CAMPUSLINK_TEST_DATABASE_URL'] = test_url
    print('Running the backend suite on isolated PostgreSQL schemas...', flush=True)
    run([sys.executable, '-m', 'pytest', '--tb=short', '-ra', '--basetemp', CACHE / f'pytest-pg-{uuid.uuid4().hex}'], cwd=BACKEND, env=env)
    e2e_database = create_database()
    uploads = CACHE / f'pg-e2e-{uuid.uuid4().hex}' / 'uploads'
    e2e_env = backend_env(e2e_database, 'test')
    e2e_env.update(E2E_DATABASE_URL=database_url('test', e2e_database), E2E_UPLOAD_DIR=str(uploads))
    print('Running real browser transactions on PostgreSQL...', flush=True)
    run(['node', ROOT / 'scripts/run_e2e.js'], env=e2e_env)
    latest = json.loads((ROOT / '.releases/latest.json').read_text(encoding='utf-8'))
    release = inside(ROOT / '.releases' / latest['directory'] / 'site')
    if not (release / 'index.html').is_file():
        raise RuntimeError('Run npm run build:release before validating the production build')
    production_database = create_database()
    production_env = backend_env(production_database, 'test')
    production_env.update(E2E_DATABASE_URL=database_url('test', production_database),
                          E2E_UPLOAD_DIR=str(CACHE / f'pg-production-{uuid.uuid4().hex}' / 'uploads'),
                          E2E_FRONTEND_DIST=str(release))
    print('Running the compiled production site and API on the same PostgreSQL-backed origin...', flush=True)
    run(['node', ROOT / 'scripts/run_e2e.js'], env=production_env)
    backup = ROOT / '.handoff-backups' / f'postgres-e2e-{uuid.uuid4().hex}'
    backend_tool('backup', '--output', backup, database=e2e_database, role='test',
                 env_extra={'CAMPUSLINK_UPLOAD_DIR': str(uploads)})
    restored = create_database('campuslink_restore_', role='test')
    restored_uploads = CACHE / f'pg-restore-{uuid.uuid4().hex}' / 'uploads'
    backend_tool('restore', '--backup', backup, database=restored, role='test',
                 env_extra={'CAMPUSLINK_UPLOAD_DIR': str(restored_uploads)})
    backend_tool('verify', '--backup', backup, database=restored, role='test',
                 env_extra={'CAMPUSLINK_UPLOAD_DIR': str(restored_uploads)})
    report = {'backend': 'passed', 'browser': 'passed', 'production_browser': 'passed', 'backup_restore': 'passed',
              'backup': str(backup.relative_to(ROOT)), 'restored_database': restored}
    (CACHE / 'postgres-validation.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print('POSTGRESQL VALIDATION PASSED: backend, browser, data and cover backup/restore.')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['setup', 'start', 'stop', 'status', 'validate', 'migrate', 'backup', 'restore', 'upgrade'])
    parser.add_argument('--backup')
    parser.add_argument('--restore')
    args = parser.parse_args()
    if args.action == 'setup': setup()
    elif args.action == 'start': start(); print('Workspace PostgreSQL is ready.')
    elif args.action == 'stop': stop()
    elif args.action == 'status':
        with psycopg.connect(**conninfo()) as connection:
            version = connection.execute('SHOW server_version').fetchone()[0]
        print(f'PostgreSQL {version} at 127.0.0.1:{config()["port"]}')
    elif args.action == 'validate': validate()
    elif args.action == 'migrate':
        start()
        backend_tool('migrate-sqlite', '--source', BACKEND / 'data/campuslink.db', '--backup-root', ROOT / '.handoff-backups')
    elif args.action in ('backup', 'upgrade'):
        start()
        prefix = 'postgres-before-schema' if args.action == 'upgrade' else 'postgres-local'
        target = ROOT / '.handoff-backups' / f'{prefix}-{uuid.uuid4().hex}'
        database = 'campuslink_local'
        extra = {}
        if args.restore:
            suffix = args.restore.removeprefix('campuslink_restore_')
            if not args.restore.startswith('campuslink_restore_') or len(suffix) != 32 or not all(c in '0123456789abcdef' for c in suffix):
                raise RuntimeError('Invalid restore identifier')
            record = json.loads((PRIVATE / 'restores' / f'{args.restore}.json').read_text(encoding='utf-8'))
            if record['database'] != args.restore: raise RuntimeError('Restore metadata mismatch')
            database = args.restore
            extra = {'CAMPUSLINK_UPLOAD_DIR': str(inside(record['uploads']))}
        backend_tool('backup', '--output', target, database=database, env_extra=extra)
        if args.action == 'upgrade':
            backend_tool('init', database=database, env_extra=extra)
            print('Missing tables added after a verified backup. Existing table columns and rows were not rewritten.')
    elif args.action == 'restore':
        start()
        if not args.backup: parser.error('restore requires --backup')
        target = create_database('campuslink_restore_', role='admin', owner='app')
        uploads = ROOT / '.local' / 'restores' / target / 'uploads'
        backend_tool('restore', '--backup', inside(args.backup), database=target, role='app',
                     env_extra={'CAMPUSLINK_UPLOAD_DIR': str(uploads)})
        backend_tool('verify', '--backup', inside(args.backup), database=target, role='app',
                     env_extra={'CAMPUSLINK_UPLOAD_DIR': str(uploads)})
        registry = PRIVATE / 'restores'
        registry.mkdir(exist_ok=True)
        (registry / f'{target}.json').write_text(json.dumps({'database': target, 'uploads': str(uploads)}, indent=2), encoding='utf-8')
        print(f'Restored into new database {target}; the active application database was not changed.')
        print(f'To inspect this restore: npm run start:release -- --restore {target}')


if __name__ == '__main__':
    try: main()
    except Exception as error:
        # Never print DSNs, passwords, SQL parameters, or database row contents.
        print(f'PostgreSQL operation failed ({type(error).__name__}). {str(error) if isinstance(error, RuntimeError) else "Check local configuration and private logs."}', file=sys.stderr)
        sys.exit(1)
