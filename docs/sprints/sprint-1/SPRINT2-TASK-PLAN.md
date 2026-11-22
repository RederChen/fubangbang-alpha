# Fubangbang Sprint 2 Product Title Validation Plan

**Planned dates:** November 23–24, 2026  
**Planning date:** November 21, 2026  
**Status:** Planned; implementation has not started

Sprint 2 will address S1-01 and S1-02 from the [Sprint 1 issue review](04-issue-review.md). Its deliverable is consistent product title validation with regression evidence. The publishing-page extraction, S1-03, remains in the Sprint 3 backlog.

## Proposed title contract

The proposed rule preserves the current form limit:

- Trim surrounding whitespace before validating or storing a supplied title.
- Require a nonempty title with a length of 1 to 30.
- Use the same length-counting convention in the UI and API. Retaining the current browser behavior means counting UTF-16 units; the confirmed boundary examples use ASCII.
- Apply the same rule when creating a product and when editing its title.
- Preserve the existing title when an update omits that field.
- Return the project's standard validation response for an invalid supplied title.

This contract is the proposed fix target. Agree it before changing the implementation. Historical titles longer than the new limit require an explicit editing decision; do not silently truncate stored records as part of this small validation change.

## Tasks and completion criteria

| Task | Work | Completion criterion | Estimated effort |
| --- | --- | --- | --- |
| S2-01 | Confirm and document the title contract | Creation, editing, trimming, length counting, and omitted-field behavior are explicit | 0.5 hour |
| S2-02 | Implement consistent backend title validation and check frontend alignment | The two confirmed inconsistencies are resolved; the UI and API follow the same contract | 1.5–2 hours |
| S2-03 | Add regression cases for the confirmed boundaries | Tests cover valid limits, rejected inputs, trimming, and preservation during a price-only update | 1–1.5 hours |
| S2-04 | Recheck the affected browser flow and existing checks; record results | Publishing, editing, retrieval, and error messages work; actual check results and screenshots are retained | 1–2 hours |

The total estimate is approximately 4–6 hours over two days, with additional time available for troubleshooting. These are planning estimates, not completed hours. Assign named implementers and reviewers when the team schedules the work; individual contributions are not inferred here.

## Verification checklist

- A one-unit title is accepted by creation and editing.
- A 30-unit title is accepted by creation and editing.
- A 31-unit title is rejected according to the agreed contract, and the stored product is not changed by a rejected update.
- An empty or whitespace-only title is rejected by both operations.
- Surrounding whitespace is handled identically by both operations.
- A price-only update preserves the title.
- The frontend input counter, submit validation, and API length rule agree.
- Publishing a valid product, refreshing it, and editing its price still work.
- Add a supplementary Unicode example if the implementation changes or introduces shared length-counting logic.

The focused reproduction cases from Sprint 1 should become regression tests with assertions against the agreed behavior. Their current accepted-invalid examples must not be retained as the expected fixed behavior.

## Two day sequence

On November 23, confirm the contract and implement the shared rule in a focused development branch. Keep the change limited to title handling and its directly affected UI behavior.

On November 24, complete the regression checks, repeat the affected browser workflow, and record the real results. Link the relevant Issue records and commits, and prepare the Sprint 2 essay evidence. A documentation commit from Sprint 1 remains documentation work; new implementation commits should describe the actual validation changes.

## Definition of done

S1-01 and S1-02 can be closed when the agreed contract is implemented, regression checks pass, the affected browser flow works, and the implementation and verification evidence are linked. Do not close them based on documentation alone or pre-fill future pass counts.
