# Team Handoff After Sprint 2

## Starting Version and Repository

Repository: https://github.com/RederChen/fubangbang-alpha

Development branch: `fix/sprint2-product-title`

Tested application commit: `127a9e73089978394b271ce8b76fe180ce2f0582`

The code, tests, screenshots and handoff are uploaded together. Review the Sprint 2 pull request and merge it into `main` before starting Sprint 3. In GitHub Desktop, select the repository, select `main`, then Fetch/Pull origin after the merge. A new teammate should clone this repository first. The old `docs/sprint2-step1` branch contains decisions only and does not contain the fix.

Create a new branch such as `refactor/sprint3-publish-upload` from the updated `main`. Open and edit `source/CampusLink/`. Commit focused changes and push the branch; open a pull request back to `main`. If the teammate lacks write access, the repository owner can add them under Settings → Collaborators, or they can fork the repository and submit a pull request. No account sharing is needed. No invitations were sent as part of this handoff.

Both application parts are tracked in this repository. The former blanket backend ignore rule has been removed. Keep `.env`, tokens, local databases, `.venv`, `node_modules`, cache files and generated builds out of commits. Check the Changes list before committing.

## What Sprint 2 Changed

- Shared backend normalization for creation and editing, applied before length validation.
- JavaScript-compatible boundary whitespace and 1–30 UTF-16-unit counting.
- Rejection of blank, null, non-string and over-limit supplied titles.
- Omitted update titles preserve stored values exactly; invalid titles reject the whole update.
- Frontend counter uses the normalized title. Legacy over-limit edit values remain visible with a correction message and are not silently shortened.
- Added 101 backend regression test cases and a reproducible title browser script. The existing 57 passing backend cases still pass.

Product routes, successful response status codes, authentication and unrelated product fields retain their existing behavior. No schema migration or historical-title rewrite is needed. The public deployed site and old compiled releases were not updated by this repository change.

## Setup and Checks

Follow [source setup](../../../source/README.md). The full app is in `source/CampusLink/`, and backend commands run in its `backend/` directory. Run the existing frontend type check/build, backend suite and affected browser checks before requesting review.

The verified environment and exact installed Python packages are preserved in `evidence/environment.json` and `evidence/python-packages.txt`. The requirements file uses version ranges, so compare the environment record if a new installation behaves differently. Three PostgreSQL-specific cases remain unverified; the SQLite result does not cover them. One test-client dependency deprecation warning was observed and did not fail the suite.

## Sprint 3: November 25–26

Engineering tasks: **A08 and A09**.

1. Inspect `src/views/Publish.vue` and select one responsibility to extract. Image selection/upload state is the current candidate; confirm its dependencies before choosing.
2. Register a development Issue describing the extraction and acceptance criteria. Work on a new branch from the merged Sprint 2 version.
3. Extract that one responsibility into a component or composable as appropriate. Preserve payloads, the title contract, image validation, loading/error states and draft behavior.
4. Verify valid publication, image handling, draft restoration, editing and failed-request recovery. Run the title regression too, since the same page is changing.
5. Save the actual test results, runtime images and commit links; then update the burn-up chart and write Sprint Essay 3.

Finish when the selected responsibility has a clear independent location and the affected workflows still pass. Broad page redesign, new features and a full architecture rewrite are outside this task. Sprint 3 has not been implemented in this handoff.

## Sprint 4: November 27–28

Engineering tasks: **A10, A11 and A12**.

1. Test login, publishing/search/editing, title boundaries, ownership, buyer/seller transactions and forum flows against the combined version.
2. Fix delivery-blocking defects and rerun the affected checks. Record unresolved issues and their impact.
3. Build the frontend again and verify the startup procedure against the selected final commit. Do not demonstrate the old `.releases/` files as the newly changed version.
4. Consolidate cases, results, screenshots, environment details and version links. Prepare Sprint Essay 4 and materials for the Testing Essay, Summary Essay and presentation.
5. Update the project chart from accepted work and the actual scope. Planned cumulative milestones are 9/12 after Sprint 3 and 12/12 after Sprint 4; they are targets until verified.

## Documentation Still to Complete

- Sprint 2 report/blog, burn-up chart and actual contribution allocation were intentionally left for later.
- Sprint 1's finalized 8/8 chart, final blog and group contribution material remain in the coordinator's separate local blog package, not this repository. The checked-in old 5/8 chart is historical and must not be reused as a current snapshot.
- Project-level engineering scope is 12 packages. Sprint 1's separate eight-item work list includes publication work and is not interchangeable with this project count.
- The coordinator can hand off after Sprint 2. Later work and contribution records should name the teammates who actually execute it, using their own commits and test evidence.
- Confirm published blog links and complete the index, Testing Essay, Summary Essay and presentation/submission checklist. Do not infer CSDN publication from a local draft.
