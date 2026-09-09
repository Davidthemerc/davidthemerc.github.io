## v1.10.1 Stable
- Removed the developer-facing Package Check / Season Data readiness card from Settings.
- Removed the Historical Results integrity/correction card from Settings.
- Kept the underlying verified historical correction logic and season validation/data systems intact.
- Kept user-facing Sleeper connection, backup/import, reset/maintenance, appearance, and archived draft preferences.

## v1.10.0 Stable
- Promoted the validated v1.9.72 release candidate to the official UCL Companion 1.10 release.
- No functional changes from the approved v1.9.72 RC.
- Establishes the 1.10.x stable patch line for in-season maintenance and fixes.

## v1.9.72 RC
- Added Gold to Color Theme.
- Added Ice Blue to Color Theme with a cyan-forward palette.
- Both use the existing persistent theme system and preserve semantic status colors.

## v1.9.72 RC
- My Team bench is now sorted QB → RB → WR → TE → DEF → K.
- Within each position, highest current-week projection or actual score appears first.
- Players without a projection/score sort below scored/projected players within their position.
- Alphabetical name is used only as a final stable tiebreaker.

## v1.9.72 RC
- User-facing roster-health counts now say `healthy` instead of `secure`.
- Internal health logic remains unchanged.

## v1.9.72 RC
- Teams metrics now include POINTS AGAINST next to POINTS FOR.
- Team metadata replaces the unhelpful `Roster #` with `League Rank: 1st/2nd/3rd/etc.`.
- `Live season roster` is now `Live Roster`.
- League Teams subtitle now reads: “Browse the Draft Report Card, every UCL roster profile, results, and recent roster activity.”

## v1.9.72 RC
- Removed Report Card from the main navigation to free top-menu space.
- Added a prominent 2026 Draft Report Card action at the top of the Teams screen.
- The button still opens the existing dedicated Report Card sub-page; no Report Card functionality was removed.
- Teams mobile layout keeps the Report Card action full-width and easy to tap.

## v1.9.72 RC
- Locked the approved 2026 Home/Away schedule into source; it is deterministic across reloads/devices.
- All eight managers receive exactly 7 HOME and 7 AWAY games.
- Each two-game opponent series is split one HOME / one AWAY.
- Every team has at least one two-game homestand and one two-game road stretch; no team has a venue run longer than two.
- HOME is styled green; AWAY is styled yellow.
- Venue context now appears in Command Center This Week, Season matchup headers/Weekly Matchup Center, Other League Matchups and its popup, My Team weekly lineup context, and Teams current/completed matchup displays.
- `vs` means HOME and `@` means AWAY.

## v1.9.72 RC
- CTESPN dominance stories now require at least a 5–0 historical series.
- 1–0 through 4–0 one-sided histories do not generate dominance News stories.
- Season rivalry Series Notes still show “[TEAM] has never beaten [TEAM]” regardless of meeting count.

## v1.9.72 RC
- CTESPN Newsroom is now a rolling two-week window: current week + immediately prior week; Week 1 naturally shows Week 1 only.
- Matchup, standings, streak, transaction, playoff, rivalry, and dominance stories are filtered through the same window.
- Transactions use the authoritative Sleeper transaction-week bucket; ordinary CTESPN stories no longer use `week = null`.
- Playoff clinch/elimination stories are tagged with the first finalized week the condition became mathematically true.
- Rivalry/dominance generation now evaluates every league matchup in the Newsroom window, independent of selected team.
- My Team filters the league-wide story set rather than limiting story generation.
- If all available Lead Story candidates are rivalry/dominance stories, most historical meetings wins; verified UCL Bowl history, normal priority, then alphabetical order break ties.
- Rivalry story taps target the actual teams in that story, including other managers' matchups.
- News rivalry history prefetch now covers current and prior-week matchup pairs and reuses the existing per-pair cache.

## v1.9.72 RC
- Verified historical corrections now match by Sleeper user identity and all known manager aliases (username, display name, and current team name), rather than requiring the visible team label to literally equal `dmercado` / `fograw`.
- Added `historicalMatchupAudit()` to expose candidate records, normalized participant identities, correction matches, final corrected scores, and the winning merged record.
- Rivalry history cache bumped to v5.

## v1.9.72 RC
- Added a verified historical score-correction layer for rare Sleeper archive discrepancies.
- Seeded the screenshot-confirmed 2019 Week 10 result: dmercado 140.47–138.51 fograw.
- Historical meetings now deduplicate by season + week + team pair, not by score, so conflicting representations of one game cannot be counted twice or independently win Closest Matchup.
- Source precedence favors verified corrections, then Sleeper historical API, then current Sleeper/history imports.

## v1.9.72 RC
- Historical Sleeper matchup scores now prefer valid `custom_points` over raw `points`; raw points remain the fallback.
- The same authoritative score helper is used by current-season archived rivalry games and CTESPN finalized-result calculations.
- Rivalry history cache schema bumped to v4 so previously cached raw-score results are discarded and rebuilt.
- Historical game objects preserve whether each side came from `custom_points` or ordinary `points`.
- Longest Win Streak now stores both endpoints and displays `YYYY`, `YYYY–YYYY`, or `YYYY–Present`.

## v1.9.72 RC
- Shared Season + News rivalry/dominance detail now uses an even eight-card metric grid.
- Largest Margin renamed Largest Blowout and now identifies winner/final score.
- Highest-Scoring Meeting, Closest Matchup, and Last Meeting now identify winner/final score.
- Added Longest Win Streak, calculated chronologically across all valid decided meetings.
- Because News and Season share the renderer, the same improvements apply to one-sided dominance story detail.

## v1.9.72 RC
- Rivalry competitiveness now requires the trailing team to own at least 25% of decided meetings, unless that weaker all-time team has a verified UCL Bowl victory over the series leader.
- One-sided series remain non-rivalries.
- Closest Matchup is now shown in both Season rivalry detail and CTESPN rivalry detail.
- CTESPN rivalry/dominance stories are tappable/clickable and open a shared rivalry-history modal using the same detail renderer as Season.

## v1.9.72 RC
- Fixed Newsroom filter contrast. Inactive filter labels now render dark on the white News card instead of inheriting global white `.btn.ghost` text.
- Active filter remains white-on-theme/navy and hover remains readable.
- Added computed-style browser coverage for inactive and active filter text/background colors.

## v1.9.72 RC
- Fixed Newsroom filter visibility. All six filters are forced visible and wrap safely on narrow mobile screens, including compact/empty states.

## v1.9.72 RC
- News now lazily loads rivalry history for the selected team's actual current-week opponent.
- A cheap current-matchup preflight prevents irrelevant historical API work.
- The existing 7-day per-pair rivalry cache is reused; fresh cached history causes no network/archive walk.
- CTESPN Newsroom rerenders when cached or newly fetched rivalry history becomes available.

## v1.9.72 RC
- Added a dedicated News tab before Command Center and moved League Activity & Transactions, CTESPN Newsroom, and CTESPN Weekly League Report out of Season.
- Added NEWS STORY FILTER and My Team filter.
- Established rivalry: both teams must have beaten each other, plus 5+ valid meetings OR a verified UCL Bowl meeting OR valid meetings across 3+ seasons.
- One-sided series are not rivalries; when the teams meet this week CTESPN instead asks whether the winless side can finally break through.

## v1.9.72 RC
- CTESPN rivalry-renewal stories now require the two established rivals to actually be playing each other in the current week. Historical data loading alone cannot create the story.

## v1.9.72 RC
- Removed the visible 2026 Season Archive card from Season. Underlying archive/history functions remain available for historical features.

## v1.9.72 RC
- Player Acquisition comparison deltas now use semantic colors: positive green, negative red, exact zero neutral.
- Theme colors no longer override small positive/negative projection differences.

## v1.9.72 RC
- Moved Package Check and Season Data readiness to Settings → Sleeper & Data.
- Removed Matchups and Draft / Moves archive counters plus Complete 2026 Package export controls from Season.

## v1.9.72 RC
- Roster Watch, Roster Pressure, and Weekly Watch now share the same health-severity model as Roster Needs & Moves.
- Questionable-only depth concerns display as precautionary Potential Problems; Doubtful/Out/IR/reserve losses display as actionable concerns.

## v1.9.72 RC
- Consolidated Major Roster Needs, Top Available for Your Needs, and Add / Drop Suggestions into **Roster Needs & Moves**.
- Questionable-only depth risk is precautionary: contingency options are shown without an immediate transaction recommendation.
- Doubtful/Out/IR/reserve-type losses can escalate to an actionable health need and waive normal projection thresholds.
- Weekly Action Brief uses the same Potential Problem vs Action Needed distinction.

# UCL Companion 2026 — v1.9.72 RC

## Release highlights
- Waiver/add-drop upgrades now use the same projection-advantage thresholds as Bench Analysis.
- Health-driven major needs may bypass those thresholds when injuries have reduced usable depth.
- No new background API activity, polling, or persistence paths.


## v1.9.72 RC — Season Lineup Card Cleanup

- Removes the redundant **Current Sleeper Lineup** card from the Season page.
- Underlying Sleeper matchup/starters/bench data remains available to Bench Analysis, Matchup Center, Weekly Action Brief, and other Season intelligence.
- No Sync, persistence, API, recommendation, or lineup logic changed.

## v1.9.47 RC — Waiver Percentage Thresholds

- Weekly Action Brief and Season Add / Drop Suggestions now use the same projection-advantage thresholds as Bench Analysis: QB +10%, RB/WR/TE +20%, and TE over a WR in FLEX +40%.
- When injuries create a health-driven Major Roster Need, Weekly Action Brief and Add / Drop Suggestions may surface the best available waiver option without requiring the normal percentage advantage.
- Major Roster Needs remains independently health-aware; Questionable and other unavailable designations do not count as usable depth, while Probable remains usable.
- No new API calls, timers, polling, or persistence paths were added.

## v1.9.46 RC — Live Season Roster UI Cleanup

- Color Theme subtitle now uses the requested Companion copy.
- Command Center Roster Watch opens My Team during Live Season instead of the retired draft-era Team Analysis view.
- Roster Pressure now appears at the bottom of My Team.
- The redundant Roster Health card has been removed from Season; health-aware logic remains available to roster intelligence and Major Roster Needs.

## v1.9.45 RC — Health Counts + Bench Recommendation Thresholds

- Audited injury health logic: Questionable remains unavailable for Major Roster Needs; Probable remains usable.
- Season roster-pressure and roster-warning displays now use usable/health-aware counts so Questionable players no longer make depth look healthier than it is.
- Bench Analysis and Weekly Action Brief now recommend a bench player over a starter only when the projection clears the required improvement: QB +10%; RB/WR/TE/K/DEF +20%.
- A bench TE may challenge FLEX; when the FLEX starter is a WR, the TE must project at least 40% higher.
- Close-call bench recommendations were removed; the shared threshold helper drives both Bench Analysis and Weekly Action Brief.


## v1.9.44

- Report Card `Draft complete — live draft mode has ended` banner now follows the selected color theme.
- Removed the colored border from the Trade Partner section itself.
- Added the selected theme accent border to the actual Trade Partner team selection box.


## v1.9.43

- Extends theme coverage to Season Intelligence, the neutral No Major Roster Need bubble, the standings playoff separator, Teams informational tendency chips, and additional non-semantic blue accents.
- Preserves semantic status colors such as injuries, warnings, wins/losses, championship gold, and Player Acquisition position colors.

## v1.9.42

- Reorganizes Settings around the full Live Season Companion: Appearance, General, Season, Draft & Report Card, Sleeper & Data, and Reset & Maintenance.
- Moves draft-only display/intelligence controls into a collapsed Archived Draft Preferences area.
- Establishes UCL Blue as the current Appearance theme foundation without changing global colors yet; selectable color themes are reserved for v1.9.42.
- Keeps Sleeper refresh explicit and preserves all existing draft preference keys for archived-board compatibility.


## v1.9.40

- Player Acquisition position cards now use soft position-specific header/border colors while player rows remain neutral white.
- QB salmon; WR light blue; RB light green; TE medium orange; K light purple; DEF light brown.

## v1.9.39

- Removes the in-app Waiver Watchlist and all watch/unwatch controls; player watchlists remain a Sleeper responsibility.
- Collapses Analytics / Season Positional Context to a compact title + placeholder message when finalized positional scoring is not yet available.
- Reworks Playoff Machine week rows so the card itself hugs its contents while W/L/? controls use ~40px width and ~29px height tap targets on mobile and desktop.

## v1.9.38

- Corrected the malformed v1.9.37 CSS append that prevented compact News, Results & Movement empty states from applying reliably.
- Empty League Activity, CTESPN Newsroom, and CTESPN Weekly League Report cards now reduce to title + one message only.
- All three empty messages use identical 12px typography and compact outer-card padding.

## v1.9.37

- Players screen header is now **Player Acquisition**; navigation remains **Players**.
- Availability guidance now explains that listed players were available through Free Agency or Waivers and directs exact waiver-clear timing to Sleeper.
- Playoff Machine week cards are denser while W/L/? outcome buttons are about 40% wider and 20% taller.
- Empty League Activity, CTESPN Newsroom, and CTESPN Weekly League Report displays collapse to compact message-only states.

## v1.9.36

- Postseason / Playoff Machine now lazy-loads any missing remaining regular-season matchup weeks on demand.
- Ordinary Season opening still performs no future-schedule fan-out.
- Loaded schedule weeks are stored in the existing season matchup cache and reused on repeat visits.

## v1.9.35
- Replaces the Season status text with **Your guide to NFL Week [Week #].**
- UCL Bowl Series Notes now include the final score and year, e.g. **Team A defeated Team B 123.45 to 110.20 in UCL Bowl VIII (2025).**
- Excludes 0–0 rivalry matchup rows from Sleeper history, imported history, and current-season history so unplayed placeholder weeks cannot create phantom ties or PF.
- Uses a new rivalry-history cache generation so stale 0–0 historical placeholders are discarded immediately.

## v1.9.33
- Swaps **Players** ahead of **Trade Center** in the main Live Season menu and renames FA/W to **Players**.
- Fixes championship over-tagging by requiring the verified winners-bracket `p:1` pairing **and exact championship playoff week**. Other meetings between the same teams remain ordinary rivalry games.
- Widens the championship date/tag area so **🏆 CHAMPIONSHIP** is not clipped.
- UCL Bowl Series Notes now include the bowl numeral (`2018 = UCL Bowl I`; `2025 = UCL Bowl VIII`).
- Championship Series Notes scan the complete rivalry series, so a UCL Bowl meeting can be noted even when it is older than the six Recent Meetings shown.
- Uses a new rivalry-history cache generation so v1.9.32 championship over-tagging cannot survive in a previously saved cache.

## v1.9.32
- Adds Season subsection navigation directly below the Season header.
- Records button prepares the lazy rivalry/archive section on demand.
- Adds verified UCL Championship tagging using the Sleeper winners bracket p=1 pairing only; third-place and consolation/Toilet Bowl games receive no tag.
- Rivalry margins display as `Margin: 42.90 PTS`.
- Series Notes now appear only for a latest UCL Bowl meeting and/or a never-beaten rivalry series.
- Removes the visible `Sleeper archive + 2026` wording.

## v1.9.31
- Rivalries & Season Archive now lazily follows Sleeper historical league IDs when the Records section is actually viewed, matching managers by stable owner/user ID and caching historical results locally.
- Historical lookup walks backward through the league chain to 2018 when available; seasons where either displayed manager was not a member are skipped.
- Rivalry metric order is now Series → Largest Margin → Team A PF → Team B PF → Highest-Scoring Meeting → Last Meeting, keeping both PF cards side by side.
- My Team now shows injury designations beside affected roster players. No other roster page receives these badges.
- Confirmed and regression-tested: Major Roster Needs counts Questionable/Out/reserve-type players as unavailable for QB/RB/WR health depth; one or fewer healthy players at a position creates a major need and displays up to three suitable waiver alternatives when available.
- Historical API retrieval remains lazy and does not restore startup/tab-open polling or automatic synchronization.

# UCL Companion 2026 — v1.9.31 RC modular source

This package is the canonical development source for v1.9.0 onward.

## Workflow

1. Edit modular HTML/CSS/JS/data files.
2. Keep `module-manifest.json` in sync when modules are added, removed, or reordered.
3. Run `python build/build_standalone.py`.
4. Validate both modular source and generated standalone HTML before release.

## v1.9.30 RC — Weekly Action Brief

- Replaces Command Center **Team Management** with **Weekly Action Brief**.
- Prioritizes up to five actions using already-loaded Bench Analysis, waiver/add-drop, health/depth, current-week bye, and trade-route context.
- Automatically compacts when there are no active suggestions.
- Renames the card action button to **This Week** and routes it to Season → This Week.
- Adds no new API requests, persistence writes, timers, or background work.


## v1.9.29 RC — League Teams Roster Sorting

- Current Roster now sorts QB → RB → WR → TE → K → DEF.
- Within each position, starters appear before bench/roster players.
- Within the same position and role, players sort by dynamic 0–100 UCL Trade Value descending, then name as a stable tie-breaker.
- No Sync, persistence, or API behavior changed.

## v1.9.28 RC — Remaining Live Season Calculation Audit

- Season shares one matchup scoring context across the primary render path instead of recomputing starter/bench totals for multiple cards.
- Trade Center precomputes rank distribution, roster ownership/counts, and positional scarcity once per render-scoped valuation context.
- No visible behavior, Sync behavior, persistence, or background processing changed.

## v1.9.27 RC — My Team / Command Center Calculation Audit

- My Team now memoizes roster-player metadata and selected-week point values for the duration of a single render.
- Lineup rows and starter/bench totals reuse those same values instead of resolving them again.
- Command Center builds one render-scoped player cache for the selected roster and shares it between Roster Watch and Team Management / waiver-need analysis.
- Roster record text is calculated once and reused across Command Center cards.
- The caches are render-local only: no new persistence, timers, background work, Sync requests, or stale-cache invalidation paths were introduced.
- Existing UI, projections, warnings, roster-needs logic, Trade Center, Season lazy rendering, and Sync/persistence safeguards are preserved.

## v1.9.26 RC — Trade Evaluation II

- Package trades now use lineup-adjusted package scores rather than simple summed player values.
- Additional assets receive diminishing weight because only a limited number of players can occupy starting and premium bench slots.
- High-end players retain consolidation value through a nonlinear star-value curve.
- Raw player-value totals remain visible for transparency, while Package Out / Package In drive the verdict.
- Existing roster-construction risk, confidence handling, Trade Center layout, Sync behavior, persistence safeguards, and lazy sections are preserved.

## v1.9.25 RC — Trade Partner Border Hotfix

- Added a dark-blue border to the existing light Trade Partner selector container for clearer visual separation.
- No Trade Center logic, valuation, grouping, synchronization, persistence, or lazy-render behavior changed.


## Player data policy

This release does **not** fetch Sleeper's `/players/nfl` database. It can reuse player metadata already present in local storage/IndexedDB, Sleeper draft metadata, transaction metadata, and the UCL ranking data. Full shared player-database ingestion is intentionally deferred.

## Deployment

- `index.html` is the modular entry point and expects the included folders to remain beside it.
- `build/Unmanaged_Chaos_League_Companion_2026_v1.9.72.html` is the generated single-file build.





## v1.9.24 Trade Center layout + dynamic UCL Trade Value

- Restored bordered Trade Partner and player-side panels while preserving compact spacing.
- Player pickers are grouped by QB/RB/WR/TE/K/DEF and use two-column position grids when space allows.
- Added a deterministic 0–100 UCL Trade Value shown on every player row, with Elite/Premium/Strong/Solid/Depth/Fringe/Minimal tiers.
- Value blends preseason UCL rank, current-week position-relative projection, finalized-season position-relative production, roster role, positional scarcity, and health. Preseason carries more weight early; finalized production carries more weight from Week 7 onward.
- Roster fit remains separate from player value and is shown as Strong Need / Need / Useful / Depth context.
- No new API calls, timers, persistence writes, or background synchronization were added.

## v1.9.23 Compact Trade Center UI

- Tightened Trade Center card/header spacing without changing trade evaluation logic.
- Reduced the visible height of both player pickers and made roster rows denser while retaining readable names and metadata.
- Kept You Give / You Get side-by-side on normal desktop widths and preserved the existing stacked mobile layout.
- Compacted the Evaluate Trade button, evaluation metrics, partner cards, and retrospective spacing.
- Preserved v1.9.22 lazy rendering for Potential Trade Partners and Completed Trade Retrospectives.
- No synchronization, persistence, ranking, or trade-value behavior changed.

## v1.9.22 Trade Center / Report Card performance audit

- Trade Center keeps the trade builder, selected partner rosters, and evaluation surface immediate.
- Potential Trade Partners and Completed Trade Retrospectives now render after the primary Trade Center frame and only when their sections approach the viewport.
- Report Card keeps the final grade, scorecard, draft highlights, positional grades, and roster assessment immediate.
- Week 1 projected-strength detail, League Draft Rankings, League Draft Awards, Draft Strategy Review, and Final Evaluation are deferred until needed.
- The deferred Report Card evaluation computes Week 1 league projections once per render instead of repeating the same league calculation.
- New browser regressions require both views to begin with their secondary sections deferred and verify those sections still render correctly on demand.
- No automatic Sleeper/API synchronization or persistence writes were added to navigation.

## v1.9.21 Bench Analysis

- Removed Matchup Intelligence II, including Matchup State and Pressure Points.
- Added Bench Analysis: bench players are compared only with starter slots they are actually eligible to fill.
- A bench player is surfaced as a Starter Threat when projected above the weakest eligible starter, or a Close Call when within 2.00 projected points.
- UCL FLEX eligibility treats RB/WR/TE as eligible for FLEX/W-R-T while preserving same-position rules for QB/K/DEF.
- Preserved Season Positional Context under the renamed Analytics section.

## v1.9.2 persistence model

- Lightweight preferences and selection state remain in `localStorage`.
- The full league/season runtime snapshot is stored in IndexedDB using the existing persistent store.
- Existing v1.9.0 `localStorage` runtime snapshots migrate automatically on first load.
- Saved week projection maps are hydrated before the background Sleeper refresh.
- JSON backup/import includes both `localStorage` and IndexedDB records.
- No `/players/nfl` request is made by the Companion.


## v1.9.2 Command Shortcut repair

All six Command Center shortcuts now use the shared `navigateCommand()` path. Season shortcuts can carry explicit section targets and wait for the Season view refresh before scrolling.





## v1.9.20 Season DOM and calculation reduction

- Season now renders only the current matchup/intelligence/lineup surface immediately.
- Team Management, Around the League, Postseason, and Records are lazy-rendered as their groups approach the viewport.
- State/week changes mark lower Season groups dirty, but only the groups currently near the viewport are recalculated immediately.
- Season command shortcuts explicitly prepare their target group before scrolling; they no longer route through `ensureSeasonDataFresh()` and therefore cannot trigger a network refresh merely to navigate.
- Browsers without `IntersectionObserver` retain full functionality by falling back to eager lower-group rendering.

## v1.9.19 persistence hardening and Sync audit

- Audited the visible ↻ Sync path itself after real-device freezes persisted across older builds until local data was reset.
- Live Season Sync now goes directly to season synchronization instead of refreshing the completed draft first and then refreshing season data.
- Weekly projection normalization no longer persists one discovered-player record per projection row. Metadata writes are batched once and limited to currently tracked UCL players plus a bounded pool of high-projection available players.
- The discovered-player registry is capped at 220 records and oversized legacy copies are rejected before JSON parsing at startup.
- The discovered-player registry is no longer duplicated inside the runtime snapshot/local mirror. Runtime snapshot schema is now v4.
- Weekly projection cache records are compacted to tracked players plus the top 12 available candidates per position rather than retaining the entire raw response.
- Repeated runtime-save requests are coalesced into bounded writes instead of launching overlapping snapshot serializations.
- Normal Sync no longer preloads every future matchup week. Future weeks remain lazy-loaded by explicit week selection. Historical matchup/transaction backfill is limited to four missing weeks per sync.
- Legacy cached `/players/nfl` data is not read anywhere in the app and is deleted opportunistically during season sync.

## v1.9.17 Live Season render-purity / freeze audit

- Audited every visible Live Season tab for work that should never occur merely because a view is opened.
- Removed Season Waivers' automatic projection sync/rerender when projection data is absent.
- Removed FA/W's automatic projection sync/rerender when projection data is absent.
- Removed Report Card's automatic Week 1 projection sync on view open.
- Made Report Card strategy-history statistics read-only; strategy finalization/persistence remains part of the explicit Sleeper sync flow.
- Removed a stale Settings call to the already-removed production Diagnostics renderer.
- Added browser regression coverage that opens every visible Live Season tab with projection data absent and requires zero network/sync calls and zero persistence writes during rendering.
- Preserves explicit week-selector fetches and the visible ↻ Sync control as intentional user-requested refresh paths.

## v1.9.16 targeted Teams freeze fix

- Removed persistence mutation from `sleeperRosterPlayer()`. Roster/player lookups during Teams rendering are now read-only.
- Prevents repeated synchronous serialization and local-storage rewrites when Teams computes roster, health, depth, matchup, and trend sections.
- Added static and browser regressions requiring Teams rendering to perform zero persistence writes.
- Preserves the v1.9.15 render-only navigation model, explicit Sync behavior, and lazy archived Draft Board.

## v1.9.15 stabilization and smoke testing

This release adds a repeatable full-app validation layer under `tests/`. `static_smoke.py` checks module/build structure, JavaScript syntax, duplicate IDs/functions, cross-module callback load order, data-file integrity, persistence architecture, and the `/players/nfl` prohibition. `browser_smoke.py` uses a deterministic eight-team fixture to exercise all top-level tabs, Command Center shortcuts, pregame-to-live scoring behavior, K/DEF bye derivation, built-in Diagnostics, and narrow-phone containment.


## v1.9.15 Teams post-draft cleanup

The Teams tab is now strictly an in-season team profile. Draft History, list ranks, and `NR` badges were removed from Teams and remain confined to Report Card / Draft Archive.


## v1.9.15 matchup scoring normalization

All current-matchup surfaces use the shared pregame/live scoring context. Before kickoff they display Sleeper projections when available; if projections are still loading they display a pending state rather than raw 0-0 matchup points.


## v1.9.15 FA/W

Adds a compact season free-agent/waiver workspace. Unrostered players with weekly Sleeper projections are grouped by position and sorted by projected points. Each row compares the candidate with the user roster’s weakest projected player at the same position. Projection payloads may also enrich the locally discovered-player registry; `/players/nfl` remains disabled.


## v1.9.15 waiver intelligence

- Season shows the current Sleeper waiver order.
- Major Roster Needs is health-aware for QB/RB/WR.
- One or fewer healthy players at QB/RB/WR triggers suitable available alternatives.
- Add / Drop Suggestions considers the top available QB/RB/WR/TE only when the player clears the projection-advantage threshold over an eligible roster replacement: QB +10%; RB/WR/TE +20%; TE over a WR in FLEX +40%.
- Waiver recommendations use current-week projections, not draft-list rank.


## v1.9.15 saved-data startup repair

The season runtime is now dual-persisted. IndexedDB remains the primary durable store, but a stable localStorage runtime mirror is retained. Startup renders from that local mirror first, then hydrates the newest valid IndexedDB/local copy and refreshes Sleeper.


## v1.9.15 emergency startup hardening

The UI shell and top navigation now initialize synchronously before IndexedDB or Sleeper are touched. IndexedDB opening and startup hydration are bounded by timeouts. Tab switching activates the requested view before running its renderer, and renderer errors are isolated so one screen cannot make the entire menu unresponsive.


## v1.9.15 stable live-season navigation

Season, Trade Center, and FA/W are now visible in the initial markup instead of beginning hidden and waiting for lifecycle hydration. This keeps the menu order stable during startup and guarantees FA/W is present even while saved/API data is still loading.


## v1.9.15 first-paint navigation cleanup

Team Analysis and Draft Log are draft-era utility views. Their top-level buttons now ship hidden in the Live Season markup, eliminating the brief flash/reflow before post-draft CSS/lifecycle state is applied. The views remain accessible from Report Card/archive controls.


## v1.9.15 startup performance normalization

The local runtime mirror is now the single fast first-render path. IndexedDB hydration, storage bookkeeping, projection restoration, persistence repair, and Sleeper refresh run in the background. IndexedDB state is re-applied only when it is newer than the mirror already shown. Only the current week's saved projections are restored at startup; other weeks remain lazy-loaded.


## v1.9.15 main-thread performance cleanup

The complete Diagnostics suite is now manual-only. Runtime restoration renders only the active view. In Live Season mode, Sleeper draft synchronization no longer rebuilds archived draft UI on every refresh, and same-team background reconnect preserves the displayed saved state instead of clearing/reloading it.


## v1.9.15 Teams crash isolation

The Live Season Teams tab no longer enters archived draft grading at all. Team picker data comes directly from current league rosters/users, roster cards come directly from current Sleeper roster IDs, and nonessential manager-trend analysis is deferred until the browser is idle. The browser smoke suite repeatedly renders Teams to guard against runaway CPU/DOM growth.


## v1.9.15 stability-first runtime

Development verification has been removed from the shipped application. Settings Diagnostics/regression checks/debug panels and API/cache status probes are gone. Tab navigation is render-only and never launches background API work. Automatic polling, focus refresh, and startup Sleeper refresh are disabled; use the visible ↻ Sync control when live data should be refreshed.

## v1.9.19 FA/W candidate cap / crash hardening

- FA/W now displays only the top 3 projected candidates at each position.
- The cap is applied while building per-position candidate buckets, before comparison and DOM rendering.
- Selecting one position renders no more than 3 candidates; ALL renders no more than 3 each for QB, RB, WR, TE, K, and DEF.
- Existing projection ranking, roster exclusion, weakest-player comparison, and explicit week-sync behavior are preserved.
- Browser regression coverage now verifies both selected-position and ALL-view caps.
