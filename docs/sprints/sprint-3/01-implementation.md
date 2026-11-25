# Sprint 3 Product Cover Extraction

## Final Responsibility Boundary

| Owner | Responsibilities |
| --- | --- |
| `src/composables/useProductCover.ts` | Single-cover state, file selection, MIME/size checks, upload lifecycle, errors, removal and picker operations |
| `src/views/Publish.vue` | Page markup/styles, DOM input reference, form fields/errors, draft policy, loading products, ownership checks and product submission |
| Existing API and backend | Upload requests, authentication, image validation/storage and product persistence |

The page passes its file-input reference, submission state and `toRef(errors, 'photos')` into the composable. It consumes the returned cover state and operations. `setCover()` lets draft restoration and existing-product loading initialize the cover without moving their policy into the upload module.

## Preserved Behavior and Guard Improvement

- One cover per product; JPEG, PNG and WebP; maximum `5 * 1024 * 1024` bytes, inclusive at client screening.
- Invalid selection does not send an upload request or replace the existing cover.
- The input resets after selection so the same rejected or failed file can be selected again.
- Failed uploads retain the previous cover and always clear the busy state.
- Upload/submission busy states block conflicting cover operations. The file-change handler now also checks busy state, preventing a second upload during an in-flight request.
- Existing-product asset URLs remain supported. Drafts retain their `/api/uploads/` image restriction.
- Sprint 2 title normalization, counting and validation remain unchanged.

The application changes are limited to Publish.vue and the new useProductCover.ts. Page behavior markup and scoped styles are preserved; two comments now describe the single-cover interface correctly. API routes, backend source and dependency versions are unchanged.
