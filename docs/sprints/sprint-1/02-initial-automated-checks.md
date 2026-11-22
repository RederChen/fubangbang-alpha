# Fubangbang Sprint 1 Initial Automated Check Record

**Check date:** November 21, 2026  
**Sprint period:** November 21–22, 2026  
**Version under test:** The local handoff baseline described in [Step 1](01-environment-and-baseline.md)

The existing type check, frontend build, backend tests, and browser automation were executed to establish the starting condition of the project. The type check and build passed. Backend testing reported 57 passed and 3 skipped cases. Browser automation completed successfully.

These results verify functionality already present in the handoff version. The work completed in this step consists of executing and recording the checks. Application code and existing tests were not changed, and no new test cases were added.

## Frontend checks

The following commands were executed from the project root:

```powershell
npm run typecheck
npm run build
```

| Check | Result |
| --- | --- |
| TypeScript and Vue type check | Passed; exit code 0 |
| Frontend build | Passed; exit code 0 |

Vite v6.4.4 transformed 126 modules and generated the `dist/` directory. These results are recorded from the command execution output; complete standalone console logs were not retained for these two commands. Production deployment of the build output remains to be checked.

## Backend tests

The tests were run with the backend virtual environment. The invocation below reproduces the test options used and writes a JUnit report:

```powershell
Push-Location .\backend
.\.venv\Scripts\python.exe -m pytest -ra --junitxml=..\.cache\sprint1-backend-tests.xml
Pop-Location
```

No PostgreSQL test database URL was configured for this run. The fixtures used separate temporary SQLite databases.

| Metric | Result |
| --- | ---: |
| Collected cases | 60 |
| Passed | 57 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 3 |
| Warnings | 1 |
| Reported duration | 17.85 seconds |

The skipped cases require PostgreSQL:

- The concurrency check in `test_activity.py`.
- The migration check in `test_forum.py`.
- The concurrency check in `test_transaction_conflicts.py`.

These three cases remain unverified in this run. One Starlette test-client deprecation warning concerned the use of `httpx`. It did not cause a failure and is recorded for future dependency maintenance.

## Browser automation

The existing browser test suite was run from the project root:

```powershell
npm run test:e2e
```

The script used Microsoft Edge in headless mode, temporary server ports, a separate test database, and a separate upload directory. Its test data was isolated from the normal local development database.

The following areas were covered by passing checks:

- Registration, real login, and return to a protected route after login.
- Cover upload, draft restoration, product creation, subsequent retrieval, and owner editing.
- Product search, empty results, incorrect passwords, and network error handling.
- Favorites, seller contact information, and completion of the buyer and seller transaction flow.
- Failed publication, retry behavior, and confirmed deletion.
- Forum access control, post creation and editing, search and category filters, comments across accounts, and deletion.
- Likes, notifications, read status, and navigation to related content.
- Expired sessions, missing content, offline states, and retry behavior.
- Horizontal overflow checks on the pages exercised at viewport widths of 375, 390, and 440 pixels, and checks for collected uncaught page errors.

The final script output was:

```text
ALL END-TO-END CHECKS PASSED
```

The process exited with code 0. The checks cover the scenarios exercised by the existing scripts. Reading saved data again does not establish that server restart, backup, or recovery has been tested.

## Evidence and next step

- [Backend console output](evidence/backend-tests.txt)
- [Backend JUnit report](evidence/backend-tests.xml)
- [Browser automation output](evidence/browser-tests.txt)

The evidence copies replace personal machine paths with `<project-root>`. The JUnit copy also omits the machine hostname; case names and results are preserved.

**Step 2 is complete.** Manual acceptance testing with dedicated accounts, screenshots or recordings of that acceptance process, and an issue list are next. PostgreSQL-specific checks, additional browsers and devices, and production deployment remain pending.
