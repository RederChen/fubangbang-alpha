## Problem

Product title length depends on the entry point. The browser input permits 30 UTF-16 code units, but the create and update APIs currently accept longer titles. This was reproduced during Sprint 1 and remains unfixed.

**Local finding:** S1-01  
**Priority:** P1  
**Sprint:** Sprint 2, November 23–24, 2026  
**Engineering tasks:** A05 decision, A06 implementation, A07 regression verification  
**Responsible group:** Frontend and Backend; Testing and Execution Support reviews the verification record

## Reproduction

Baseline: commit `504e8021d1ab32fd5ea210bd75cd40a5ca7d1460`. Use an authenticated seller and an isolated test database.

1. Open the product publishing page and type 31 ASCII characters into the title field. Observe that it retains at most 30 and shows the 30-unit counter.
2. Send `POST /api/products` with a 31-character ASCII title and otherwise valid product data.
3. Retrieve the created product and inspect its stored title.
4. As the owner, send `PUT /api/products/{id}` with a 31-character title, then retrieve it again.
5. Compare 120-character and 121-character inputs with the browser rule.

## Recorded Actual Behavior

- Creation returned HTTP 201 and stored all 31 characters.
- Updating returned HTTP 200 and stored all 31 characters.
- Both API operations also accepted 120-character titles and rejected 121-character titles with HTTP 422.

## Agreed Target

Validate a supplied string after trimming leading and trailing whitespace using JavaScript `trim()` semantics. Accept a normalized length of 1–30 UTF-16 code units for creation and editing. Do not silently truncate a title. Count supplementary characters the same way as JavaScript `.length`, rather than Python code-point count alone.

Do not rewrite existing long records. Updates that omit `title` retain the stored title; explicitly supplied over-limit titles are rejected. Preserve the existing response envelope and permissions.

## Acceptance Criteria

- [ ] Both APIs accept normalized ASCII lengths of 1 and 30 and reject 31 with HTTP 422.
- [ ] A normalized 30-unit title surrounded by whitespace is accepted by the API and stored without boundary whitespace.
- [ ] Both APIs accept 30 BMP Chinese characters.
- [ ] Both APIs accept 15 instances of U+1F600 (30 units) and reject 16 (32 units).
- [ ] Mixed text at 30 and 31 UTF-16 units produces the same decisions in UI and API validation.
- [ ] Failed updates preserve every stored field, including a valid price sent alongside the invalid title.
- [ ] A price-only update preserves the existing title, including a legacy over-limit title.
- [ ] Editing a legacy long title does not silently truncate it; an explicitly supplied title must satisfy the new rule.
- [ ] Counter, submit validation, API behavior, error feedback, refresh, and subsequent retrieval agree.
- [ ] Link the implementation commit or PR, regression results, and focused browser evidence before closing this issue.

## Evidence and Implementation Locations

- [Sprint 1 boundary record](https://github.com/RederChen/fubangbang-alpha/blob/504e8021d1ab32fd5ea210bd75cd40a5ca7d1460/docs/sprints/sprint-1/TITLE-BOUNDARY-CHECKS.md)
- [Structured pre-fix observations](https://github.com/RederChen/fubangbang-alpha/blob/504e8021d1ab32fd5ea210bd75cd40a5ca7d1460/docs/sprints/sprint-1/evidence/title-boundary-results.json)
- `source/CampusLink/src/views/Publish.vue`: title input, counter, and submit validation.
- `source/CampusLink/backend/src/schemas/product.py`: create and update title validation.
- Decision record: `docs/sprints/sprint-2/TITLE-VALIDATION-CONTRACT.md`.

Related finding S1-02 covers consistent blank validation and trimming. Implement both against the same contract. This issue records a required change, not an already completed fix.

