# Fubangbang Application Source

`CampusLink/` contains the Vue 3/TypeScript frontend, FastAPI backend, startup scripts and tests. Both application parts are maintained in this repository. The initial 263-file handoff was imported at commit `504e8021d1ab32fd5ea210bd75cd40a5ca7d1460`; The current snapshot includes the subsequent Sprint 2 title changes and Sprint 3 cover extraction.

## Reproduce the Development Environment

Verified Windows tools: Node.js 24.19.0, npm 11.17.0 and Python 3.13.12. From the repository root:

```powershell
cd source/CampusLink
npm ci --no-audit --no-fund
npm run setup:backend
npm start
```

The frontend uses `http://127.0.0.1:5173/`; backend health is `http://127.0.0.1:8000/api/health`. The local development entry point uses SQLite. Register a local account as needed. Installed dependencies, private settings, local databases and test caches stay on each developer's computer.

## Checks

From `source/CampusLink/`, run `npm run typecheck`, `npm run build`, `npm run test:titles` and `npm run test:e2e`. From `source/CampusLink/backend/`, run `.\.venv\Scripts\python.exe -m pytest -ra`. Browser scripts use Windows Edge by default; `EDGE_PATH` can select an installed compatible browser.

[Sprint 3 results](../docs/sprints/sprint-3/README.md) record the tested version, logs and runtime images. The original source manifest and embedded handoff documentation refer to the initial snapshot; old packaged releases retain their original behavior. Rebuild the current source for the current application.
