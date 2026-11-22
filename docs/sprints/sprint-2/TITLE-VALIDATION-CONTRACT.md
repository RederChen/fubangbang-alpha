# Sprint 2 Product Title Validation Contract

**Decision:** Adopt the rules below for the Sprint 2 implementation.  
**Planned implementation window:** November 23–24, 2026  
**Engineering task:** A05 / S2-01  
**Implementation status:** Not started  
**Related findings:** S1-01 and S1-02

Product creation and editing will use the same title normalization and validation rule. Keep the existing browser limit of 30 UTF-16 code units, normalize before checking length, and preserve the stored title when an update omits the field.

## Shared Rule

| Item | Decision |
| --- | --- |
| Input type | A supplied title must be a string. Reject explicit `null`, numbers, arrays, and objects with the established HTTP 422 validation response. |
| Creation | A title is required. Omitting it is invalid. |
| Editing | Omitting `title` preserves the stored title exactly. Supplying it requires validation under this contract. Explicit `null` is not omission. |
| Normalization | Remove leading and trailing whitespace using the same semantics as JavaScript `String.prototype.trim()`. Preserve internal whitespace. Do not change case or apply Unicode normalization. |
| Order | Check the input type, trim it, then check the normalized title's length. A valid 30-unit title surrounded by spaces must be accepted by the API and stored without those spaces. |
| Length | Accept 1–30 UTF-16 code units, inclusive, after trimming. Count the same way as JavaScript string `.length`; Python code-point count alone is insufficient for supplementary characters. |
| Empty input | Reject both an empty string and a string that becomes empty after trimming. |
| Persistence | Store the normalized supplied title. Never silently truncate it to fit the limit. |
| Rejected update | Reject the request before persisting any field. The original title and other fields, including price, remain unchanged. |
| Response | Use HTTP 422 and the project's `code`, `message`, and `data` error envelope. The validation details identify `title`. Preserve existing HTTP 201 creation and HTTP 200 update success behavior. |
| Frontend | Keep the existing 30-unit input limit. Counter, submit checks, and submitted title must agree with the normalized rule. Show clear invalid-title feedback and preserve the entered text after an error. |

For trim compatibility, use the ECMAScript whitespace and line-terminator set. Examples include ordinary spaces, tabs, line breaks, U+00A0, U+3000, and U+FEFF. Do not assume Python's default `strip()` has exactly the same character set. The title rule does not change validation for category, description, price, or other fields.

## Existing Titles

Do not migrate, delete, or automatically shorten previously stored titles in this change. Existing long titles remain readable. An API update that omits `title`, such as a price-only request, preserves the existing title even if it exceeds the new limit. This preservation rule also avoids unexpectedly rewriting existing whitespace.

If a request explicitly includes a title, apply the new rule even when the supplied title equals the existing value. Reject an over-limit or blank supplied title. When the existing long title is displayed in the edit form, show the validation state and require the user to provide a valid title before submitting that title; do not silently cut it during loading or submission.

## Acceptance Matrix

These are acceptance targets for implementation and regression testing, not test results.

| Case | Input or operation | Required result |
| --- | --- | --- |
| C01 | Create and edit with `A` | Accepted; stored title is `A`. |
| C02 | Create and edit with 30 ASCII `A` characters | Accepted; all 30 are preserved. |
| C03 | Create and edit with 31 ASCII `A` characters | HTTP 422; a rejected update leaves all product fields unchanged. |
| C04 | Supply an empty string | HTTP 422 for both operations. |
| C05 | Supply ordinary spaces only | HTTP 422 for both operations. |
| C06 | Supply tabs, line breaks, U+00A0, U+3000, or U+FEFF only | HTTP 422 after the agreed trim step. |
| C07 | Supply `  Valid title  ` | Both operations store `Valid title`. |
| C08 | Surround a valid 30-unit title with whitespace | The API accepts it and stores exactly the normalized 30-unit title. |
| C09 | Supply `A  B` | Accepted; the two internal spaces are preserved. |
| C10 | Supply 30 BMP Chinese characters | Accepted; the normalized length is 30 units. |
| C11 | Supply 15 instances of U+1F600 | Accepted; 15 supplementary characters occupy 30 UTF-16 units. |
| C12 | Supply 16 instances of U+1F600 | HTTP 422; the normalized length is 32 units. |
| C13 | Supply 28 ASCII `A` characters followed by U+1F600 | Accepted; normalized length is 30 units. |
| C14 | Supply 29 ASCII `A` characters followed by U+1F600 | HTTP 422; normalized length is 31 units. |
| C15 | Create without `title`, or explicitly supply `null` or a non-string title | HTTP 422. Apply the supplied-value rejection to editing as well. |
| C16 | Edit price while omitting `title` | Valid price update succeeds; the stored title is unchanged. |
| C17 | Edit price while omitting an existing over-limit title | Valid price update succeeds; the legacy title remains unchanged. |
| C18 | Explicitly resubmit an existing over-limit title | HTTP 422; the stored product remains unchanged. |
| C19 | Submit an invalid title together with a valid new price | HTTP 422; neither the title nor price is changed. |
| C20 | Publish a valid product, refresh, sign in again, then edit it | The normalized title persists; input feedback and API outcomes agree. |

## Completion and Scope

A05 / S2-01 is complete when this contract and both issue records are available for the implementation work. A06 and A07 remain open work: implement the rule, add regression assertions, and verify the affected browser flow. Keep both defects open until their acceptance criteria pass and the implementation and verification evidence is linked.

Publishing-page extraction stays in Sprint 3. No database migration, full page rewrite, unrelated validation change, or application code modification is part of this decision step.

## References

- [Recorded title-boundary evidence](https://github.com/RederChen/fubangbang-alpha/blob/504e8021d1ab32fd5ea210bd75cd40a5ca7d1460/docs/sprints/sprint-1/TITLE-BOUNDARY-CHECKS.md)
- [Sprint 1 issue review](https://github.com/RederChen/fubangbang-alpha/blob/504e8021d1ab32fd5ea210bd75cd40a5ca7d1460/docs/sprints/sprint-1/04-issue-review.md)
- [Frontend publishing view](https://github.com/RederChen/fubangbang-alpha/blob/504e8021d1ab32fd5ea210bd75cd40a5ca7d1460/source/CampusLink/src/views/Publish.vue)
- [Backend product schemas](https://github.com/RederChen/fubangbang-alpha/blob/504e8021d1ab32fd5ea210bd75cd40a5ca7d1460/source/CampusLink/backend/src/schemas/product.py)
- [ECMAScript trim semantics](https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype.trim)

