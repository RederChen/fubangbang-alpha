# Fubangbang Alpha Sprint Archive

Campus second-hand trading and information-sharing platform for EE308FZ Software Engineering.

## Start Here

1. [Application source and startup](source/README.md).
2. [Sprint 1 verification and issue records](docs/sprints/sprint-1/README.md).
3. [Sprint 2 implementation and verification records](docs/sprints/sprint-2/README.md).
4. [Sprint 2 running screenshots](docs/sprints/sprint-2/SCREENSHOTS.md).

## Directory Layout

```text
source/
  README.md                         Application setup
  CampusLink/                       Frontend, backend and tests
docs/sprints/
  sprint-1/                         Original verification archive
  sprint-2/
    README.md                       Final record index
    01-implementation.md            Title validation changes
    02-automated-checks.md          Automated results
    03-browser-acceptance.md        Browser verification
    04-issue-review.md              Resolved findings
    SCREENSHOTS.md                  English image captions
    screenshots/                    Original running images
    evidence/                       Logs, results and file manifest
submission/                         Existing submission materials
```

## Verified Sprint 2 Results

| Area | Result |
| --- | --- |
| Product title validation | Shared creation/editing rule; normalized 1–30 UTF-16 units |
| Frontend | Type check and build passed |
| Backend | 158 passed, 3 PostgreSQL-specific cases skipped, 1 warning |
| Focused title API/browser checks | 15 passed; 5 runtime screenshots |
| Existing browser acceptance | 16 reported scenario groups passed |

Both frontend and backend source are tracked in `source/CampusLink/`. Application execution used isolated SQLite databases. [PR #3](https://github.com/RederChen/fubangbang-alpha/pull/3) contains the Sprint 2 changes and final evidence archive.

The Sprint 1 records and original compiled `.releases/` files retain their historical content. `ARCHIVE-MANIFEST.json`, `PACKAGING-RECORD.json` and the initial source manifest describe the original import at `504e8021d1ab32fd5ea210bd75cd40a5ca7d1460`. Subsequent source changes are tracked by Git; the Sprint 2 file manifest covers its final record directory. Build current source to run the updated application.
