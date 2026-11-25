# Fubangbang Alpha Sprint Archive

Campus second-hand trading and information-sharing platform for EE308FZ Software Engineering.

## Start Here

1. [Application source and startup](source/README.md).
2. [Sprint 1 verification records](docs/sprints/sprint-1/README.md).
3. [Sprint 2 title validation and verification](docs/sprints/sprint-2/README.md).
4. [Sprint 3 cover extraction and verification](docs/sprints/sprint-3/README.md).
5. [Sprint 3 running screenshots](docs/sprints/sprint-3/SCREENSHOTS.md).

## Directory Layout

```text
source/CampusLink/           Vue frontend, FastAPI backend, startup scripts and tests
docs/sprints/sprint-1/       Original baseline verification records
docs/sprints/sprint-2/       Title implementation and regression records
docs/sprints/sprint-3/       Cover extraction, verification and running images
submission/                 Existing submission materials
```

Sprint 3 extracts cover handling into `src/composables/useProductCover.ts`. Types/build, 10 module checks, 14 focused cover browser checks, 15 title checks and 16 existing full-browser scenario groups passed. Backend results are 158 passed and 3 PostgreSQL-only cases skipped. See the Sprint 3 records for detailed evidence and source fingerprints.

The snapshot is based on Sprint 2 commit `38912740e22f20d3b4e718bff6ef814c08050da2`, with the tested Sprint 3 source changes applied. Local execution occurred November 23, 2026; the planned Sprint 3 period is November 25–26.

Historical Sprint 1/2 records and original packaged releases retain their original contents. The original root manifests describe the initial import; the Sprint 3 manifest covers its final record directory. Build current source to run the updated application.
