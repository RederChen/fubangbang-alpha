# Fubangbang Sprint 1 Browser Acceptance and Runtime Screenshots

**Execution date:** November 21, 2026  
**Sprint period:** November 21–22, 2026  
**Result:** 10 acceptance checks passed; 14 runtime screenshots captured

The existing application was exercised with separate seller and buyer accounts in a real Microsoft Edge browser. Registration, product publication and retrieval, search, editing, transaction state changes, forum publication, and incorrect-password handling passed the checks below. The screenshots show the application as rendered during this execution.

## Execution method

Browser actions were performed through automation on behalf of the project user. This was a focused UI acceptance run with screenshots and recorded assertions. It is distinct from independent manual testing by another team member.

The application used a separate local SQLite database and upload directory. The two accounts, `Sprint1Seller` and `Sprint1Buyer`, had independent browser sessions. Their email addresses use the reserved `example.com` domain. The normal development database was not used for this run.

Screenshots were captured at a viewport of 440 by 956 CSS pixels with a device scale factor of 2, producing PNG files of 880 by 1912 pixels. Application text and layout were retained. No screenshot content was redrawn or replaced.

## Acceptance results

| Check | Action and expected outcome | Observed result | Evidence |
| --- | --- | --- | --- |
| AC-01 | Register and log in with two accounts; show the correct identity in each session | Passed. Separate account pages displayed the seller and buyer identities | [Seller](screenshots/01-seller-login.png), [buyer](screenshots/02-buyer-login.png) |
| AC-02 | Upload a cover and publish a product; save its title, cover, and price | Passed. The real backend saved the uploaded cover and initial price of CNY 25.50 | [Completed form](screenshots/03-product-form.png) |
| AC-03 | Refresh, log out, log in again, and reopen the product | Passed. The title, uploaded cover, and price remained available | [Product after login](screenshots/04-product-after-relogin.png) |
| AC-04 | Search for the item from the buyer account | Passed. Exactly the published test item was returned | [Search result](screenshots/05-buyer-search.png) |
| AC-05 | Change the price as the seller and retrieve it as the buyer | Passed. The price changed from CNY 25.50 to CNY 19.80, and the buyer saw the update after refresh | [Updated price](screenshots/06-buyer-updated-price.png) |
| AC-06 | Attempt to modify the seller product using the buyer account | Passed. An API-assisted request authenticated as the buyer returned HTTP 403; the price remained CNY 19.80 | [Structured execution record](evidence/step3-acceptance-results.json) |
| AC-07 | Open the seller contact dialog from the buyer account | Passed. The seller test email was displayed | [Contact dialog](screenshots/07-seller-contact.png) |
| AC-08 | Submit a booking request, accept it as the seller, and confirm completion | Passed. The request progressed from pending to accepted to completed; the product changed from available to reserved to sold | [Pending request](screenshots/08-buyer-request-pending.png), [accepted](screenshots/09-seller-accepted.png), [seller completed](screenshots/10-seller-completed.png), [buyer completed](screenshots/11-buyer-completed.png), [sold product](screenshots/12-product-sold.png) |
| AC-09 | Publish a forum post, refresh, and open it from the other account | Passed. The saved content remained available after refresh and was accessible to the buyer | [Saved forum post](screenshots/13-forum-after-refresh.png) |
| AC-10 | Submit an incorrect login password | Passed. An error appeared, the page remained on the login route, and no authentication token was created | [Login error](screenshots/14-invalid-login.png) |

No uncaught page errors were collected during the run. Transaction completion refers to the application state in the local test scenario. Reload and login checks establish retrieval within this run; they do not establish recovery after a server restart or backup restoration.

## Runtime figures

All 14 original PNG files and their English captions are listed in the [screenshot gallery](SCREENSHOTS.md). A concise selection for the sprint essay is:

- Product retrieval after logging in again: Figure 4.
- Buyer search result: Figure 5.
- Price update visible to the buyer: Figure 6.
- Completed transaction and sold status: Figures 10 and 12.
- Saved forum post: Figure 13.
- Incorrect-password feedback: Figure 14.

The [assignment instructions](https://bbs.csdn.net/topics/620611106) request current running images, GIFs, or videos. This run supplies still images; no video was recorded.

## Completion and next activity

Step 3 is complete for the recorded scenarios. The application source was not changed to obtain these results. The next activity is to review the findings and prepare the prioritized issue list for the following sprint work. PostgreSQL-specific behavior, other browsers, production deployment, and scenarios outside this checklist remain outside this acceptance run.
