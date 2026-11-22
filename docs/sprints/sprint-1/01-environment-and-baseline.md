# Fubangbang Sprint 1 Environment Reproduction and Source Baseline

**Record date:** November 21, 2026  
**Sprint period:** November 21–22, 2026  
**Scope:** Local source baseline, dependency installation, application startup, and database connectivity

The existing Fubangbang handoff version was successfully started on a Windows development machine. The frontend returned HTTP 200, and the backend health endpoint confirmed that the database was connected. This establishes the local environment for the next step of manual acceptance testing.

## Source baseline

The starting point was the locally supplied CampusLink source and compiled website handoff folder. Its project root contains `package.json`, `package-lock.json`, `src/`, `backend/`, and `scripts/`. The frontend uses Vue, TypeScript, and Vite; the backend uses FastAPI and SQLAlchemy. They communicate through HTTP API requests.

This baseline refers to the local handoff snapshot. Its corresponding remote repository commit has not yet been confirmed, so no Git commit identifier or new release number is assigned here.

Before dependency installation, a manifest recorded the relative paths, sizes, and SHA-256 hashes of 263 original files. A subsequent comparison found no changes to those files. Installation and execution added dependencies, local configuration, build output, caches, and local runtime data. Application source files, dependency declarations, and lockfiles retained their original contents.

## Development environment

| Component | Environment used |
| --- | --- |
| Operating system | Windows |
| Node.js | v24.19.0 |
| npm | 11.17.0 |
| Python | 3.13.12 |
| Local database | SQLite |
| Frontend dependency reference | `package-lock.json` |
| Backend dependency reference | `backend/requirements.lock.txt` |

## Installation and startup

The following commands were used from the project root to install dependencies and start the application:

```powershell
npm ci --no-audit --no-fund
npm run setup:backend
npm start
```

Frontend dependencies were installed successfully. The backend setup script created a project-specific Python virtual environment and installed the packages specified in the backend lockfile. The first startup generated private local backend settings. Secrets are excluded from these records and their accompanying evidence.

For this verification, the same startup script was launched as a background process. Before starting another instance, check whether ports 5173 and 8000 are already in use.

## Startup verification

| Check | Local address | Observed result |
| --- | --- | --- |
| Frontend response | `http://127.0.0.1:5173/` | HTTP 200 |
| Backend health and database connection | `http://127.0.0.1:8000/api/health` | HTTP 200; `code: 200`, `status: ok`, `database: connected` |

The backend API documentation is available at `http://127.0.0.1:8000/docs` for subsequent interface checks. Individual endpoints were not manually reviewed through that documentation during this step.

These loopback addresses refer to the development machine. Public deployment and access from other devices remain outside this verification.

## Evidence and completion status

- [Startup output](evidence/startup.txt)
- [Backend process output](evidence/startup-stderr.txt)
- [Initial file manifest](evidence/initial-manifest.json)
- [Manifest comparison](evidence/manifest-verification.json)

The process output includes normal server startup messages written to stderr. Its presence does not indicate a startup failure. The accompanying evidence copies replace personal machine paths with `<project-root>`; the original local logs are retained separately.

**Step 1 is complete for this machine.** Independent setup on another machine, confirmation of the remote source commit, and deployment verification remain pending. The next step is manual acceptance testing with dedicated test accounts.
