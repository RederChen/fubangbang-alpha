# Fubangbang Sprint 1 Source Snapshot

This directory preserves 263 files from the supplied CampusLink handoff. Each copied file was checked against the size and SHA-256 hash in the [initial manifest](../docs/sprints/sprint-1/evidence/initial-manifest.json). The checked source files matched the baseline when this archive was prepared.

## Snapshot contents

The `CampusLink/` directory includes the original frontend, backend, startup scripts, dependency lockfiles, deployment files, reference documents, and the packaged frontend release files present in the handoff. Those original reference documents retain their original language and historical content.

The snapshot excludes installed dependency directories, generated local databases, uploads created by the acceptance checks, private `.env` settings, local caches, and the new `dist/` output. An example environment file is part of the original handoff.

## Reproduce the development environment

The verified environment used Windows, Node.js v24.19.0, npm 11.17.0, and Python 3.13.12. From `source/CampusLink/`, use:

```powershell
npm ci --no-audit --no-fund
npm run setup:backend
npm start
```

The development frontend normally uses `http://127.0.0.1:5173/`. Backend health is available at `http://127.0.0.1:8000/api/health`. Check whether an existing instance already uses these ports before launching another one.

This reference copy has not had dependencies installed inside it. The recorded execution was performed on the source folder supplied for Sprint 1; the matching file hashes connect this snapshot to that baseline.

## Source version tracking

The correspondence between the handoff and a remote Git commit remains unconfirmed. Confirm that correspondence in the active team repository before adding a commit identifier to the sprint essay. No source commit or release number has been invented for this snapshot.
