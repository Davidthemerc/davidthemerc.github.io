# Blake Breacher Teaches Typing v1.0.2 — Maintenance Release

## v1.0.2 — HyperSoft 98 Navigation Geometry Hotfix

Blake Breacher Teaches Typing 1.0.2 corrects a legacy desktop-navigation margin that made the HyperSoft 98 Arcade button render slightly shorter than its Timed Tests peer. Grouped navigation buttons now share identical cell geometry. Training content, save schema, word banks, scoring behavior, and the v1.0.1 evidence-spacing fix are unchanged.

### v1.0.2 maintenance fixes
- Removed the obsolete desktop hierarchy margin that affected only the Arcade peer button in the Test & Play bank.
- Added an explicit equal-geometry rule so every HyperSoft 98 grouped navigation button stretches to the same row height.
- Added a HyperSoft navigation geometry regression audit.
- Fixed Technique Coach and Daily Plan weak-key evidence spacing so each key/accuracy pair reads as a distinct unit.
- Scoped evidence-card typography to direct children so generic card rules no longer override nested key-metric glyph/value layout.
- Increased horizontal separation between adjacent key metrics while preserving compact wrapping on narrow screens.
- Added a dedicated Evidence Metrics QA gate to prevent regression in both evidence surfaces.

- Maintains canonical runtime/build metadata at **1.0.2 / Stable Release**.
- Runtime-generated exports now use the canonical `APP_VERSION` constant instead of a duplicated hardcoded version string.
- Retained the final HyperSoft 98 fixes: centered button contents, single-label Arcade button, compact colored category headers, and the exact single-space footer text “Typing Excellence Since 1998”.
- Added a stable-release QA gate and corrected the final-preflight centering assertion so it is evaluated before a pass can be reported.
- Revalidated clean install, legacy upgrades, backup/restore, accessibility, responsive layout, navigation, content integrity, word-bank integrity, documentation/recovery, system torture, and packaging.
- No save-schema bump is required; v0.16/v0.17 learner data remains compatible.

---

## v0.17.8.1 — Final Preflight RC

- Fixed the HyperSoft 98 footer spacing so “Typing Excellence Since 1998” cannot visually collapse.
- Revalidated the colored compact HyperSoft 98 navigation and retired Arcade overlay selectors.
- Repaired canonical APP_VERSION metadata so runtime reports/exports match the visible release.
- Re-ran clean-install, upgrade, recovery, responsive, navigation, content, accessibility, and release gates.

## v0.17.6.2 — HyperSoft 98 Menu & Audio Hotfix

- Rebuilt HyperSoft 98 navigation groups to match the approved dark, color-coded category-bar reference while preserving the blue-rail layout.
- Removed obsolete per-button group-label metadata that could paint duplicate labels such as ARCADE over the Arcade button.
- Selecting Low, Normal, or High sound level now automatically enables Sound Effects, eliminating the contradictory “Normal but OFF” save state.
- Added live sound-state messaging around the toggle and sound test.

## v0.17.8.1 — Final Preflight RC 2 / Button Centering Hotfix

- Feature freeze remains in effect: release-blocking corrections only.
- Added a final aggregate QA gate that treats every prior audit as a release blocker.
- Revalidated clean install, legacy upgrade, backup/restore, all 21 modules, responsive layouts, accessibility, documentation, content integrity, and the finalized word banks.
- Added explicit checks for accidental debugger/TODO/FIXME development artifacts and canonical release metadata.

This release is a feature-frozen clean-install, upgrade, recovery, and packaging validation pass. It verifies fresh-profile bootstrap behavior, v0.16/v0.17-era profile normalization, legacy flat-profile imports, duplicate profile repair, corrupt-storage recovery safeguards, backup rollback protections, and all three release formats. No training targets or word-bank content were changed.

## v0.17.8.1 — Practical Word Bank Finalization

- Expanded the shared vocabulary banks to a deliberately moderate final size rather than pushing toward an arbitrary maximum.
- Added common, useful typing vocabulary first: everyday practice language for General, real administrative/business terms for Office, and recognizable computing/IT terms for Technical.
- Corrected two low-quality legacy tokens (`absense` and `multfactor`) and normalized a limited set of obvious compound terms so drills read more naturally.
- Tightened the Word Bank Audit: every bank now has a higher minimum size, at least 60 usable words in every difficulty-length band, a stricter compound-token ratio, runtime Smart Practice selection checks, and practical-vocabulary spot checks.
- No scoring, save format, lesson targets, or gameplay rules changed. This is intended to leave the shared word bank in a comfortable release-candidate state.

## v0.17.8.1 — Word Bank Expansion & Audit

- Re-audited the three shared vocabulary families used by lessons, Smart Practice, Practice Builder, Road Race, Shark Attack, and other generated-word activities.
- Expanded General from 473 to 583 unique entries, Office from 413 to 591, and Technical from 411 to 635.
- Added more ordinary short/medium General vocabulary while substantially broadening real office-administration and technical/computing terminology for long-session variety.
- Preserved the existing word-family identities and did not change WPM/accuracy grading, difficulty scaling, or save data.
- Added a dedicated Word Bank QA audit covering uniqueness, safe token format, word-length coverage for every difficulty, hyphenated-token ratios, Smart Practice geometry pools, and runtime word selection.
- This is a release-candidate content polish update, not a new gameplay feature.

## v0.17.8.1 — Documentation, Help & Recovery

- Expanded F1/Help into a compact Help Center while preserving context-sensitive module guidance.
- Added Getting Started, Returning After a Break, Backup & Recovery, and complete Module Directory references.
- Added direct Help Center actions into the relevant modules without changing learner data or scores.
- Documented the exact difference between current-profile export/import and full-backup restore, including the destructive full-restore warning.
- Added explicit guidance for returning learners: continue, reassess, use Daily Plan, or review Progress/Technique Coach rather than starting over blindly.
- Added a Documentation & Recovery QA gate to keep all 21 modules represented and recovery warnings intact.

# Blake Breacher Teaches Typing v0.17.8.1 — Content Integrity & Final Balance

## v0.17.8.1 — Content Integrity & Final Balance
- Audited the complete 14-lesson target/workload curve, all nine Smart Practice drills, and all six 10-Key Academy protocols.
- Preserved the established instructional targets after the audit: no artificial difficulty inflation was introduced during release-candidate balance work.
- Added a dedicated content-integrity QA gate for curriculum counts, target bands, workload bands, 10-Key progression, achievement ladders, and base-vocabulary uniqueness.
- Removed a duplicate eight-word block from the General base vocabulary so long-session selection starts from a cleaner source pool.
- Revalidated the achievement ladder from first-session milestones through full curriculum, eight-game completion, long-term practice, and high-speed goals.
- Content remains feature-frozen: this release is about integrity, variety, attainability, and regression prevention rather than new modes.

## v0.17.8.1 — RC1 Corrections & Consistency Pass

- Corrected the stale About dialog release identity that still reported the old v0.16.4 Keyboard & Accessibility Pass.
- Added canonical `APP_VERSION` / `RELEASE_NAME` constants for runtime-generated reports, certificates, exports, diagnostics, and compatibility messages so future RC version bumps are less likely to drift.
- Standardized result-dialog actions by activity: lessons say **Repeat Lesson**, assessment says **Retake Assessment**, specialty modules return to their actual module instead of misleadingly saying **Arcade**, and timed tests use **Retake Timed Test / Timed Tests**.
- Added `qa_rc1_consistency.py` to prevent stale About-version text and result-action regressions.
- Preserves the v0.17.0 feature freeze: this release is corrective/consistency work, not a new feature expansion.

This release freezes the major feature set and shifts development into release-candidate hardening. The complete 21-module suite remains intact; work in this branch is now focused on consistency, reliability, build integrity, save compatibility, accessibility, responsive behavior, and clear presentation of training evidence.

## RC1 highlights
- Restored the modular distribution to a true `index.html` + external CSS + ES-module source layout; the prior packaging pipeline had accidentally accumulated an inlined standalone-style index.
- Repaired and hardened `tools/build_release.py`; Direct, Standalone, and Modular outputs are now generated and validated from the same canonical source tree.
- Added a Release Candidate QA gate covering build-script compilation, modular-package integrity, version consistency, and key-metric presentation.
- Reworked weak-key and trouble-pair displays so the actual key/pair is visually distinct from its percentage. This applies to Placement Assessment Practice Focus, lesson adaptive focus, Technique Coach, Smart Practice transition focus, Daily Plan evidence, Accuracy Clinic, results, progress summaries, and reports.
- Added structured weak-key snapshots to new Placement Assessment records while retaining compatibility with older saved assessment strings, including punctuation keys such as comma, period, hyphen, quotation mark, and number-row keys.
- Existing v0.16 save data remains compatible; no save-schema bump was required.

## v0.17.8.1 — HyperSoft 98 Learner Header Centering

- Centers the HyperSoft wordmark in the blue navigation rail.
- Centers the portrait + Welcome back learner cluster as one balanced unit.
- Preserves the blue-rail navigation, compact-height behavior, and v0.16.15 adaptive-width work.


## v0.17.8.1 — Standard Theme Adaptive Width + Two-Row Launcher

- Standard/non-HyperSoft-98 themes now expand much closer to the available desktop width before leaving unused side margins.
- On wide displays the primary launcher uses 11 columns, keeping the 21-module navigation to two rows rather than three.
- Very wide displays can use 12 columns while preserving readable button labels and icon spacing.
- Standard-theme module screens are allowed to grow wider as the shell grows instead of remaining confined to the older narrow content width.
- HyperSoft 98 is explicitly excluded from this change and retains the blue-rail layout from v0.17.8.1.

## v0.17.8.1 — HyperSoft 98 Blue-Rail Micro Polish

- Preserves the distinctive blue HyperSoft 98 sidebar instead of converting it into the default-theme launcher.
- Widens the rail on widescreen and ultrawide displays so two-column module banks have more room and labels wrap less.
- Expands the HyperSoft 98 workspace/content canvas at large resolutions.
- Adds extra breathing room between the Home accent stripe and the HyperSoft/Blake branding.
- Slightly relaxes grouped-navigation spacing and button sizing on large screens while retaining compact height-aware behavior.

## v0.17.8.1 — Home Dashboard Rework

The Home screen now behaves like a compact workstation dashboard. Wide displays receive a true multi-column launcher, Blake's portrait is reduced to a small identity card, and Module Explorer consumes horizontal workspace before adding vertical rows.

# Blake Breacher Teaches Typing v0.17.8.1

## v0.15.9 — Reliability & QA Pass

Adds a selectable multimedia layer to the v0.13.3 arcade-visual build while preserving all typing, profile, lesson, arcade, tournament, achievement, report, and adaptive-training systems.

### Highlights
- Low / Standard / Full Multimedia setting per profile.
- Locally synthesized retro UI chirps and completion/achievement fanfares; no audio files or network dependencies.
- Full Multimedia enables occasional Blake desktop-style notifications with Compliance-safe messaging.
- New About HyperSoft dialog, credits, and rotating Did You Know? tips.
- Existing startup/loading interludes remain and now fit the expanded multimedia presentation.
- Reduced-motion behavior remains respected.

Run through a local web server for this modular ES-module edition. For double-click use, choose the Direct Edition.


## v0.15.9 Reliability & QA Pass
- Fixed lesson startup regression caused by arcade-only variables leaking into lesson initialization.
- Restored per-game arcade console identity that was lost during the v0.13.6 emergency lesson hotfix.
- Corrected Check-Out Time and Chameleon Picnic mode-ID comparisons in the arcade input hint.
- Added duplicate-finish protection to prevent double scores/tournament rounds from simultaneous frame/input completion.
- HUD timers now defensively replace any prior interval.
- Navigation clears pending activity state, loading state, and transient Blake notifications.
- Revalidated all eight game startup/exit paths and local-file distributions.


## v0.15.0 — Typing Assessment & Placement

- Added a first-class **Assessment** module to main navigation.
- New three-phase sustained typing diagnostic measures WPM, first-attempt accuracy, keyboard range, rhythm consistency, long hesitations, weak keys, and troublesome letter pairs.
- HyperSoft now recommends one of four starting paths: Keyboard Trainee, Formal Lessons, Formal Lessons + Smart Practice, or Advanced Targeted Work.
- Assessment results are stored per profile, shown in Assessment history and Scoreboard, included in backup/export data, and surfaced in the printable Typing Assessment Report.
- Placement recommendations are advisory only; no module is locked or skipped automatically.

## v0.15.1 — Technique Coach

- Added Technique Coach as a first-class main module between Assessment and Lessons.
- Technique Coach interprets six dimensions: accuracy discipline, rhythm stability, correction behavior, Shift/punctuation fluency, key-transition control, and speed sustainability.
- Combines the latest Placement Assessment with recent sustained training, key statistics, trouble-pair statistics, and Keyboard Trainee progress.
- Adds confidence-aware coaching so missing data is shown as Collecting data rather than treated as failure.
- Generates a three-step technique plan with direct links into the most relevant lesson, Smart Practice drill, Keyboard Trainee, or Assessment.
- Adds an Evidence Desk for established weak keys, trouble pairs, and current placement.
- Adds Technique Coach summary information to the printable Typing Assessment Report.


## v0.15.2 — Custom Practice Builder

- Added **Practice Builder** as a first-class main module.
- Build timed 1–10 minute sessions using balanced coverage, stored weak keys, stored trouble pairs, or user-entered keys/pairs.
- Choose General, Office, Technical, or the active profile's default vocabulary family.
- Configure minimum/maximum word length, capitals, punctuation, number-row material, target WPM, and target accuracy.
- Added quick configurations for Weak Keys, Trouble Pairs, Punctuation, Number Row, Accuracy Clinic, and Full Keyboard Mix.
- Added up to eight **profile-specific saved presets**, included automatically in profile exports and full backups.
- Custom Practice contributes to adaptive key/pair statistics and Technique Coach evidence while remaining separate from formal curriculum completion.
- Extended the shared typing workstation with true **timed-session support**. The ribbon can now end on elapsed time instead of a fixed token count and expands its token pool if necessary.
- Scoreboard/reports distinguish **Custom Practice** from preset Smart Practice.


## v0.15.3 — Real-World Typing Lab

- Added **Real-World Lab** as a first-class main module between Practice Builder and Arcade.
- Six applied typing simulations: Email Desk, Memo & Notes, Contact & Address Entry, Files/Paths/Web, Forms & Numeric Records, and Document Transcription.
- Every lab contains three fictional structured records and requires exact capitalization, punctuation, numbers, symbols, spacing, and line breaks.
- Added Enter-key/newline handling to the applied typing workstation.
- Real-World Lab scales its WPM/accuracy standard from the learner's selected difficulty.
- Added per-lab attempts, targets met, best WPM, best accuracy, and recent applied-session history.
- Real-World sessions feed weak-key, trouble-pair, Progress, Scoreboard, achievement-session, and Technique Coach analytics while staying separate from formal curriculum completion.
- Added dedicated Real-World result commentary, safety/compliance copy, context help, Guided Link notes, and HyperSoft 98 presentation styling.


## v0.15.4 — Accuracy Clinic

- Added **Accuracy Clinic** as a first-class main module between Real-World Lab and Arcade.
- Five precision protocols: Clean Slate, Controlled Pace, Punctuation Precision, Weakness Repair, and Near-Perfect Endurance.
- Added strict 98–100% first-attempt accuracy gates, difficulty-scaled speed standards, clean-streak tracking, correction counts, pace alerts, and exact-entry error handling.
- Added adaptive Weakness Repair passages built from the active profile's established weak keys and trouble pairs.
- Added post-session substitution/error-pattern review with direct remediation links to Practice Builder, Smart Practice, and Placement Assessment.
- Added a profile-level Precision Index, gate-clear history, best clean streak, per-protocol records, and recent Accuracy Clinic history.
- Accuracy Clinic feeds weak-key, pair, Progress, Scoreboard, achievement-session, and Technique Coach analytics while remaining separate from formal curriculum completion.
- Fixed a v0.15.2/v0.15.3 event-binding regression where Practice Builder listeners were accidentally nested inside the Keyboard Trainee click handler, causing duplicate handlers after Trainee interactions and potentially leaving Practice Builder inert before Trainee was opened.


## v0.15.5 — 10-Key Academy

- Added **10-Key Academy** as a first-class main module.
- Six numeric-training protocols: Keypad Home Position, Vertical Columns, Zero & Decimal, Enter-Key Rhythm, Accounting Entry, and a two-minute 10-Key Proficiency Test.
- Added a live numeric-keypad diagram with recommended finger guidance and current-key highlighting.
- Numeric performance is measured in **KPH (keystrokes per hour)** rather than mixing numeric data-entry speed into prose WPM.
- Advanced protocols track the percentage of accepted input that came from actual `Numpad*` keys. Top-row digits remain usable for accessibility, but strict protocols require 90%+ Numpad use to clear the full target.
- Added profile-specific per-key numeric reliability, protocol history, best KPH, best accuracy, Numpad-use history, and Academy Level.
- The Proficiency Test runs for two minutes and scores KPH, accuracy, and Numpad discipline.
- 10-Key results are stored separately from alphabetic weak-key statistics and do not alter the 14-lesson curriculum.


## v0.15.6 — Punctuation & Business Writing Lab

- Added **Punctuation Lab** as a first-class main module.
- Six protocols: Shift & Capitals, Quotes & Apostrophes, Business Punctuation, Slashes/Email/Web, Numbers & Shift Symbols, and Business Writing Mastery.
- Each protocol contains three exact-entry exercises with difficulty-scaled WPM targets and strict 98–99% accuracy gates.
- Added separate **Symbol Accuracy** tracking so normal alphabetic accuracy cannot hide problems with capitals, punctuation, Shift combinations, paths, or business symbols.
- Added punctuation-family history for capitals, quotes/apostrophes, sentence marks, parentheses/brackets, web/path symbols, business symbols, and number-row work.
- Added substitution review such as expected-vs-typed symbol patterns, plus dedicated protocol history and target records.
- Punctuation Lab feeds the existing adaptive weak-key/trouble-pair system and Technique Coach while remaining separate from formal curriculum completion.
- Added a retro business-document workstation with exact Enter/newline handling and contextual punctuation coaching.


## v0.15.7 — Timed Certification Tests

- Added **Timed Tests** as a first-class main module with 1-, 3-, 5-, and 10-minute passage tests.
- Added selectable General Prose, Business Prose, and Technical Prose passage families.
- Added Learning, General Office, Professional, Advanced, and custom training standards.
- Timed results report **Gross WPM**, **Adjusted WPM**, first-attempt accuracy, raw errors, corrections, characters entered, and pass/completion status.
- Adjusted WPM is defined as Gross WPM minus raw errors per minute; the selected standard requires both Adjusted WPM and accuracy.
- Timers begin on the first valid typing key rather than while the learner is reading the screen.
- Added per-duration personal records and recent timed-test history.
- Added printable **Timed Test Result Sheets** under Reports with scoring-method details and a clear local-training/non-employment disclaimer.
- Timed-test typing evidence contributes to the existing adaptive key/pair and Technique Coach systems.
- 10-Key KPH remains separate from prose WPM/certification analytics.


## v0.15.8 — Daily Training Plan / Adaptive Program

- Added **Daily Plan** as a first-class main module with 10-, 20-, and 30-minute guided sessions.
- Plan generation combines Placement Assessment, Technique Coach metrics, unfinished Keyboard Trainee work, formal curriculum progress, weak keys, trouble pairs, Accuracy Clinic, punctuation-family accuracy, 10-Key status, Real-World Lab use, and Timed Test recency.
- High-priority weaknesses are scheduled before generic speed work; longer plans add broader skill rotation and application/benchmark work when appropriate.
- Daily Plan steps launch existing HyperSoft modules directly and automatically mark themselves complete when the launched activity finishes.
- Keyboard Trainee review steps can be marked complete manually after review.
- Added profile-specific current-plan persistence and completed-plan history, both included automatically in profile exports and full backups.
- Result dialogs from Daily Plan activities now offer **Return to Daily Plan** and report plan-step progress.
- Daily plans use Pacific day boundaries and regenerate for a new day without deleting prior completed-plan history.


## v0.15.9 — Typing Theory Library / Learning Center

- Added **Learning Center** as a first-class HyperSoft module with 12 reference-and-instruction topics across Foundations, Measurement, Technique, Special Skills, Practice & Comfort, and Using HyperSoft.
- Topics cover touch typing/home position, finger zones, accuracy-before-speed, WPM/Gross/Adjusted WPM, rhythm/hesitation, motor learning, Shift/punctuation technique, 10-Key/KPH theory, real-world transcription, ergonomics fundamentals, practice design, and a complete map of the HyperSoft suite.
- Each topic includes a concise explanation, why-it-matters section, core principles, practical example, common mistake, related HyperSoft module links, and an optional knowledge check.
- Added a searchable/filterable topic browser and a 10-term typing glossary.
- Topic review and knowledge-check progress are profile-specific and included automatically in profile exports and full backups.
- Learning Center progress does not alter WPM, lesson completion, Assessment placement, or certification results.
- Daily Training Plan can now schedule a short **Theory Refresher** for developing learner profiles; reviewing the assigned topic automatically completes that Daily Plan step.
- Added dedicated HyperSoft 98 styling and tighter short-height navigation rules for the expanded primary module rail.


## v0.16.0 — Integration & Onboarding
- Added a profile-specific **First-Run Advisor** for experience level, primary goal, and preferred 10/20/30-minute practice length.
- Home now presents a dynamic three-step **Recommended Path** instead of a giant wall of direct-launch buttons.
- Added a searchable, categorized **Program Guide / Module Explorer** covering the complete HyperSoft suite.
- Added **HyperSoft Diagnostics** in Settings: build version, expected lesson/game/drill counts, duplicate-ID check, navigation-target check, and browser-storage state.
- Added profile persistence/backup support for onboarding preferences. Existing profiles with activity are not interrupted by automatic onboarding.
- Added `aria-current` navigation state, a skip-to-module link, a screen-change live region, stronger focus indicators, Escape handling for standard help/advisor dialogs, and additional reduced-motion suppression.
- HyperSoft 98 navigation now receives visual group separators for Guidance, Training, Specialty, Measurement, Arcade, Records, and HyperSoft system areas.
- No training modules were removed or locked; the integration layer only helps learners understand where to go next.

## v0.16.1 — Keyboard & Accessibility Pass

- Added suite-wide dialog focus management: dialogs focus a meaningful control/heading on open and restore focus to the invoking control when closed without navigation.\n- Added explicit `aria-labelledby` wiring to all eight major dialogs.\n- Hardened all seven non-arcade typing workstations and all eight arcade games so global key handlers yield whenever a dialog is open or focus is on an interactive UI control.\n- Added Arrow-key, Home, and End navigation while focus is inside the large HyperSoft module rail.\n- Keyboard-activated primary navigation now moves focus to the destination screen heading and announces the module change through an atomic live region.\n- Made the skip-link destination programmatically focusable.\n- Added a profile-specific Motion Preference setting: follow the operating system or always reduce motion. OS reduced-motion requests are never overridden.\n- Strengthened visible focus indicators across base themes and HyperSoft 98 palettes.\n- Expanded Diagnostics with dialog-label, skip-target, live-region, and motion-preference checks.\n- Added `tools/qa_accessibility_audit.py` and expanded the lifecycle audit to enforce keyboard-capture safeguards.\n

## v0.16.2 — HyperSoft System Diagnostics & Torture Test

- Expanded Settings diagnostics with a **read-only System Torture Test**.
- Added synthetic corrupt-profile, malformed Daily Plan, Practice Builder, onboarding, and Learning Center recovery probes that run entirely in memory.
- Added route/catalog integrity, report-handler resolution, score activity-type, profile uniqueness, preset integrity, and storage checks.
- Fixed Daily Plan restore so a valid action type with an invalid activity ID is now dropped instead of creating an unlaunchable step.
- Fixed corrupted/imported Practice Builder preset collections so duplicate preset IDs and names are repaired deterministically.
- Hardened raw profile loading to repair duplicate profile names as well as duplicate IDs.
- Added `tools/qa_system_torture.py` for import graph, route, report, bundle, DOM-reference, JavaScript syntax, stale-session, Daily Plan, and preset/profile-state validation.


## v0.16.8 — Navigation & Module Discovery Polish

- Added profile-specific **Favorite Modules** with up to eight pinned destinations. Favorites are included automatically in profile/full-backup data.
- Added **Recently Used** module history with the eight most recent unique destinations and Pacific timestamps.
- Added **Continue Where You Left Off** to Home; HyperSoft remembers the learner's last meaningful module without letting Home overwrite it.
- Added a personal Home shortcut hub for Continue, Favorites, and Recently Used.
- Module Explorer now supports **All Modules**, **Favorites**, and **Recently Used** views while retaining full-text search.
- Module Explorer cards now separate Open and Favorite controls, with proper `aria-pressed` state and descriptive favorite labels.
- HyperSoft 98 sidebar groups now use explicit group labels, and favorite destinations receive a subtle rail marker.
- Added corruption-safe normalization for invalid, duplicate, or oversized favorites/recent-history data and included it in the System Torture Test.
- Added `tools/qa_navigation_discovery.py` for favorites/recent-state behavior, persistence hooks, Home discovery surfaces, HyperSoft grouping, and module-view validation.
- Corrected historical release headings in README for v0.15.7, v0.15.8, v0.16.0, v0.16.1, and v0.16.2.
## v0.16.8 — Navigation Intelligence & UX Cleanup

- Smart Continue prefers actual training modules instead of utility screens.
- New **Recommended** explorer view uses the learner's adaptive three-step path.
- Explorer groups are consolidated into six clearer discovery categories.
- Favorites prioritize recently used pinned modules.
- Search understands practical aliases such as “number pad,” “what next,” “typing test,” “weak keys,” “office,” and “backup.”
- Press **/** on Home to focus module search; Escape clears the search.
- First-run and returning Continue states now provide different guidance.




## v0.16.8 — Content & Balance Audit
- Audited the full 14-lesson curriculum target curve and workload.
- Expanded thin fixed vocabulary pools in early curriculum lessons.
- Reduced distracting short-range token repetition across scrolling lessons and Smart Practice.
- Added automated content-balance gates to the System Torture Test.
- Verified Smart Practice remains accuracy-first and the 10-Key Academy retains a progressive KPH curve.
- Preserved save compatibility; no profile migration is required.


## v0.16.9 — Adaptive Interface Rework & Release Hardening
- Rebuilt the HyperSoft 98 rail into seven clear navigation groups with a two-column desktop module grid.
- Merged the one-item Measure and Arcade headings into a compact **Test & Play** group.
- Reworked Blake's sidebar profile into a horizontal compact identity panel; the decorative monitor no longer consumes valuable navigation height.
- Added progressive short-height density modes so navigation contracts cleanly before scrolling is required.
- Replaced the tablet/mobile horizontal module ribbon with an accessible slide-out navigation drawer, including Escape close, backdrop close, focus return, and inert closed state where supported.
- Reworked the workspace header so optional actions yield space before the current module title is crushed.
- Converted major card/module grids to auto-fit the available workspace rather than depending on fixed column counts.
- Preserved all 21 modules, Favorites/Recent/Continue behavior, HyperSoft palettes, keyboard navigation, save compatibility, and existing training data.


## v0.17.8.1 — Home Dashboard Rework
- Rebuilt Home around a compact hero plus responsive dashboard panels instead of one narrow content column beside a large portrait.
- Reduced Blake's Home portrait to a small horizontal identity card and moved the active learner summary beside the hero.
- Added a three-column ultrawide Home launcher for Recommended Path, HyperSoft Shortcuts, and Blake/Corporate information.
- Reworked Module Explorer so each category uses horizontal card rows with auto-fit columns, dramatically reducing page height on wide displays.
- Tightened Home cards, recommendations, Continue/Favorites/Recent controls, backup reminder, and launcher actions without removing information.
- Preserved one-column behavior on phones and sensible two-column transitions on ordinary laptop/desktop widths.
- Updated current visible/reporting version strings to v0.17.8.1 while preserving save-schema compatibility.