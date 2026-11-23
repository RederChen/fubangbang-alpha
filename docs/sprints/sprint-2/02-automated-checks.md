# Sprint 2 Automated Check Results

## Environment

Windows; Node.js 24.19.0; npm 11.17.0; Python 3.13.12; installed Microsoft Edge; isolated SQLite test databases.

| Check | Command | Actual result | Evidence |
| --- | --- | --- | --- |
| Frontend types | `npm run typecheck` | Passed | [Log](evidence/frontend-typecheck.txt) |
| Frontend build | `npm run build` | Passed | [Log](evidence/frontend-build.txt) |
| Backend suite | `.venv/Scripts/python.exe -m pytest -ra` from `backend/` | 158 passed, 3 skipped, 1 warning | [Log](evidence/backend-tests.txt), [JUnit](evidence/backend-tests.xml) |
| Focused title checks | `npm run test:titles` | 15 passed | [Log](evidence/title-browser-execution.txt), [Results](evidence/title-browser-results.json) |
| Existing browser suite | `npm run test:e2e` | 16 reported scenario groups passed | [Log](evidence/existing-browser-suite.txt) |

Frontend/browser commands run from `source/CampusLink/`. The backend suite contains the existing 57 passing tests and 101 newly added title regression cases.

## Regression Coverage

- Accepted titles: one character, 30 ASCII units, padded valid values, internal double spaces, 30 Chinese characters, 15 supplementary emoji and mixed ASCII/emoji boundaries.
- Rejected titles: 31 units, empty/blank input, 16 supplementary emoji, explicit null, numbers, booleans, arrays and objects.
- Whitespace: each ECMAScript trim character, including tabs, line terminators, U+00A0, U+3000 and U+FEFF. Characters removed by Python's default strip but retained by JavaScript trim are also checked.
- Data integrity: invalid creation inserts no product; an invalid update leaves all checked fields unchanged; omitted titles preserve valid and historical stored values.

The three skipped tests are PostgreSQL concurrency/migration checks. The warning is the test client's HTTPX deprecation warning. The successful database results in this record apply to SQLite.
