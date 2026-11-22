# Fubangbang Sprint 1 Issue Review and Priorities

**Review date:** November 21, 2026  
**Status:** Investigation complete; fixes remain open

Focused title checks confirmed two inconsistencies in the existing application. The browser form limits product titles to 30 characters, while both API operations accept longer titles. In addition, the update API accepts whitespace-only titles and retains surrounding spaces, although the creation API rejects or trims the same inputs. A separate source review identified a maintenance opportunity in the publishing page.

These findings supplement the successful core-flow checks in Step 3. They concern boundary inputs and code organization that those checks did not cover.

## Issue register

| Local ID | Finding | Type | Evidence status | Priority | Planned treatment |
| --- | --- | --- | --- | --- | --- |
| S1-01 | Product title length differs between the UI and API | Contract inconsistency | Reproduced in browser and API checks | P1 | Agree and implement one rule in Sprint 2 |
| S1-02 | Product updates accept whitespace-only titles and skip trimming | Validation defect | Reproduced through the update API | P1 | Fix together with shared title validation in Sprint 2 |
| S1-03 | Publishing responsibilities are concentrated in one Vue view | Maintainability improvement | Confirmed by source inspection | P2 | Plan one limited extraction for Sprint 3 |

P1 means the item should be addressed in the next sprint. P2 means a planned improvement after the validation fixes. These are local planning priorities. The IDs have not been created as GitHub Issues.

## S1 01 Product title length differs between the UI and API

**Status:** Open  
**Suggested issue title:** Align product title length validation between the UI and API

### Reproduction

1. Log in and open the publishing page.
2. Type 31 ASCII characters into the title field. The field retains 30 characters and shows the 30-character limit.
3. Send an authenticated `POST /api/products` request with a 31-character title and otherwise valid product fields.
4. Send an authenticated `PUT /api/products/{id}` request with a 31-character title for a product owned by that account.

### Actual result and impact

The browser field retained 30 of the 31 typed characters. The create API returned HTTP 201 and saved all 31 characters; the update API returned HTTP 200 and saved all 31. Both API operations also accepted 120-character titles and rejected 121-character titles with HTTP 422.

The same product field therefore has different accepted ranges depending on the entry point. An API-created title can exceed the range permitted by the normal form, creating inconsistent editing behavior and unclear acceptance criteria.

### Proposed treatment

Use a single documented rule for creation and editing. The recommended limit is 30 after trimming, preserving the current form behavior. Confirm the counting convention before implementation; the current JavaScript form and HTML input use UTF-16 length units. The execution in this review used ASCII inputs.

Source locations in the handoff snapshot are `src/views/Publish.vue`, lines 145 and 381, and `backend/src/schemas/product.py`, lines 11 and 30. Reproduction evidence is available in the [boundary check record](TITLE-BOUNDARY-CHECKS.md).

## S1 02 Product updates accept whitespace-only titles

**Status:** Open  
**Suggested issue title:** Apply title trimming and blank validation consistently to product updates

### Reproduction

1. Create a valid product using the owner account.
2. Send `PUT /api/products/{id}` with `{"title":"   "}`.
3. Retrieve the product again.
4. Compare creation and editing with the title `"  Valid title  "`.

### Actual result and impact

An update containing three spaces returned HTTP 200. A subsequent read returned the same three spaces as the stored title. Creation with the same input returned HTTP 422, while the browser blocked a whitespace-only title before sending a product request.

Creation stored `"  Valid title  "` as `"Valid title"`. Updating retained the surrounding spaces. An empty string was rejected by both API operations. A price-only update that omitted the title succeeded and preserved the existing title.

The update path can therefore store a product title with no visible content. It also normalizes titles differently from the creation path.

### Proposed treatment

Share the normalization and validation rule between creation and editing. When a title is provided, trim it and reject an empty result. When a title is omitted from a partial update, preserve the existing value. Keep the price-only update as a regression case.

The creation validator is in `backend/src/schemas/product.py`, lines 20–26. The update model starts at line 29 and has no equivalent trimming validator in this snapshot.

## S1 03 Publishing responsibilities are concentrated in one view

**Status:** Backlog improvement  
**Suggested issue title:** Separate one responsibility from the publishing view without changing behavior

The handoff version of `src/views/Publish.vue` has 1,130 total lines. The script starts at line 298 and styles start at line 420, so a substantial portion of the file is CSS. File length alone is not evidence of a functional failure.

The script handles image upload, draft storage, existing-product loading, validation, payload construction, and submission. These responsibilities can increase the effort required to review changes or modify the same view concurrently.

For Sprint 3, choose one extraction, such as image upload handling or form and draft state. Keep the API payloads, draft storage behavior, and rendered interface stable, and repeat the affected publish and edit checks. This item is not recorded as a broken publishing feature.

The responsibility inventory is included in [source review evidence](evidence/publish-page-review.json).

## Review completion

This review recorded 17 API observations and two browser checks using an isolated local test database. The observations are pre-fix evidence, not a claim that the proposed rules already pass. The original source files were unchanged.

- [Boundary checks and screenshots](TITLE-BOUNDARY-CHECKS.md)
- [Sprint 2 task plan](SPRINT2-TASK-PLAN.md)
- [Raw API and UI observations](evidence/title-boundary-results.json)
- [Execution output](evidence/title-boundary-execution.txt)
- [Source integrity comparison](evidence/source-integrity-check.json)

Step 4 is complete. Implementation remains scheduled for the following sprint. These findings do not establish that the rest of the application is free of defects.
