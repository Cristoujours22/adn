# Add isolated browser acceptance for ADN workflows

Build a production-faithful Playwright harness backed by local Firebase emulators, then exercise the completed module, super-group, service-matching, persistence, and summary-scroll workflows without touching remote Firebase data.

## Objective

A maintainer can run deterministic desktop and mobile browser acceptance locally with no real credentials, no remote writes, and no production configuration changes.

## Scope

- Connect Firebase Auth, Firestore, and Storage to local emulators only behind an explicit CRA environment flag.
- Add isolated emulator configuration, permissive test-only rules, deterministic seed/reset utilities, and a disposable test user/project.
- Add Playwright configuration and reusable authenticated fixtures.
- Cover module configuration, super-group creation/collapse/ungroup, service aliases and non-overlapping counts, persistence/reload, keyboard focus, and summary scrolling at desktop and mobile viewports.
- Run browser acceptance and correct only defects caused by the completed ADN feature branch.

## Non-goals

- Production Firebase writes or credentials.
- Replacing focused Jest/RTL suites.
- Deploying emulator rules or E2E artifacts.
- Cross-browser matrix beyond the initial Chromium acceptance lane.
- Push, pull request creation, merge, or deployment.

## Constraints

- Worktree: `/mnt/c/Users/Cristian/Desktop/adn-worktrees/ajustes-adn`.
- Branch: `feature/ajustes-adn`.
- Production Firebase behavior must remain unchanged unless `REACT_APP_USE_FIREBASE_EMULATORS=true` is set.
- Browser runs must reset emulator state and use generated non-secret credentials.
- Test artifacts and reports must remain ignored or disposable.
- Technical artifacts remain in English; assertions may target existing Spanish UI copy.
- Behavior changes use observed browser RED/GREEN evidence; harness-only configuration receives structural and command verification.

## Delivery forecast

| Task | Forecast A+D | Route | Trigger |
|---|---:|---|---|
| E2E-1 | 420 | delegated writer | package/config/source integration across multiple files |
| E2E-2 | 600 | delegated writer | fixtures plus multi-workflow browser specs |
| E2E-3 | 240 | delegated writer if needed | browser-discovered product corrections |
| **Total** | **1,260** |  |  |

## Tasks

### E2E-1 — Establish the isolated emulator and Playwright harness

- [x] Add compatible Playwright and Firebase CLI development dependencies and scripts.
- [x] Add test-only Firebase emulator configuration and rules.
- [x] Connect Auth, Firestore, and Storage only under the explicit E2E flag.
- [x] Add deterministic emulator reset/seed support with a disposable user and project.
- [x] Add Playwright configuration, disposable artifacts, and a minimal authenticated smoke test.

Acceptance:
- The smoke test signs in through the real login UI against Auth Emulator.
- Firestore reads/writes remain inside the emulator project.
- A run requires no human credentials and does not contact production Firebase services.
- Normal `npm start` and production build retain existing Firebase configuration.

Checks:
- Focused unit/structural checks for emulator gating where practical.
- Playwright smoke test in Chromium.
- Production build without the emulator flag.
- `git diff --check`.

Planned commit: `test(e2e): add isolated Firebase browser harness`

### E2E-2 — Cover completed ADN workflows in Chromium

- [x] Seed deterministic rows, module configuration, services, and a saved project.
- [x] Verify module configuration preview, conflict handling, and persistence.
- [x] Verify complete-module super-group preview, creation, collapse totals, reload, and ungrouping.
- [x] Verify alias collision feedback and non-overlapping counts for `sencha curva + curva`, `curvado`, `naranja`, and `2Lcurva`.
- [x] Verify summary focus and native scrolling with many positive services.
- [x] Run desktop and mobile viewport lanes with keyboard-focused assertions.

Acceptance:
- Tests exercise user-visible controls rather than internal React state.
- Reload preserves module settings, aliases, super-group membership/order, rows, and totals.
- Collapse state is treated as session-local while totals remain stable.
- Desktop and mobile Chromium runs are deterministic from a clean emulator state.

Checks:
- Playwright acceptance suite.
- Existing focused Jest/RTL suites for touched domains.
- Production build.
- `git diff --check`.

Planned commit: `test(e2e): cover ADN browser workflows`

### E2E-3 — Resolve browser-discovered regressions

- [x] Classify every browser failure as harness, environment, pre-existing, or candidate-caused.
- [x] Add the narrowest deterministic regression test before each candidate-caused correction.
- [x] Re-run affected focused suites and the complete browser acceptance lane.
- [x] Record skipped, environment-blocked, and browser-only boundaries honestly.

Acceptance:
- No candidate-caused blocker remains in the tested Chromium lane.
- Harness failures are not disguised as product fixes.
- Any source correction is committed as its own reviewable work unit.

Checks:
- Complete Playwright acceptance lane.
- Relevant Jest/RTL regression suites.
- Production build.
- `git diff --check`.

Planned commit if needed: `fix(e2e): resolve ADN browser regressions`

## Progress

- Current task: Complete.
- Completed tasks: E2E-1, E2E-2, E2E-3 (no product correction required).
- E2E-1 commit: `a31916f` (`test(e2e): add isolated Firebase browser harness`).
- E2E-2 commit: `63701ae` (`test(e2e): cover ADN browser workflows`).
- Browser capability discovery found no existing E2E framework, emulator configuration, local auth bypass, or seeded account.
- The user selected an isolated E2E environment instead of testing against remote Firebase.

## Verification evidence

E2E-1 writer evidence (partial):

- Added pinned `@playwright/test` 1.58.2 and `firebase-tools` 15.33.0, E2E scripts, isolated emulator configuration/rules, deterministic Auth/Firestore reset and seed, Playwright setup/teardown and login smoke, exact-true emulator gating, and ignored disposable artifacts.
- No behavioral RED existed because the repository had no prior browser lane. Focused emulator-gating GREEN: 1 CRA/Jest suite, 2 tests passed; JSON/Node structural checks and `git diff --check` passed.
- Firebase emulator startup succeeded in the writer's first container attempt, but Playwright terminated with SIGBUS/exit 135 after starting one worker; the production build was not reached.
- Independent incident diagnosis found high-confidence Docker Desktop/WSL storage failure: the Docker CLI itself exits with SIGBUS, its read-only `/dev/loop0` backing reports I/O errors, and Windows Docker commands time out before container startup. Host Node/npm and the project mount remain readable.
- Clean-container smoke and production build remain unverified. The authorized Docker restart did not recover the daemon.
- Read-only Windows/WSL diagnosis found the root cause with high confidence: `C:` has only 0.272 GiB free, VHDMP recorded a disk-full write failure against the 37.8 GiB `docker_data.vhdx`, and WSL now holds stale attachment state. The VHD still exists; no formatting, reset, repair, detach, or recreation was performed.
- The user freed disk space; `C:` now has 68.72 GiB available. Docker Desktop 4.94.0 / Engine 29.8.2, both WSL2 distributions, a disposable container, and a Chromium data-page probe all passed without residual VHD errors.
- Production CSP does not allow localhost emulator ports. `bypassCSP: true` is now confined to Playwright configuration; production `public/index.html` remains unchanged.
- The lockfile was regenerated reproducibly from the committed baseline with Node 20.19.0/npm 10.8.2 and exact `@playwright/test@1.58.2` plus `firebase-tools@15.33.0`. Its 15,829 A+D reflects 475 added package entries and 10 unavoidable transitive re-resolutions.
- Writer verification after Docker recovery: isolated login smoke passed against demo project `demo-adn-e2e` and reached `/menu`; focused gating Jest passed 1 suite/2 tests; production build passed with emulator variables unset; `git diff --check` passed.
- Independent clean-container verification repeated `npm ci`, 1 Jest suite/2 tests, the Chromium login smoke, production build with emulator variables unset, and `git diff --check`; all passed. No remote Firebase endpoint was used and no production-safety blocker remained.
- Final non-lock harness size is 474 A+D. The required dependency lock graph is 15,829 A+D; `npm ci` reports 120 dependency audit findings and deprecated transitive packages, while build reports deprecation and stale Browserslist warnings.
- Work-unit commit `a31916f` contains 11,621 additions + 4,684 deletions = 16,305 A+D, dominated by the generated dependency lock graph.
- Native INSPECT excluded the unintended untracked `.codegraph/` cache and offered START; START created no lineage and performed no mutation because the Windows-mounted Git common directory lacks required POSIX permission semantics (`candidate-owner-parent-chmod-ineffective`).
- Reassessment with `nativeReviewOutcome=unavailable` remained unassessable because the read-only assessment route cannot declare untracked scope. The risk-gated plan therefore requires independent verification, which the clean-container verifier already completed successfully. The native candidate remains unconsumed.

E2E-2 writer evidence (partial):

- Added deterministic project seed `adn-e2e-project` with one tab, seven stable rows, complete `D1-005`/`D2-010` modules, 15 services, 14 positive overflow entries, and details covering `sencha curva + curva`, `curvado`, `naranja`, and `2Lcurva`.
- Added reusable per-test reset/authentication fixtures plus desktop 1280×800 and mobile 390×844 Chromium projects.
- Browser lane: 8/8 tests passed (desktop 4/4, mobile 4/4), including module settings, super-group preview/collapse/reload/ungroup, alias collisions and counts, summary focus/scroll, responsive behavior, and persistence.
- Focused regression lane: 11 suites/64 tests passed. Production build, syntax checks, endpoint isolation, and `git diff --check` passed.
- Current scoped diff is 480 A+D.
- Independent clean-container verification repeated the complete lane: desktop 4/4, mobile 4/4, focused Jest 13 suites/69 tests, production build, endpoint isolation, and `git diff --check` all passed. Spot review found no concrete blocker.
- Work-unit commit `63701ae` contains 498 additions + 13 deletions = 511 A+D.
- Native assessment from `a31916f`: medium risk, 511 committed changed lines, `reviewDue=true`, reason `slice_budget_reached`.
- Native START created no lineage and performed no mutation because the Windows-mounted Git common directory lacks required POSIX permission semantics (`candidate-owner-parent-chmod-ineffective`).
- Reassessment recorded `nativeReviewOutcome=unavailable`; the risk-gated plan accepted writer verification for the large writer profile and required no additional verifier. The independent clean-container verifier had already passed the full lane; the native candidate remains unconsumed.

E2E-3 closure:

- Initial browser failures were harness-only timing, wide-table interaction, scroll-position, and earlier Docker storage incidents; each was corrected in the harness or environment and the full lane reran green.
- No candidate-caused application regression was found, so no application source correction or additional regression commit was required.
- Tested boundary: Chromium desktop/mobile against local Firebase emulators. Firefox, WebKit, real Firebase, deployment, and live production data remain outside scope.

## Next step

The isolated browser acceptance initiative is complete. Push, pull-request creation, merge, deployment, and any broader cross-browser matrix remain separate user decisions.
