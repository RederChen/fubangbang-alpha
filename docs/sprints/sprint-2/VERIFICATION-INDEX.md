# Sprint 2 Verification Evidence Index

Tested application commit: `127a9e73089978394b271ce8b76fe180ce2f0582`. This is an evidence index for implementation review, not the deferred Sprint Essay. Runtime timestamps and tested file hashes are in the structured browser result.

| Check | Actual result | Evidence |
| --- | --- | --- |
| Backend suite | 158 passed, 3 skipped, 1 warning; 101 new cases | [Output](evidence/backend-tests.txt), [JUnit XML](evidence/backend-tests.xml) |
| Frontend types | Passed | [Output](evidence/frontend-typecheck.txt) |
| Frontend build | Passed | [Output](evidence/frontend-build.txt) |
| Title live API/browser | 15 checks passed, no page errors | [Structured results](evidence/title-browser-results.json), [Output](evidence/title-browser-execution.txt) |
| Existing full browser suite | 16 reported scenario groups passed | [Output](evidence/existing-browser-suite.txt) |

The tests were automated against isolated local SQLite databases and disposable accounts/uploads. PostgreSQL concurrency/migration checks were skipped. The warning concerns the test client's deprecated HTTPX integration. No public deployment or old compiled release was used for these results.

## Contract Coverage

Backend assertions are in `source/CampusLink/backend/tests/test_product_titles.py`; focused browser/API checks are in `source/CampusLink/scripts/test_product_titles_e2e.js`.

| Contract cases | Result | Verification |
| --- | --- | --- |
| C01–C02 | 1/30 ASCII accepted | Schema and persisted create/update cases |
| C03–C06 | 31 units and empty/whitespace rejected | Schema, API rejection and UI blank checks |
| C07–C08 | Normalize before checking length | Padded text and padded 30-unit API persistence |
| C09–C10 | Internal spaces preserved; 30 BMP characters accepted | Schema and persisted API cases |
| C11–C14 | Supplementary Unicode counts as two units | 15/16 emoji and mixed ASCII/emoji; browser counter |
| C15 | Missing creation title, null and non-strings rejected | Schema and API error-envelope cases |
| C16–C17 | Omitted update title preserves normal/legacy values | Persisted price-only update cases |
| C18–C19 | Invalid supplied title rejects the whole update | Legacy resubmission and title/price/description persistence assertions |
| C20 | Publish, refresh, sign in again and edit | Real browser with independent new login context |

## Runtime Screenshots

Five original browser PNGs, 880 × 1912 pixels each. Captions describe the observed state; API rejection/persistence assertions are in the test output rather than inferred from screenshots.

### 01-title-limit-30.png

The browser retains 30 of 31 typed ASCII characters and displays 30/30.

![The browser retains 30 of 31 typed ASCII characters and displays 30/30.](evidence/screenshots/01-title-limit-30.png)

### 02-blank-title-rejected.png

A blank title produces a field error without sending a product request.

![A blank title produces a field error without sending a product request.](evidence/screenshots/02-blank-title-rejected.png)

### 03-normalized-published-title.png

Published title is trimmed and remains visible after refresh.

![Published title is trimmed and remains visible after refresh.](evidence/screenshots/03-normalized-published-title.png)

### 04-edited-title-after-new-login.png

After a new login, editing stores the normalized title and new price.

![After a new login, editing stores the normalized title and new price.](evidence/screenshots/04-edited-title-after-new-login.png)

### 05-legacy-title-requires-correction.png

An existing 40-unit title is preserved and flagged for correction; submission is blocked.

![An existing 40-unit title is preserved and flagged for correction; submission is blocked.](evidence/screenshots/05-legacy-title-requires-correction.png)

## Reproduction

Run the commands in [source setup](../../../source/README.md). `npm run test:titles` creates fresh results in `.cache/sprint2-title-evidence/`; the checked-in evidence is the captured run associated with this index. See [environment](evidence/environment.json), [Python package versions](evidence/python-packages.txt), and [evidence hashes](evidence/EVIDENCE-MANIFEST.json).
