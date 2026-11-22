# Fubangbang Sprint 1 Verification and Issue Records

**Sprint period:** November 21–22, 2026  
**Verification records completed:** November 21, 2026  
**Burn-up snapshot added:** November 22, 2026 (current: 5/8 tasks)

These records document the reproduction, verification, and issue review of the existing Fubangbang handoff version. Steps 1 through 4 are complete for the recorded local scope. Two runtime inconsistencies remain open for Sprint 2, and one maintenance improvement is assigned to the later backlog. Implementation has not started. An English essay draft is available; its publication inputs remain on the submission checklist.

| Record | Contents |
| --- | --- |
| [Step 1](01-environment-and-baseline.md) | Source baseline, environment, installation, startup, and database connection |
| [Step 2](02-initial-automated-checks.md) | Type check, build, backend test results, and browser automation results |
| [Step 3](03-browser-acceptance.md) | Ten focused acceptance checks with two accounts and fourteen runtime screenshots |
| [Step 4](04-issue-review.md) | Two reproduced inconsistencies, one maintenance improvement, and their priorities |
| [Title boundary checks](TITLE-BOUNDARY-CHECKS.md) | Seventeen API observations and two browser checks with additional screenshots |
| [Current burn-up](charts/BURN-UP-CHART.md) | English chart, eight-task register, and scope reconstruction notes; three tasks remain pending |
| [Sprint 2 plan](SPRINT2-TASK-PLAN.md) | Proposed title contract, implementation tasks, and acceptance criteria |

The [screenshot gallery](SCREENSHOTS.md) contains English captions for all 16 original application captures. The [Step 3 execution log](evidence/step3-acceptance-execution.txt) and [structured results](evidence/step3-acceptance-results.json) are stored under `evidence/`.

Step 4 includes two additional screenshots linked from its boundary check record. Its API observations are pre-fix reproduction evidence, not successful verification of the proposed fix. Local issue IDs have not been created as GitHub Issues.

The [essay draft](../../../submission/SPRINT1-ESSAY-DRAFT.md) brings the recorded work together. The [submission checklist](../../../submission/SUBMISSION-CHECKLIST.md) identifies the remaining final chart update, actual closing progress, and publishing inputs. Member work information is deferred; no contribution record has been created.

The `evidence/` directory contains copies of the available logs, the backend JUnit report, and file manifest records. Personal machine paths are replaced with `<project-root>`, and the JUnit hostname is omitted. Test outcomes are preserved. Complete standalone frontend type-check and build logs were not retained during the original execution.

## Repository placement

Keep this directory under `docs/sprints/sprint-1/` in the team's active project repository. Preserve the directory structure so the links between records and evidence continue to work. If frontend and backend code are maintained separately, use one repository as the primary location for this combined sprint record and link to it from the other.

A suitable documentation commit message is:

```text
docs: record sprint 1 environment and initial verification
```

This commit records documentation and verification evidence. The application baseline should be linked to its actual source commit once that correspondence is confirmed. Use the resulting record and commit links in the sprint essay.
