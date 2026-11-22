## Problem

Product updates accept whitespace-only titles and retain leading and trailing whitespace, while creation rejects or trims the same inputs. This can store a title with no visible content. The behavior was reproduced during Sprint 1 and remains unfixed.

**Local finding:** S1-02  
**Priority:** P1  
**Sprint:** Sprint 2, November 23–24, 2026  
**Engineering tasks:** A05 decision, A06 implementation, A07 regression verification  
**Responsible group:** Frontend and Backend; Testing and Execution Support reviews the verification record

## Reproduction

Baseline: commit `504e8021d1ab32fd5ea210bd75cd40a5ca7d1460`. Use an authenticated product owner and an isolated test database.

1. Create a valid product and record its ID and title.
2. Send `PUT /api/products/{id}` with `{"title":"   "}`.
3. Retrieve it again and inspect the stored title.
4. Compare creation and editing with `{"title":"  Valid title  "}` and otherwise valid fields.
5. Repeat a valid price-only update that omits `title`.

## Recorded Actual Behavior

- Updating with three spaces returned HTTP 200 and stored those spaces.
- Creation with the same whitespace-only title returned HTTP 422; the browser also blocked it.
- Creation stored `"  Valid title  "` as `"Valid title"`, but updating preserved the boundary spaces.
- An empty string was rejected by both APIs.
- A price-only update that omitted the title succeeded and preserved the stored title.

## Agreed Target

Use the same title-normalization rule for creation and editing. A supplied title must be a string; trim its boundary whitespace using JavaScript `trim()` semantics, then require 1–30 UTF-16 code units. Preserve internal whitespace and do not silently truncate text.

Creation requires a title. During editing, an omitted title preserves the stored value exactly, including legacy records. Explicit `null` is not omission and must return HTTP 422. A rejected request must not persist a valid price or any other field sent with the invalid title.

## Acceptance Criteria

- [ ] Both APIs reject empty and ordinary whitespace-only titles with HTTP 422.
- [ ] Both APIs reject titles made solely of the agreed trim characters, including tab, newline, U+00A0, U+3000, and U+FEFF.
- [ ] Both APIs store `"  Valid title  "` as `"Valid title"`.
- [ ] Both APIs preserve internal spaces in `"A  B"`.
- [ ] Trimming happens before normalized-length validation, including whitespace around a valid 30-unit title.
- [ ] Creation rejects an omitted title; both operations reject explicitly supplied `null` and non-string title values.
- [ ] A valid price-only update preserves the title exactly, including an existing over-limit or whitespace-padded title.
- [ ] A rejected title update leaves all fields unchanged, including price supplied in the same request.
- [ ] Browser validation and error feedback follow the same contract; a valid title persists after refresh and another login.
- [ ] Link the implementation commit or PR, regression results, and focused browser evidence before closing this issue.

## Evidence and Implementation Locations

- [Sprint 1 issue review](https://github.com/RederChen/fubangbang-alpha/blob/504e8021d1ab32fd5ea210bd75cd40a5ca7d1460/docs/sprints/sprint-1/04-issue-review.md)
- [Structured pre-fix observations](https://github.com/RederChen/fubangbang-alpha/blob/504e8021d1ab32fd5ea210bd75cd40a5ca7d1460/docs/sprints/sprint-1/evidence/title-boundary-results.json)
- `source/CampusLink/backend/src/schemas/product.py`: creation has a trim validator; updating has no equivalent in this baseline.
- `source/CampusLink/backend/src/services/product_service.py`: preserve omitted-field behavior and prevent partial writes after validation failure.
- Decision record: `docs/sprints/sprint-2/TITLE-VALIDATION-CONTRACT.md`.

Related finding S1-01 covers the UI/API length mismatch. Implement both against the same contract. This issue records a required change, not an already completed fix.
