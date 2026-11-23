# CampusLink Application Source

`CampusLink/` is the working application directory for this Alpha repository. It contains both the Vue frontend and FastAPI backend. The original 263-file handoff was imported at commit `504e8021d1ab32fd5ea210bd75cd40a5ca7d1460`; subsequent changes are recorded by Git.

The [Sprint 1 source manifest](../docs/sprints/sprint-1/evidence/initial-manifest.json) describes that original snapshot. It is not a checksum of the current, edited source. Historical embedded READMEs and `.releases/` output retain their original context.

## First-Time Setup on Windows

Verified tools: Node.js 24.19.0, npm 11.17.0 and Python 3.13.12. Run from the repository root:

```powershell
cd source/CampusLink
npm ci --no-audit --no-fund
npm run setup:backend
npm start
```

This starts the local SQLite development mode. Open `http://127.0.0.1:5173/`; backend health is `http://127.0.0.1:8000/api/health`. Stop an older instance before reusing those ports. Register a local account as needed. Dependencies and private local settings are created on each teammate's computer; they are not supplied through Git.

## Verification

From `source/CampusLink/`:

```powershell
npm run typecheck
npm run build
.\backend\.venv\Scripts\python.exe -m pytest -c backend/pyproject.toml backend/tests
npm run test:titles
npm run test:e2e
```

Alternatively run the backend suite from `backend/` with `.\.venv\Scripts\python.exe -m pytest -ra`. Browser scripts use Windows Edge by default; set `EDGE_PATH` to an installed Chromium-based browser if necessary. They create isolated test databases and upload directories under `.cache/`. The title script stores results in `.cache/sprint2-title-evidence/` by default.

The Sprint 2 SQLite results do not verify PostgreSQL-specific behavior. See [team handoff](../docs/sprints/sprint-2/TEAM-HANDOFF.md) for the branch workflow, known limitations and the remaining two iterations.
