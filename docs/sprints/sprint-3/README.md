# Fubangbang Sprint 3 Implementation and Verification Records

**Planned sprint period:** November 25–26, 2026  
**Local implementation and verification:** November 23, 2026

Sprint 3 extracts product-cover handling from the publishing view into a dedicated Vue composable. The page keeps form, draft, editing and submission responsibilities. Cover upload, preview, failure recovery and persistence continue to work after the extraction.

| Record | Contents |
| --- | --- |
| [Implementation](01-implementation.md) | Module boundary and final source changes |
| [Automated checks](02-automated-checks.md) | Types, build, module and regression results |
| [Browser acceptance](03-browser-acceptance.md) | Cover workflows and live-API verification |
| [Issue review](04-issue-review.md) | Accepted extraction scope and engineering completion |
| [Screenshot gallery](SCREENSHOTS.md) | Seven original running images with English captions |

| Area | Result |
| --- | --- |
| Frontend type check and build | Passed |
| Cover browser checks | 14 passed, including zero uncaught page errors |
| Isolated composable checks | 10 passed |
| Existing title regression | 15 passed |
| Existing full browser regression | 16 scenario groups passed |
| Backend regression | 158 passed, 3 PostgreSQL-specific tests skipped, 1 dependency warning |
| Sprint 3 engineering tasks | A08 and A09 accepted: 2/2 |

Application source remains under `source/CampusLink/`. This snapshot starts from Sprint 2 commit `38912740e22f20d3b4e718bff6ef814c08050da2` and contains the two tested Sprint 3 source changes. [Acceptance summary](evidence/acceptance-summary.json) records their SHA-256 fingerprints and real execution timestamps. [The file manifest](evidence/FILE-MANIFEST.json) covers this sprint directory.

Git normalizes source text line endings to LF. Original test and capture records retain fingerprints of the Windows working files; [the source identity map](evidence/SOURCE-COMMIT-MAP.json) records original and Git-normalized SHA-256 values. Only line endings change; test outcomes and actual execution timestamps are retained.
