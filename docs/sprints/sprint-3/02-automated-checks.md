# Sprint 3 Automated Checks

**Execution date:** November 23, 2026. Windows, Node.js 24.19.0, npm 11.17.0, Python 3.13.12 and Microsoft Edge.

| Verification | Result | Evidence |
| --- | --- | --- |
| `npm run typecheck` | PASS | [Log](evidence/frontend-typecheck.txt) |
| `npm run build` | PASS | [Log](evidence/frontend-build.txt) |
| Isolated cover composable checks | 10 passed | [Results](evidence/cover-module-results.json) |
| Focused cover browser/API checks | 14 passed | [Results](evidence/cover-browser-results.json) |
| `npm run test:titles` | 15 passed | [Results](evidence/title-browser-results.json) |
| `npm run test:e2e` | 16 scenario groups passed | [Log](evidence/existing-e2e.txt) |
| Backend `python -m pytest -ra` | 158 passed, 3 skipped, 1 warning | [Log](evidence/backend-tests.txt), [JUnit](evidence/backend-tests.xml) |

The isolated module checks use real Vue refs and stubbed upload responses. They cover format and size screening, cancellation, same-file retry, shared photo errors, picker/removal guards and submission state. Exactly 5 MiB is checked at the client boundary; this does not claim arbitrary bytes of that size are a valid backend image.

The live suites use fresh local SQLite databases. Three PostgreSQL-only concurrency/migration tests are skipped. The warning is the existing Starlette/httpx test-client deprecation warning. Raw test timestamps are retained. Personal repository paths in text logs are replaced with placeholders and the JUnit hostname is omitted.
