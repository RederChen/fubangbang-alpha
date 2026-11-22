# Sprint 2 Step 1 Completion Record

**Task:** Confirm the title contract and register the two defects.  
**Result:** Decision recorded and both GitHub Issues created and read back successfully.  
**Planned implementation period:** November 23–24, 2026.

## Decisions Recorded

1. A supplied title is a string; explicit null is invalid.
2. Apply browser-compatible boundary trimming before length validation.
3. Accept 1–30 UTF-16 code units after trimming for both creation and editing.
4. Reject blank and over-limit supplied titles with HTTP 422 in the existing error envelope.
5. Omitting the title in an update preserves the stored value exactly.
6. Keep legacy titles readable and unchanged until explicitly edited; do not silently truncate or migrate them.
7. Failed title validation must prevent changes to all fields in the same request.

## Issue Records

| Local finding | GitHub Issue | State | Registration verification |
| --- | --- | --- | --- |
| S1-01 | [#1](https://github.com/RederChen/fubangbang-alpha/issues/1) | Open | Title, full body, and open state read back from GitHub |
| S1-02 | [#2](https://github.com/RederChen/fubangbang-alpha/issues/2) | Open | Title, full body, and open state read back from GitHub |

The linked issues contain reproduction steps, recorded pre-fix behavior, the agreed target, and unchecked implementation acceptance criteria. Their creation timestamps are preserved in `GITHUB-ISSUES.json`.

## Completion Boundary

A05 / S2-01 is complete. A06 implementation and A07 regression verification have not started. The case matrix defines expected results; no new application test results are claimed in this step. No application source files were changed. Existing Sprint 1 records remain the historical baseline.
