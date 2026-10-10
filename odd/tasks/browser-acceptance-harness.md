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

- [ ] Seed deterministic rows, module configuration, services, and a saved project.
- [ ] Verify module configuration preview, conflict handling, and persistence.
- [ ] Verify complete-module super-group preview, creation, collapse totals, reload, and ungrouping.
- [ ] Verify alias collision feedback and non-overlapping counts for `sencha curva + curva`, `curvado`, `naranja`, and `2Lcurva`.
- [ ] Verify summary focus and native scrolling with many positive services.
- [ ] Run desktop and mobile viewport lanes with keyboard-focused assertions.

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

- [ ] Classify every browser failure as harness, environment, pre-existing, or candidate-caused.
- [ ] Add the narrowest deterministic regression test before each candidate-caused correction.
- [ ] Re-run affected focused suites and the complete browser acceptance lane.
- [ ] Record skipped, environment-blocked, and browser-only boundaries honestly.

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

- Current task: E2E-2 — Cover completed ADN workflows in Chromium.
- Completed tasks: E2E-1.
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

## Next step

Commit E2E-1 as a reviewable work unit, record native-review outcome, then seed and automate the completed ADN desktop/mobile browser workflows in E2E-2.
