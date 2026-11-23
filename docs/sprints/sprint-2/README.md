# Fubangbang Sprint 2 Verification and Issue Records

**Sprint period:** November 23–24, 2026

Sprint 2 resolves the two product-title inconsistencies identified in Sprint 1. Creation and editing now share the same normalization and length rule. The frontend counter agrees with the normalized submitted value, and invalid updates preserve stored product data.

| Record | Contents |
| --- | --- |
| [Implementation](01-implementation.md) | Confirmed title rules and final frontend/backend changes |
| [Automated checks](02-automated-checks.md) | Frontend checks, backend regression results and execution logs |
| [Browser acceptance](03-browser-acceptance.md) | Fifteen focused checks and the existing complete browser suite |
| [Issue review](04-issue-review.md) | Resolution and acceptance evidence for Issues #1 and #2 |
| [Screenshot gallery](SCREENSHOTS.md) | Five original running images with English captions |

## Verified Results

| Area | Result |
| --- | --- |
| Frontend type check and build | Passed |
| Backend regression suite | 158 passed, 3 PostgreSQL-specific cases skipped, 1 dependency deprecation warning |
| Focused live-API/browser checks | 15 passed; no uncaught page errors |
| Existing browser acceptance | All 16 reported scenario groups passed |
| Runtime screenshots | 5 original PNGs |

Application code is in `source/CampusLink/`, with the Vue frontend under `src/` and FastAPI backend under `backend/src/`. These results were executed with automation against isolated local SQLite databases.

## Version and Evidence

The application was tested at commit [`127a9e7`](https://github.com/RederChen/fubangbang-alpha/commit/127a9e73089978394b271ce8b76fe180ce2f0582). The application tree is `550139a9e9fe3d21b2057c2235e31f8ef69eb39e`; the final archive uses the same application files. [PR #3](https://github.com/RederChen/fubangbang-alpha/pull/3) integrates the code and these final records.

Execution logs and structured results are under `evidence/`; images are under `screenshots/`, following the Sprint 1 archive layout. Screenshot references inside the structured results are relative to this sprint directory. Personal repository paths in text logs are replaced with `<repository-root>` and the JUnit hostname is omitted; test outcomes and timestamps are preserved. [The file manifest](evidence/FILE-MANIFEST.json) records the final sprint files.
