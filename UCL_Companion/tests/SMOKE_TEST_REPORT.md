# UCL Companion 2026 — v1.10.1 Smoke Test Report

## v1.10.1 Stable — Settings User-Facing Cleanup

- Removed Package Check / Season Data readiness diagnostics from Settings.
- Removed Historical Results integrity/correction diagnostics from Settings.
- Preserved verified historical correction logic, audit functions, season data validation, Sleeper connection, backup/import, and reset controls.
- Static smoke suite: PASS.
- Browser smoke suite: PASS, including 320px containment and no uncaught runtime errors.

# UCL Companion 2026 — v1.9.41 Smoke Test Report

## v1.9.46 RC — Live Season Roster UI Cleanup

- Updated the Color Theme subtitle to the requested copy.
- Live Season Command Center Roster Watch now routes to My Team rather than the draft-era Team Analysis view.
- Roster Pressure moved from Season to the bottom of My Team and reuses My Team's render-scoped player cache.
- Removed the redundant Season Roster Health card and its render writes.
- Season Weekly Watch and Current Matchup expand to full width after the card removals.
- Static smoke suite: PASS.
- Browser smoke suite: PASS, including 320px containment, render-purity, cache-count regression, and no uncaught runtime errors.

## v1.9.43 Theme Coverage Audit

- Added theme-token coverage for Season Intelligence, neutral roster-need/depth chips, standings playoff separator, Teams informational tendency chips, and other decorative informational accents.
- Semantic colors remain intentionally fixed.
- Static and browser suites validate theme coverage and mobile/stability regressions.

## Result

PASS — static smoke suite and browser smoke suite.

## v1.9.41 coverage

- Settings is reorganized around the full Live Season Companion: Appearance, General, Season, Draft & Report Card, Sleeper & Data, and Reset & Maintenance.
- Archived draft-only controls remain functional but are demoted into a collapsed **Archived Draft Preferences** section.
- UCL Blue is established as the current Appearance theme foundation; no global recoloring is introduced in this release.
- Settings renders current league/team/week/version state without adding network or persistence work during ordinary navigation.
- The Settings page passes 320px containment with the archived draft section collapsed by default.

## Existing regression coverage preserved

Static JavaScript syntax, duplicate IDs/functions, Season lazy rendering, Postseason schedule lazy loading, rivalry archive logic, Player Acquisition, Sync/persistence safeguards, Major Roster Needs, Trade Center, Report Card, repeated navigation stress, and mobile containment all pass.

## v1.9.42 Settings Cleanup + Color Themes
- PASS: Settings Navigation, Weekly Workspace, and Refresh Behavior cards removed.
- PASS: Command Center remains the fixed default home.
- PASS: Six themes available: UCL Blue, Forest, Purple, Crimson, Orange, Slate.
- PASS: Theme selection applies immediately and uses a persistent local preference.
- PASS: UCL Blue remains the fallback/default theme.
- PASS: Full static and browser smoke suites pass, including 320px containment and Live Season render-purity/stability regressions.


## v1.9.45 health-count and bench-threshold maintenance

Static and browser suites pass. Questionable designations reduce usable Season depth and Major Roster Needs health counts. Bench Analysis and Weekly Action Brief share QB 10%, standard 20%, and TE-over-WR FLEX 40% projection thresholds.

- v1.9.48: Current Sleeper Lineup card removed from Season; static/browser regression confirms absence while My Team injury status remains covered.

## v1.9.50 RC
- Added Other League Matchups compact overview under Weekly Matchup Center.
- Added on-demand matchup-detail dialog using the existing projected/live scoring engine.
- Confirmed selected user's matchup is excluded from Other League Matchups.
- Updated health-driven Major Roster Needs floors to QB <=1, RB <=2, WR <=3 usable when designations are present.
- Added browser regression for 3 usable WR + 3 Questionable WR triggering a health-driven WR need.
- Full static and browser smoke suites passed.


## v1.9.50 RC
- Consolidated Season waiver intelligence into Roster Needs & Moves.
- Questionable-only depth risk is precautionary and surfaces contingency options without an immediate move recommendation.
- Doubtful/Out/IR/reserve-type availability loss escalates to actionable health need and may waive normal projection thresholds.
- Weekly Action Brief uses the same Potential Problem vs actionable distinction.
- Static and browser smoke suites pass.

## v1.9.53 RC
- Roster Watch, My Team Roster Pressure, and Season Weekly Watch now use the same health severity model as Roster Needs & Moves and Weekly Action Brief.
- Questionable-only depth concerns are precautionary Potential Problems; Doubtful/Out/IR/reserve-type losses are actionable.
- Static and browser smoke suites pass.


## v1.9.53 RC
- Moved Package Check and Season Data readiness to Settings → Sleeper & Data.
- Removed Matchups / finalized-week and Draft / Moves archive counters from Season.
- Removed Complete 2026 Season Package export control and explanatory blurb.
- Static and browser smoke suites pass.


## v1.9.53 RC
- Player Acquisition comparison deltas use semantic colors: positive green, negative red, exact tie neutral.
- Verified tiny ±0.03 differences under a non-blue theme remain semantic rather than theme-colored.
- Static and browser smoke suites pass.

## v1.9.60 RC
- Rivalry competitiveness requires the trailing team to win at least 25% of decided meetings, except when the weaker all-time team owns a verified UCL Bowl win over the series leader.
- One-sided series remain dominance storylines, not rivalries.
- Closest Matchup added to shared rivalry detail.
- CTESPN rivalry/dominance stories open a shared rivalry-history dialog using the same detail renderer as Season.
- Static and browser smoke suites pass, including targeted 12-3 / 9-3 / 14-1 Bowl-exception regressions.
