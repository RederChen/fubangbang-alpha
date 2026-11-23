# Fubangbang Alpha

Coursework repository for the CampusLink campus second-hand trading and information-sharing platform.

## Start Here

- [Application source and startup](source/README.md)
- [Sprint 1 historical verification](docs/sprints/sprint-1/README.md)
- [Sprint 2 implementation and evidence](docs/sprints/sprint-2/README.md)
- [Teammate handoff for Sprints 3 and 4](docs/sprints/sprint-2/TEAM-HANDOFF.md)

```text
source/CampusLink/
  src/                 Vue 3 + TypeScript frontend
  backend/src/         FastAPI backend
  backend/tests/       Backend regression tests
  scripts/             Startup and browser verification
docs/sprints/
  sprint-1/            Historical baseline, screenshots and investigation
  sprint-2/            Title contract, verification evidence and team handoff
submission/            Historical Sprint 1 submission draft and checklist
```

Both frontend and backend source are tracked in this repository. Teammates can clone this one repository; there is no nested backend Git repository to initialize. New changes continue under `source/CampusLink/` without moving the application or uploading another copy.

## Current Work

Sprint 2 aligns product-title validation between creation and editing: browser-compatible trimming, 1–30 UTF-16 units, blank/null rejection, and preservation of omitted titles in partial updates. Implementation and verification are ready for teammate review on `fix/sprint2-product-title`; they reach `main` only after the pull request is merged.

The Sprint 2 essay/report, burn-up chart and contribution allocation remain deferred. Their completion is not implied by the code changes.

## Historical Materials

The initial baseline import is `504e8021d1ab32fd5ea210bd75cd40a5ca7d1460`. Sprint 1 records, its initial 5/8 chart, and the files under `submission/` are retained historical snapshots; they are not current Sprint 2 status. The later finalized Sprint 1 blog and 8/8 chart were prepared outside this repository and are not synchronized by this change.

`ARCHIVE-MANIFEST.json`, `PACKAGING-RECORD.json`, and the Sprint 1 source manifest describe the initial archive. They are not checksums for subsequently edited application files. Git commits track later changes. The old `.releases/` files are historical compiled output; rebuild the current source for current behavior.
