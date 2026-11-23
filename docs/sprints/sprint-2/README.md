# Sprint 2: Product Title Validation

**Planned sprint:** November 23–24, 2026

**Implementation commit:** `127a9e73089978394b271ce8b76fe180ce2f0582`

**Engineering status:** A05 contract, A06 implementation and A07 verification completed on the development branch; integration review and merge are pending.

**Deferred:** Sprint essay/report, burn-up chart and contribution allocation.

Creation and editing now share browser-compatible trimming and a 1–30 UTF-16-unit title rule. Blank, null and non-string supplied values are rejected. Omitted update titles are preserved, including historical values. Invalid title updates cannot persist changes to other product fields.

## Records

- [Title contract and C01–C20 matrix](TITLE-VALIDATION-CONTRACT.md)
- [Step 1 decision record](STEP1-RECORD.md) — historical decision-stage status
- [Issue #1: length mismatch](https://github.com/RederChen/fubangbang-alpha/issues/1)
- [Issue #2: trimming and blank validation](https://github.com/RederChen/fubangbang-alpha/issues/2)
- [Verification index, cases and runtime images](VERIFICATION-INDEX.md)
- [Team handoff and remaining sprint work](TEAM-HANDOFF.md)

## Results

| Check | Actual result |
| --- | --- |
| Backend suite | 158 passed, 3 PostgreSQL-specific checks skipped, 1 dependency deprecation warning |
| Frontend type check and build | Passed |
| Focused live-API/browser verification | 15 checks passed; 5 screenshots; no page errors |
| Existing complete browser suite | 16 reported scenario groups passed |

All execution was tool-assisted automation against local isolated SQLite databases. These are not independently executed manual tests by named team members. Both Issues remain open pending integration review; the linked pull request closes them when merged. No PostgreSQL execution, database migration or Sprint 3 refactoring is claimed here.
