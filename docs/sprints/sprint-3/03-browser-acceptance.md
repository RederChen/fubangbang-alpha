# Sprint 3 Browser Acceptance

The tested Vue interface ran in a real automated Microsoft Edge browser against a live local FastAPI service, disposable accounts, an isolated upload directory and a fresh SQLite database. Browser assertions were combined with API responses and reread persisted product fields.

| Case | Verified behavior | Result |
| --- | --- | --- |
| S3-C01 | JPEG, PNG and WebP each upload once and display the server-returned cover | PASS |
| S3-C02 | Unsupported MIME is blocked before upload and preserves the existing cover | PASS |
| S3-C03 | 5 MiB plus one byte is rejected by the browser before a request | PASS |
| S3-C04 | Corrupt and empty accepted-MIME files receive real API rejection, keep the cover and leave upload idle | PASS |
| S3-C05 | Empty selection leaves state intact; selecting the same rejected file sends a fresh request | PASS |
| S3-C06 | In-flight upload blocks a second upload, removal, draft save and product submission | PASS |
| S3-C07 | Failed upload retains the old cover and allows the same file to succeed on retry | PASS |
| S3-C08 | Removing the cover blocks product submission with the missing-cover message | PASS |
| S3-C09 | Removed/reselected replacement is published and its cover persists after refresh | PASS |
| S3-C10 | Draft restores title, price and uploaded cover; successful publication clears it | PASS |
| S3-C11 | Non-upload draft image is ignored while other draft fields restore | PASS |
| S3-C12 | Existing asset cover loads without upload and remains intact after an owner edit | PASS |
| S3-C13 | Owner cover replacement persists; another user cannot overwrite it | PASS |
| S3-C14 | Sprint 2 title regression suite | PASS |
| S3-C15 | Frontend checks, existing browser suite and backend suite; PostgreSQL-specific checks skipped | PASS |

The focused browser run reports 14 checks: 13 cover scenarios and one zero-page-error assertion. The 15-row acceptance matrix also includes the separate title suite and the broader automated verification.

For C03, the browser rejects 5 MiB plus one byte before upload; isolated module check M05 verifies the inclusive exact boundary with a stub. For C05, an empty FileList simulates cancellation; the native OS dialog is not operated. For C06/C07, browser request interception deliberately delays or interrupts an upload before the API receives it. Normal and retried successful uploads use the real endpoint.

Seven original screenshots were captured during a second successful execution of the focused suite, at 440 × 956 CSS pixels and 2× scaling (880 × 1912 PNG). Application sample product images provide the uploaded fixtures. The capture run repeated all 14 checks successfully with no uncaught page errors. Screenshot contents were not redrawn or replaced.

See [capture results](evidence/screenshot-capture-results.json), [acceptance summary](evidence/acceptance-summary.json) and the [screenshot gallery](SCREENSHOTS.md).
