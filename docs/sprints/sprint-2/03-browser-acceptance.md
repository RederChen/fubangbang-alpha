# Sprint 2 Browser Acceptance

The focused script starts the application against a fresh SQLite database, disposable accounts and an isolated upload directory. It exercises live HTTP endpoints and the actual Vue interface using an automated Microsoft Edge browser at 440 × 956 CSS pixels, with 2× screenshot scaling.

| Check | Observed behavior | Result |
| --- | --- | --- |
| API-ascii30 | Creation and editing accept and normalize the same valid boundary | PASS |
| API-padded30 | Creation and editing accept and normalize the same valid boundary | PASS |
| API-emoji15 | Creation and editing accept and normalize the same valid boundary | PASS |
| API-ascii31 | Invalid creation and update are rejected without changing stored fields | PASS |
| API-blank | Invalid creation and update are rejected without changing stored fields | PASS |
| API-emoji16 | Invalid creation and update are rejected without changing stored fields | PASS |
| API-null | Invalid creation and update are rejected without changing stored fields | PASS |
| API-omitted-title | Price-only update preserves the stored title | PASS |
| UI-ascii-limit | Browser input and counter use the 30-unit limit | PASS |
| UI-emoji-counter | Fifteen supplementary emoji count as 30 units | PASS |
| UI-blank | Blank title is blocked before submission | PASS |
| UI-publish-refresh | Valid title is normalized, saved and survives refresh | PASS |
| UI-login-edit-refresh | New login and edit preserve normalized data after refresh | PASS |
| UI-legacy-title | Legacy title remains readable and is never silently truncated | PASS |
| UI-legacy-correction | A corrected legacy title saves successfully | PASS |

The checks cover creation/editing boundaries, invalid update persistence, the normalized counter, blank rejection, publication/refresh, editing after signing in from a fresh browser context, and correction of an existing 40-unit title. All 15 checks passed with zero uncaught page errors.

The existing complete browser suite also passed all 16 reported scenario groups, covering registration/login, protected routes, publication, uploads, drafts, editing, search, permissions, transactions, forum interactions, likes, notifications, error recovery and responsive layouts.

See [focused results](evidence/title-browser-results.json), [focused execution](evidence/title-browser-execution.txt), [existing suite execution](evidence/existing-browser-suite.txt) and [the five running screenshots](SCREENSHOTS.md).
