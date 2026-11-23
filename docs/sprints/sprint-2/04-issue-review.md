# Sprint 2 Issue Resolution

| Issue | Recorded problem | Implemented resolution | Acceptance evidence |
| --- | --- | --- | --- |
| [#1 / S1-01](https://github.com/RederChen/fubangbang-alpha/issues/1) | The UI limited product titles to 30 while the API accepted longer values | Creation and editing enforce 1–30 UTF-16 units after normalization, matching browser counting | ASCII/Chinese/emoji boundaries, API rejection and browser counter checks |
| [#2 / S1-02](https://github.com/RederChen/fubangbang-alpha/issues/2) | Editing accepted blank titles and retained surrounding whitespace | Both operations share browser-compatible trimming and supplied-value validation; omitted update fields preserve data | Blank/type rejection, normalized persistence, price-only updates and whole-update rejection checks |

Both findings have implementation and successful regression evidence in [PR #3](https://github.com/RederChen/fubangbang-alpha/pull/3). Its merge links the delivered code to both development Issues.

## Acceptance Summary

Valid 30-unit titles survive creation and editing. Over-limit and blank titles are rejected consistently. Failed title validation cannot change a price or another submitted product field. Historical titles remain readable and are preserved by price-only API updates; the edit page shows an explicit error for over-limit values and accepts a corrected title.

Detailed results are in [automated checks](02-automated-checks.md) and [browser acceptance](03-browser-acceptance.md). The original pre-fix findings remain in the [Sprint 1 issue record](../sprint-1/04-issue-review.md).
