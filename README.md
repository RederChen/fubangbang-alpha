# Fubangbang Sprint 1 Organized Archive

**Sprint period:** November 21–22, 2026  
**Archive prepared:** November 21, 2026  
**Chart update:** November 22, 2026  
**Archive status:** Organized and verified  
**Submission status:** Draft materials require the remaining publication items

This archive brings together the source handoff, completed verification records, runtime screenshots, confirmed issues, and next-sprint plan. The verification evidence records work performed on November 21. A current Sprint 1 task burn-up snapshot was added on November 22. The original folder has been preserved separately.

## Start here

1. Read the [Sprint 1 record index](docs/sprints/sprint-1/README.md) for the completed work.
2. Open the [screenshot gallery](docs/sprints/sprint-1/SCREENSHOTS.md) for the 16 running images.
3. Review the [English sprint essay draft](submission/SPRINT1-ESSAY-DRAFT.md).
4. Use the [submission checklist](submission/SUBMISSION-CHECKLIST.md) to finish the remaining items.
5. Consult the [source snapshot guide](source/README.md) to reproduce the application.

The [current burn-up chart and task register](docs/sprints/sprint-1/charts/BURN-UP-CHART.md) record 5 of 8 Sprint 1 tasks complete.

## Directory layout

```text
docs/sprints/sprint-1/
  README.md                         Record index and actual completion status
  01-environment-and-baseline.md    Source and local environment
  02-initial-automated-checks.md    Existing automated checks
  03-browser-acceptance.md          Two-account acceptance results
  04-issue-review.md                Confirmed issues and priorities
  TITLE-BOUNDARY-CHECKS.md           Focused title checks
  SPRINT2-TASK-PLAN.md               Planned validation fixes
  SCREENSHOTS.md                    English captions for 16 PNGs
  charts/                           Current burn-up, dataset, and scope notes
  screenshots/                      Original runtime images
  evidence/                         Logs, reports, results, and manifests
submission/
  SPRINT1-ESSAY-DRAFT.md             English draft based on recorded facts
  SUBMISSION-CHECKLIST.md           Remaining inputs and publishing checks
source/
  README.md                         Snapshot scope and startup guide
  CampusLink/                       263 original handoff files
ARCHIVE-MANIFEST.json                File hashes for this organized archive
```

## Verified results

| Area | Recorded result |
| --- | --- |
| Environment | Frontend startup and backend database connectivity confirmed |
| Frontend | Type check and build passed |
| Existing backend tests | 57 passed, 3 PostgreSQL-specific cases skipped |
| Focused browser acceptance | 10 checks passed and 14 screenshots captured |
| Boundary investigation | 17 API observations and 2 UI checks; 2 additional screenshots |
| Issue review | 2 runtime inconsistencies open; 1 maintenance improvement in the backlog |
| Current burn-up | 5 of 8 Sprint 1 tasks complete as of the November 22 interim snapshot |
| Source snapshot | 263 original files verified against their recorded SHA-256 hashes |

The boundary observations reproduce existing defects. Their completion does not mean that the defects have been fixed. Browser acceptance actions were automated. The project source has not been changed by this work.

## Organization decisions

The combined evidence package provided the complete record set. Its overlaps with the loose files and the two smaller evidence archives were compared in 54 file comparisons, with no content conflicts. The outdated top-level README was replaced by this index and the current sprint index. Duplicate archives and repeated evidence copies are omitted from this organized version.

The original source snapshot is included separately from authored sprint records. Runtime dependencies, generated databases, private environment settings, and local caches are excluded from the snapshot. The source manifest refers to this snapshot when it uses `<project-root>`.

The Step 3 structured results and execution output are under `docs/sprints/sprint-1/evidence/`. The screenshot paths stored inside the structured results are relative to the sprint record directory. All 16 PNG files retain their captured content.

## Remaining publication work

The initial Sprint 1 burn-up chart is included with its reconstructed scope disclosed. Update it after the remaining tasks are actually completed, review the final November 22 progress, and complete the deferred member work information before finalizing the essay. The essay has not been published, and the GitHub repository and submission links have not been added. No contribution record is included at this stage.

For later GitHub archiving, merge the `docs/` and `submission/` directories into the team's active repository. The `source/CampusLink/` directory is a reference snapshot; retaining it here does not prescribe a new layout for the working repository.
