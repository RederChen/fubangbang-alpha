# Sprint 2 Product Title Implementation

## Final Title Rule

| Input or operation | Behavior |
| --- | --- |
| Supplied title | Must be a string |
| Normalization | Trim leading/trailing ECMAScript whitespace, preserving internal whitespace and case |
| Length | Accept 1–30 UTF-16 code units after trimming; supplementary characters occupy two units |
| Invalid input | Empty, blank, over-limit, explicit null and non-string values produce HTTP 422 with a title field error |
| Update omits title | Preserve the stored title exactly, including existing long values |
| Invalid title in a multi-field update | Reject the whole update; title, price and other product fields remain unchanged |
| Valid supplied title | Store the normalized value without truncation |

Creation keeps HTTP 201 and editing keeps HTTP 200. Error responses retain `code`, `message` and `data`.

## Code Changes

- `backend/src/schemas/product.py`: one shared normalization function runs before field validation for both creation and editing. Its trim set matches browser `String.trim()` semantics, including U+FEFF, and its length count matches JavaScript string length.
- `src/views/Publish.vue`: the counter and payload use the same normalized title. Existing over-limit edit values remain visible with a correction message and submission is blocked until corrected.
- `backend/tests/test_product_titles.py`: added 101 regression cases covering schemas, API responses and persisted product state.
- `scripts/test_product_titles_e2e.js`: reproducible live-API and browser verification through `npm run test:titles`.
- `backend/docs/API.md`: documents the shared creation/editing rule.
- `.gitignore`: backend source is tracked alongside frontend source; private environment files, local databases and dependency directories remain excluded.

## Persistence Verification

Regression assertions check 1/30/31-unit boundaries, surrounding and internal whitespace, Chinese text, supplementary Unicode, invalid types, price-only updates and historical records. Rejected updates are checked by rereading title, price, description, category, image, location and status. Browser checks also verify publication, refresh, a new login session and editing.

See [automated results](02-automated-checks.md), [browser acceptance](03-browser-acceptance.md) and [issue resolution](04-issue-review.md).
