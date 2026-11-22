# Fubangbang Sprint 2 Title Validation Decision

**Planned sprint:** November 23–24, 2026  
**Step:** A05 / S2-01 contract decision and issue registration complete  
**Implementation:** Not started

The title rule is now recorded for the Sprint 2 implementation: trim boundary whitespace using the browser's rule, accept 1–30 UTF-16 code units, use the same validation for creation and editing, and preserve stored titles when updates omit the field.

## Records

- [Agreed title contract and acceptance matrix](TITLE-VALIDATION-CONTRACT.md)
- [GitHub issue for S1-01](https://github.com/RederChen/fubangbang-alpha/issues/1) — UI/API length mismatch
- [GitHub issue for S1-02](https://github.com/RederChen/fubangbang-alpha/issues/2) — inconsistent trimming and blank validation
- [Step 1 completion record](STEP1-RECORD.md)
- [Verified GitHub issue metadata](GITHUB-ISSUES.json)

## Implementation Handoff

The Frontend and Backend group implements the shared rule. Testing and Execution Support records regression results against the acceptance matrix. Both defects remain open until the implementation and verification evidence is linked.

Next work is A06: implement the contract in a focused development branch. A07 then adds and runs regression cases and checks the affected browser flow. No application source file was modified during this decision step.
