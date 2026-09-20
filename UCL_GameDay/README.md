# UCL GameDay v0.5.58 — Modular Package

## v0.5.58 — All Teams Startup Fix

- Fixes the v0.5.57 startup crash: `gameViewAllTeamsMode` no longer reads `storage` before `storage` is initialized.
- The bootstrap declaration is again a safe `false` default.
- The saved All Teams preference is restored later in the normal startup path, after the shared storage helper exists and before initial controls/rendering.
- Retains the v0.5.57 All Teams cleanup: hidden matchup score/opportunity UI, neutral idle field, and null-score protection.
- Retains named Companion/GameDay tab reuse, host-aware Companion routing, current-week NFL activity selection, and strict playback protections.

## v0.5.58 — All Teams Cleanup

- Restores the saved All Teams preference on reload instead of only writing it to storage.
- Retains v0.5.56 behavior that hides Meaningful Starters / estimated opportunity in All Teams and restores it in individual-team mode.
- Clears lingering NFL end-zone labels/colors after All Teams plays and returns the idle field to neutral `UCL` / `ALL TEAMS` presentation.
- All Teams no longer derives matchup-specific lead/edge context from the selected matchup.
- Hardened stat-correction score checks so intentional All Teams `null` scores cannot become a misleading `0–0` display.
- All Teams remains starter-only by design; bench-player activity is not added to the league-wide feed.
- Retains scoreless All Teams presentation, named Companion/GameDay tab reuse, host-aware Companion routing, current-week NFL activity selection, and strict playback protections.

## v0.5.58 — Clean All Teams GameView

- The entire estimated-opportunity / meaningful-starters panel is hidden whenever All Teams GameView is selected.
- Switching back to an individual team restores the panel and recalculates that matchup's opportunity normally.
- All Teams remains scoreless and league-wide; individual play entries still identify the relevant UCL team/player.
- Retains v0.5.55 score suppression, host-aware Companion routing, named-tab reuse, current-week NFL activity selection, and strict playback protections.

## v0.5.58 — Scoreless All Teams GameView

- All Teams GameView no longer displays the score of the currently selected individual UCL matchup.
- Its GameView scorebar now identifies `ALL TEAMS` / `LEAGUE-WIDE GAMEVIEW` and leaves both numeric score fields blank.
- All Teams session score snapshots are intrinsically scoreless (`null`/`null`) so downstream GameView events cannot accidentally inherit one matchup's score.
- Stat-correction presentation in All Teams mode uses `LEAGUE-WIDE GAMEVIEW` rather than an individual matchup score.
- Individual-team GameView behavior is unchanged; selecting a team immediately restores that matchup's normal names and scores.
- Retains host-aware Companion routing, Companion/GameDay named-tab reuse, current-week NFL activity selection, and strict playback protections.

## v0.5.58 — Companion ↔ GameDay Tab Reuse

- GameDay names its browsing context `UCLGameDay` immediately from the document head.
- The Companion navigation link now targets the stable `UCLCompanion` browsing context instead of `_blank`.
- Removed `noopener noreferrer` from this named navigation because modern browser behavior can treat a non-empty named target as `_blank` when `noopener` is applied, defeating tab reuse.
- Existing host-aware Companion routing is unchanged: Netlify GameDay routes to Netlify Companion, GitHub Pages routes to GitHub Companion, and other/local hosts retain the GitHub fallback.
- Retains v0.5.53 All Teams GameView and current-week NFL activity selection.

## v0.5.58 — All Teams GameView + Week-Correct Activity

- Added **All Teams** to the GameView team picker.
- All Teams uses its own league-week GameView session and snapshots all eight UCL rosters, so newly accepted starter plays across all four matchups enter one chronological feed/playback queue.
- All Teams does not replace the primary team selection elsewhere in GameDay.
- Feed entries identify the UCL fantasy team when the event carries a roster ID.
- Fixed the estimated-starters-active/opportunity calculation selecting the first NFL game for a team from the full-season schedule. It now selects the game matching the current NFL week.
- This specifically prevents a completed prior-week game (for example BUF-HOU Week 1) from making a currently live Week 2 team appear finished.
- Existing lifecycle authority, stat-first validation, dedupe, strict playback dispatch, notification sound, and host-aware Companion behavior are retained.

## v0.5.58 — Host-Aware Companion Link

- GameDay on `*.netlify.app` opens Companion at `https://ucl-companion.netlify.app/`.
- GameDay on `*.github.io` opens Companion at `https://davidthemerc.github.io/UCL_Companion/`.
- Local files, localhost, custom domains, and other hosts default to GitHub Pages.
- Companion still opens in a new tab with `noopener noreferrer`.
- The packaged notification MP3 remains a real modular asset.
- No scoring, GameView playback, NFL lifecycle, or notification logic changed.

## v0.5.58 — GitHub Companion + Packaged Notification Audio

- Companion now opens `https://davidthemerc.github.io/UCL_Companion/` in a new tab.
- The modular package now includes the original notification MP3 at `assets/audio/ucl_notification.mp3`.
- Modular JavaScript loads that real asset instead of carrying a Base64 copy.
- The standalone HTML still embeds the exact same MP3 bytes so it remains a true single-file build.
- Notification enable/disable, volume, serialization, and the 1-second quiet interval are unchanged.
- Package size is now 20 files; the existing placeholder `.keep` files remain in place.

## v0.5.58 — Strict Playback Dispatch

- Fixes a renderer-level duplicate where one already-built GameView event could animate twice.
- Automatic playback now claims each queue/event ID exactly once before animation begins.
- The existing 7-second playback tombstone is enforced at the playback-runner boundary.
- A recently claimed equivalent event is dropped before any visual rendering begins.
- `playNextGameViewEvent()` is the sole owner of automatic queue advancement and the global playback lock.
- Burst/tandem playback keeps that lock for the entire burst instead of releasing it between sub-plays.
- Burst sub-plays cannot independently advance the queue.
- Explicit Replay bypasses automatic dispatch claims/tombstones and remains intentionally replayable.
- Stat/event ingestion and reconciliation dedupe are unchanged.

## v0.5.58 — ESPN Final-State Authority

- ESPN enrichment now captures NFL game lifecycle status in addition to kickoff time.
- ESPN status refreshes every 30 seconds instead of inheriting the six-hour kickoff cache cadence.
- ESPN FINAL immediately removes the currently-playing highlight for both teams.
- ESPN PRE keeps players inactive; ESPN LIVE marks them active.
- FINAL is sticky for that matchup/week so a stale later payload cannot reactivate a finished team.
- Sleeper lifecycle remains the secondary authoritative source.
- Kickoff/stat heuristics run only when neither ESPN nor Sleeper provides a known lifecycle state.
- Existing v0.5.48 injury badges are unchanged.

## v0.5.58 — NFL Game Lifecycle + Injury Badges

- Explicit NFL game status now controls the Live Lineups currently-playing state:
  - PRE / scheduled -> not currently playing
  - LIVE / in progress -> currently playing
  - FINAL / complete -> no longer currently playing
- Kickoff-time and recent-stat heuristics are used only when game status is unknown.
- Game-status parsing accepts both flat and nested status/type/state shapes.
- Injury designations are now bold colored badges:
  - Q = yellow/amber
  - D = orange
  - OUT / IR / PUP / SUSP / NFI = red
  - other non-Active designations = gray
- Generic healthy `Active` remains hidden.

## v0.5.58 — Notification Settings Scope Fix

- Fixed the remaining `ensureNotificationSettingsControls is not defined` startup error.
- Root cause: the binder was defined inside GameDay's main IIFE, while two settings-init hooks run after that IIFE closes.
- The binder is now explicitly exported as `window.ensureNotificationSettingsControls`.
- Outside-IIFE hooks now invoke the exported global safely with optional chaining.
- All v0.5.45/v0.5.46 features are retained unchanged.

## v0.5.58 — Notification Settings Startup Fix

- Fixed `ReferenceError: ensureNotificationSettingsControls is not defined`.
- Moved the notification-settings binder into the normal UI module so it is defined before startup code can invoke it.
- Preserved the intentional cross-fragment `async function loadPlayers()` continuation between playback runtime and startup.
- All v0.5.45 features remain intact: semantic GameView dedupe/tombstones, compact field, injury designations, notification toggle/volume, and serialized audio.

## v0.5.58

- Strengthened GameView duplicate protection with semantic football-play fingerprints.
- Added playback tombstones so an already-rendering/recently-rendered inferred play cannot animate again.
- Semantic dedupe tolerates passer/receiver split representations of the same pass play.
- GameView field display reduced to roughly two-thirds size, with further responsive reduction on short/narrow screens.
- Live Lineups now suppresses generic Sleeper `Active` roster status and surfaces meaningful injury/availability designations instead.
- Added persistent Notification Sounds ON/OFF setting.
- Added persistent Notification Volume control.
- Existing one-sound-at-a-time gate and 1-second post-audio quiet period remain active.

## v0.5.58 — Serialized Audio Gate

- Added a global audio gate for all GameDay sounds.
- Only one app sound can play at a time.
- A second sound cannot begin until at least 1.0 second after the previous sound actually ends.
- The cooldown is driven by the audio element's actual `ended` event rather than an assumed duration.
- Audio errors/playback failures safely release the gate.
- Multiple triggers arriving while audio is blocked collapse to one pending sound instead of creating a noisy backlog.
- The newest pending trigger replaces the older blocked trigger.
- `stopBasicSounds()` clears both active and pending audio safely.
- v0.5.43 major-event notification rules and GameView deduplication are retained.

## v0.5.58 — GameView Deduplication + Major Event Notification

- Added a semantic GameView dedupe layer at both the persistent feed boundary and runtime playback queue.
- Equivalent events within a tight 5-second window are treated as one football play, preventing stat-first/correlation/reconciliation copies from rendering repeatedly.
- The fingerprint includes NFL team, involved player IDs, play/family type, stat package, visual yards, and normalized detail, so genuinely separate later plays can still render even when they happen to gain the same yardage.
- Added the supplied UCL notification sound for major events:
  - any individual fantasy impact worth 10.0+ points,
  - every touchdown type,
  - plays gaining at least 50 yards.
- One resolved football event can trigger the notification at most once.
- Replay playback does not retrigger the live major-event notification.
- The supplied notification audio is embedded byte-for-byte in the sound module so both standalone and modular builds use the same sound without adding a package dependency.

## v0.5.58 — Compact GameView Nav + Scores Navigation

- Main-nav `UCL GameView` label shortened to `GameView`.
- Added light outer spacing around each Scores matchup card.
- Team names in Scores are independently tappable/clickable.
- Tapping a team name selects that UCL roster and opens its correct matchup-scoped GameView session/feed.
- Clicking elsewhere on a Scores matchup card still selects that matchup while remaining on Scores.
- Keyboard activation remains supported for matchup cards and team links.
- v0.5.41 horizontal nav scrolling, white-on-blue Scores styling, and v0.5.40 stat-first safeguards are retained.

## v0.5.58 — Scrollable Navigation + Score Styling

- Main navigation stays on one row and scrolls horizontally instead of compressing when Testing Area is enabled.
- Supports touch swipe and trackpad horizontal scrolling with an unobtrusive hidden scrollbar.
- Nav items retain their normal width and the active tab automatically scrolls into view when necessary.
- Scores view uses white text on blue cards, matching the selected-score visual language on GameDay.
- v0.5.40 stat-first anti-ghost and negative-momentum fixes are retained.

## v0.5.58 — Scores View + Stat-First Hardening

### Navigation
- Main-nav `UCL Companion` label shortened to `Companion`; URL/behavior unchanged.
- Added a dedicated `Scores` view showing all four current-week UCL matchups in one compact scoreboard.
- Selecting a score card makes that matchup the featured matchup while staying on the Scores view.

### Stat-first play capture hardening
- New play-count evidence remains the strongest ordinary-play signal.
- Major discrete football stats remain eligible immediately.
- Yardage-only movement inside 15 seconds of an accepted same-player/same-stat play is now actually suppressed as probable correction noise.
- Outside that window, positive yardage-only movement must exceed the existing 4-yard fallback threshold.
- Negative yardage-only movement remains suppressed as correction evidence.
- `players_points` remains reconciliation/support data and does not manufacture a duplicate live play.

### Game Momentum
- Legitimate negative fantasy events now create an opponent momentum impulse exactly once.
- Corrections, reconciliation-only movements, unresolved team-score bookkeeping, and bench activity remain excluded.
- Correlated events use their per-roster fantasy impacts when available.

## v0.5.58 — GameDay Renderer Regression Fix

v0.5.38's GameDay lineup renderer edit unintentionally removed two adjacent helper functions from the modular source:
- `renderEvents()` — caused `ReferenceError: renderEvents is not defined` during `render()`.
- `condensedScoreHistory()` — would have broken score-history rendering after the first error was cleared.

Both helpers are restored without rolling back the v0.5.38 compact stat lines, player-to-GameView tap navigation, or weekly momentum continuity.

Validation now includes explicit definition/reference checks for renderer helpers touched by neighboring source edits.

## v0.5.58 — Compact Stats, Player-to-GameView Navigation, Weekly Momentum Continuity

### GameDay stat lines
- Zero-value stat categories are hidden.
- RB/WR/TE lines use compact football notation such as `18 CAR, 51 YD, 5/6 REC, 44 YD`.
- QB lines use `23/33 CMP, 178 YD, 1 TD, 3 INT, 7 CAR, 47 YD`.
- Kicker lines use made/attempted notation such as `2/2 FG, 1/1 XP`.
- Defense lines prioritize points allowed, sacks, interceptions, fumble recoveries, and TDs.
- Out-of-position passing/rushing/receiving categories appear only after the player actually records them.

### Tap player → UCL GameView
The player's name, position/team, and stat area on GameDay is now one padded invisible tap target. Activating it selects that player's UCL roster, switches to that matchup's GameView session/feed, and opens GameView. Enter/Space are supported for keyboard access. The fantasy-points button remains a separate control.

### Game Momentum
Momentum now represents the weekly matchup story rather than resetting at each scoring window:
- accepted fantasy scoring events move momentum;
- quiet Friday/Saturday periods add no fake graph points and do not decay/reset Thursday's endpoint;
- the next real scoring window carries the prior endpoint forward;
- between windows, the chart shows the most recent real session with a `BETWEEN SCORING WINDOWS` status;
- session history remains selectable;
- simulation sessions continue using the same momentum engine.

## v0.5.58 — Immediate Stat Plays + Ghost-Play Rejection

Live GameView no longer waits for Sleeper `players_points` before constructing ordinary plays. Raw player stat deltas are again the immediate play trigger.

New anti-ghost logic uses play-count stats as primary evidence:
- `rush_att` advancing validates rushing yardage, including short runs.
- `rec` advancing validates receiving yardage.
- `pass_att` / `pass_cmp` advancing validates passing yardage.
- Multiple attempts/completions in one poll remain a burst rather than fabricating one exact play.

Yardage-only corrections are filtered:
- positive yardage-only deltas of 1–4 yards are suppressed as likely corrections;
- negative yardage-only deltas without a new action are suppressed;
- yardage-only deltas of 5+ yards are accepted so consecutive substantial plays are not unnecessarily lost;
- accepted same-player/same-yardage-stat plays are tracked in a 15-second rejection/correlation window.

Later FPTS movement is supporting score information only and does not create a second GameView play.

Recovery/away intervals remain conservative because multiple plays may be aggregated while the app was not actively polling.

## v0.5.58 — Live Reconciliation Runtime Fix

Restores the `gvBuildStatFirstEvent()` helper that was accidentally removed during the v0.5.33 FPTS-confirmation rewrite but remained required by `gvDeltaEvents()`.

Also restores `gvReconciliationState()` as a compatibility/diagnostic helper backed by the new pending-candidate model, so Testing → Live Debug can report the currently pending expected fantasy-point amount without throwing another ReferenceError.

No rollback of the v0.5.33 safeguards: ordinary stat fragments are still held pending until FPTS confirmation, while decisive major events retain the fast path.

## v0.5.58 — Matchup-Bound GameView Feed

Changing the viewed team in GameView now immediately switches the active GameView session to that team's current UCL matchup.

GameView sessions are now persisted with matchup-specific week keys instead of sharing one global session slot. This keeps each matchup's feed, queued plays, played IDs, replay archive, and recovery state isolated from the other UCL matchups.

The previous matchup session is saved before switching, the new matchup session is loaded or initialized, transient playback is cleared, the new queue is restored, and the feed is rendered from the newly selected matchup immediately.

Simulation-only volatile feed entries are also filtered to the selected matchup so they cannot bleed into another team's GameView feed.

## v0.5.58 — Saved NFL Activity Collapse State

The Testing Area's NFL Game Activity card is now a collapsible native details panel.

For first-time users it starts collapsed. Opening or closing the panel saves that preference in local storage, and the saved state is restored the next time GameDay loads.

## v0.5.58 — FPTS-Confirmed Live Play Safeguards

Live GameView no longer commits ordinary plays from tiny raw scoring-stat fragments alone.

Raw stat deltas now accumulate as pending player candidates for up to 45 seconds. Normal plays are released only when Sleeper `players_points` produces an authoritative fantasy-points movement for that starter. The confirmed FPTS delta becomes the committed scoring amount, while the accumulated raw stats are used to classify and describe the play.

This suppresses false micro-events such as isolated `+0.04`, `+0.10`, or `+0.20` fragments that are merely partial updates to a larger play. Multiple stat fragments for the same starter are merged into one candidate before confirmation.

Discrete major scoring evidence such as touchdowns, interceptions, fumbles lost, defensive/special-teams touchdowns, safeties, two-point conversions, and blocked kicks may still release immediately when the stat package itself is decisive.

Bench players remain excluded from GameView.

## v0.5.58 — Authoritative Kickoff-Time Layer

The active-game clock system no longer assumes Sleeper's season schedule contains kickoff timestamps. Sleeper remains the source for week/team pairings, while kickoff times are resolved through a separate layer.

GameDay now fetches the current week's NFL scoreboard from ESPN and caches each matchup's UTC kickoff time by `week:AWAY@HOME`. The kickoff parser accepts direct schedule timestamps when available, then cached ESPN kickoff data, then a built-in verified 2026 Week 1 fallback.

The built-in Week 1 table guarantees NE @ SEA resolves to `2026-09-10T00:20:00Z` (5:20 PM Pacific). With the existing 4.5-hour live window, a 7:15 PM Pacific load resolves NE and SEA as active from the clock alone, with no scoring/stat heartbeat required.

Testing Area diagnostics now report the kickoff source (`schedule-field`, `espn-kickoff`, `known-2026`, or `unavailable`) so a missing-clock regression is visible immediately.

## v0.5.58 — First-Render Active-State Ordering

Startup now uses the exact same full `sync()` path as the manual Refresh Live button immediately, before any optional prerequisite hydration pass is allowed to delay it.

The 30-second local active-game timer no longer performs an eager render before the initial live sync. It starts only after that first sync settles, preventing a cached/incomplete inactive render from becoming the first authoritative active-state pass.

After the first full sync, GameDay immediately re-evaluates active NFL teams, starts the 30-second local timer, and then performs any still-missing optional player/schedule hydration in the background of the current session.

Testing Area NFL Game Activity now evaluates each schedule row independently. An active NE or SEA game no longer causes every NE/SEA game in the full-season schedule list to display as active.

## v0.5.58 — Startup Player-Team Hydration

GameDay no longer treats a cached player record as fully resolved unless it contains a usable NFL team code. Records with missing/blank/FA team data remain eligible for hydration from Sleeper.

`playerInfo()` now prefers the metadata source that actually contains a usable NFL team, so an incomplete discovered-player record cannot mask a better fallback record.

Initial startup now performs an active-game prerequisite pass before the first live sync-driven active-state result: it refreshes the NFL schedule and resolves any referenced players whose team metadata is still unusable, then re-renders active status. Manual Refresh Live should no longer be required merely to populate player→NFL-team mappings.

## v0.5.58 — Automatic Active-Game Evaluation

Active NFL lineup highlighting now evaluates immediately during app startup using whatever schedule/stat cache is already available. It no longer waits for the user to press Refresh Live before the first visual active-state pass.

A lightweight local timer re-evaluates active-game state every 30 seconds without making a Sleeper API request. This keeps kickoff-time transitions and game-window expiration current even when no scoring/stat update occurs.

Successful Sleeper syncs explicitly refresh active-game UI again after the latest schedule and stat data is loaded, and the offline/saved-data path does the same after rendering.

## v0.5.58 — True Kickoff-Time Active-Game Fallback

The NFL schedule loader now preserves the complete schedule payload instead of discarding every row that does not pass an exact current-week field match. Wrapper response shapes (`games` / `schedule`) are also accepted.

Active-game lookup now searches a team's loaded schedule rows for a kickoff whose time window contains the current time before consulting week metadata. If a team's game kicked off within the configured live window, the lineup is marked active with source `time-window` even when the schedule row has missing or incorrect week metadata.

The NFL schedule cache key is bumped to v4 so previously cached, pre-filtered schedule data cannot keep the old behavior alive.

The secondary GameView schedule cache no longer pre-filters by exact week before its data can be used.

## v0.5.58 — Active Players, Game Pressure, Replay Reachability

Active NFL highlighting now treats recent Live Debug player activity as a direct source, not just an indirect heartbeat. A detected player stat change also marks the known opponent NFL team active, so both sides of an in-progress game receive the yellow lineup treatment.

Game Pressure now consumes the same stat-first GameView scoring events that populate the live feed. The old `players_points` momentum stream is retained only for simulation, preventing live pressure from staying flat while GameView is already showing stat-first plays.

Replay controls now have an explicit touch/click hit target, higher stacking order, and overflow protection across portrait, short-height, and narrow layouts so the oldest replay button cannot be covered by the field/feed layout.

## v0.5.58 — Active-Game Fallback + First-Replay Repair

Live NFL team activity is now seeded directly from the same player stat-delta path that powers Live Debug. If Live Debug sees a real weekly stat change, that player's NFL team immediately receives the live-stat heartbeat used for yellow lineup highlighting.

Schedule team lookup is also more tolerant when a current-week filtered schedule row has an unexpected/missing week field: an unambiguous team match is still accepted so kickoff-time fallback can work.

Replayable GameView plays and bursts are now archived when they enter the canonical feed, not only after animation completion. Replay buttons are shown only when an actual replay snapshot exists, preventing the first feed item's Replay control from appearing clickable without a valid replay source.

## v0.5.58 — Live-Stat Active Games + Shared Team Selection

NFL active-player highlighting no longer depends entirely on Sleeper's schedule endpoint. When weekly NFL stats change for any player or D/ST on a team, GameDay records a 10-minute live-stat heartbeat for that NFL team. That heartbeat is now the primary active-game signal (except an explicit final status), so every lineup player on the same NFL team receives the yellow active-game treatment while the heartbeat is fresh. Schedule/status remains a fallback.

Live Debug now lists schedule-backed activity and stats-only heartbeat activity, including the last observed stat-change time.

GameDay and GameView now share the same selected roster more strictly. Clicking a GameDay matchup card synchronizes `#teamSelect` to a roster in that matchup, and entering GameView re-validates the selected roster against the featured matchup so the team being viewed carries across instead of drifting to a stale selection.

## v0.5.58 — Stat-First Live Scoring + Active-Game Timezone Fix

GameView no longer waits for Sleeper `players_points` before showing a started-player scoring play. Scoring-relevant raw stat deltas are interpreted immediately with the league's UCL scoring settings and create the GameView event at once. Non-scoring/derived stat changes remain diagnostic only.

A per-player reconciliation ledger tracks optimistic stat-first fantasy points. Later matching `players_points` deltas silently pay down that expected amount instead of creating duplicate plays. Any authoritative fantasy-point amount that cannot be matched to reported scoring stats becomes a compact reconciliation/correction summary. Negative scoring-stat revisions are emitted immediately as stat-first corrections.

The NFL schedule split `date` + `time` fallback is now explicitly parsed as UTC rather than browser-local time. The NFL schedule cache is bumped to v3. Live Debug shows both the raw schedule kickoff and GameDay's interpreted local kickoff.


## v0.5.23 — Active NFL Highlighting Repair

The main GameDay score ribbon no longer renders the CSS-generated `ON AIR` badge on the selected matchup.

NFL active-game matching now accepts the full set of Sleeper schedule team-field variants (`home_team`, `away_team`, abbreviations, metadata, and legacy `home`/`away`), uses the shared alias normalizer, and accepts alternate week fields. The schedule cache key is bumped to v2 so previously cached malformed/stale schedule data is not reused.

Testing Features → Live Debug now includes an NFL Game Activity section showing each current-week NFL game, parsed status, kickoff availability, activity source, and ACTIVE/INACTIVE result used by yellow lineup highlighting.


## v0.5.22 — Delayed Sleeper Stat/FPTS Reconciliation

GameView now retains started-player stat evidence for up to 60 seconds when Sleeper weekly stats update before `players_points`. When the authoritative fantasy-point delta arrives on a later poll, the buffered stat evidence is merged into that event and consumed once, allowing GameView to classify the play instead of losing the evidence between snapshots.

Live Debug now labels stat-only updates with zero fantasy-point change as `WAITING FOR FPTS`. When a later FPTS delta is matched to buffered evidence it reports `GAMEVIEW PLAY — DELAYED STATS MATCH`.


## v0.5.21 — Direct GameView Team Picker

The current team name in UCL GameView is now tappable/clickable. It opens a compact list of all selectable UCL teams so you can jump directly to any team without cycling through the arrows. Previous/next arrows remain available for quick navigation.

Selected-game `ON AIR` text has been removed for a cleaner GameView presentation.


## v0.5.20 — Live Debug + NFL Game Window Fix

Testing Features now contains separate Tools and Live Debug tabs. Live Debug shows every detected live UCL player scoring/stat change, including whether the player was started or blocked as bench, plus a structured all-matchup fantasy payload inspector with raw weekly stats and raw matchup JSON.

NFL active-game detection no longer treats a date-only schedule value as a kickoff timestamp. Explicit kickoff/start fields are preferred; date-only values are ignored unless paired with an explicit game time. GameView schedule timing uses the same parser.


## v0.5.19 — Starter-Only GameView + Live Score Reconciliation

GameView live ingestion is limited strictly to each fantasy roster's current `starters[]` IDs. Bench-player score changes remain visible only to diagnostics and cannot create live feed entries, animations, recovery plays, or correlated events.

When Sleeper changes a fantasy team total before a started-player point delta appears, GameDay records a non-animated unresolved live scoring summary instead of silently treating the poll as empty. The next poll can then provide the normal player-level event. Internal diagnostics track team-score changes, starter deltas, bench deltas ignored, and unresolved team changes.


## v0.5.18 — Active NFL Game Highlighting

GameDay lineup rows are highlighted yellow when a player's NFL team is currently playing. The detector uses Sleeper schedule `status` as the primary signal and falls back to the scheduled kickoff window (five minutes before kickoff through 4.5 hours after) when direct live status is unavailable. Final/complete status always turns the highlight off. NFL schedule/status refreshes once per minute and is optional, so a schedule endpoint failure never breaks the core GameDay sync.


## v0.5.16 — Sleeper Connection Hardening

Transient Sleeper/API fetch failures are now treated as connection state rather than JavaScript crashes. Core poll data is staged and committed only after the required responses succeed, so a failed poll cannot partially replace the last good users, rosters, or matchups. GameDay keeps the most recent saved/live data visible, shows a compact temporary connection warning, automatically retries on the normal 15-second poll, and clears the warning on recovery. Testing Features includes a Sleeper Connection debug card showing the page scheme/origin, last success/failure, endpoint, and consecutive failure count; this is particularly useful for Android `content://` standalone launches.

## v0.5.15 — YouTube Highlight Searches: Today

GameView highlight links now open YouTube searches with **Upload date → Today** preselected. The URL builder is centralized so the filter token can be updated in one place if YouTube changes its undocumented `sp` encoding. Current desktop and mobile YouTube search surfaces use the same Today token, so GameDay uses one stable URL format across screen sizes rather than maintaining unnecessary device-specific variants.

## v0.5.14 — Flexible Stats, FPTS Breakdown & Shared Team Navigation

- GameDay stat lines now show any detected scoring category regardless of nominal position, while keeping position-appropriate ordering.
- Player fantasy-point totals are tappable across all positions and show nonzero detected stat contributions using the UCL scoring map.
- Negative player totals and negative scoring contributions are emphasized in red.
- GameDay and UCL GameView team arrows now change the same selected team, synchronize between tabs, and wrap at both ends.
- Removed the obsolete v0.1.14 cumulative-score explanatory blurb from Game Flow.

## v0.5.13 — Testing Player Selector Reliability

Testing player dropdowns now use an explicit shared refresh path. Passing, receiving, rushing, and both Tandem passer/receiver selectors refresh when Testing Features are enabled, when Testing Area opens, after roster/matchup refreshes, and when the selected team changes. Selectors preserve a valid current choice and show a disabled `Roster data unavailable` placeholder instead of silently appearing empty when roster data is genuinely unavailable.

## v0.5.12 — True Local Data Reset

Clear Local Data now enters a persistence-suppressed state before deleting storage. GameView playback, pending/correlation queues, the in-memory weekly session, replay state, and transient GameView events are cleared before reload, and pagehide/visibilitychange shutdown saves are blocked during that reload. This prevents previously deleted TEST/live feed entries from being resurrected.

## v0.5.11 — Password-Gated Testing Features

Settings now uses **Show Testing Features** instead of Show Testing Area. Testing features are OFF by default. Enabling them for the first time on a browser requires the password `failspy`. Successful authorization is stored locally so that browser can subsequently turn testing features on and off without another password prompt until local GameDay data is cleared. The authorization flag is deliberately excluded from exported save backups.

When testing features are OFF, the Testing Area navigation entry and testing-only Settings controls (including Simulation) are hidden. Turning testing features OFF never requires the password and immediately exits Testing Area if it is open.

## v0.5.10 — Basic Sound Helper

A minimal generic `playSound(src, options)` helper is available for simple UI effects. No sound files are bundled and no sounds play automatically.

## v0.5.09 — Live Reconciliation Hardening & Edge-Case Plays

- Preserves actual WR/RB/TE position labels when they act as trick-play passers.
- Trick passers now begin in their normal formation slot, move along/behind the line after the snap, receive a backward/horizontal exchange, set, and throw while the QB releases on a route.
- Hard cross-NFL-team correlation guard retained/enforced for pass pairings.
- Adds correction presentation, previous-play update labeling, and queued revision behavior.
- Suppresses sub-1.00 D/ST events except QB hits.
- Adds testable QB kneel, two-point conversion, defensive two-point return, blocked kick, and safety animations.
- Adds detectable completed-pass lateral chains and a testable completion → lateral TD animation.
- Adds offensive teammate fumble-recovery TD handling that is never labeled Scoop & Score.
- Strip-sack + recovery/return/TD evidence is collapsed into one turnover event when the stats support it.
- Goal-line formations are used for two-point conversion tests; safety formations begin backed up near the offense's goal line.


## v0.5.06 — Exact 2026 UCL Scoring Audit

Simulation and Testing Area scoring now use the exact nonzero 2026 UCL scoring settings for league `1386066375474180096` as their offline fallback, while a loaded Sleeper `scoring_settings` object remains authoritative. The shared scorer now applies the TE reception bonus by position, uses the 4.5-point field-goal base plus 0.15 points per yard over 30, scores extra points at 1.5, and maps GameView defensive return-yard aliases to Sleeper's `int_ret_yd` / `fum_ret_yd` scoring keys. The scorer also includes every other nonzero 2026 UCL scoring category so future synthetic/test stat events do not silently fall back to generic fantasy defaults.

Live GameView event creation is unchanged: Sleeper fantasy-point deltas remain authoritative, and raw stat changes only explain/classify those deltas.

## v0.5.05 — UCL Companion Link

The Companion header control now opens the deployed UCL Companion at `https://ucl-companion.netlify.app/` in a new tab. The control remains visible in the compact mobile header so GameDay users can jump to Companion without relying on a local HTML file.

## v0.5.04 — Live by Default + Hidden Testing Area

New installations now enable Live Sleeper Updates by default. An explicit saved OFF preference still wins on later launches. The built-in eight-team fallback is populated immediately even while the first live request is in flight, so slow or unavailable Sleeper data cannot strand first-run team selection.

Testing features are hidden by default. Settings includes a password-gated **Show Testing Features** toggle; after one successful local authorization, the browser may toggle them freely until local data is cleared.

## v0.5.03 — Offline First-Run Team Fallback

All eight UCL team identities are now built into the app as a first-run fallback. A clean install with Live Sleeper Updates still OFF can immediately choose a team and complete setup instead of reaching an empty team selector. The built-in entries are used only when no saved/live roster data exists; cached or live Sleeper roster/user data replaces them as soon as it is available. Team preference survives that transition by using the Sleeper username as the fallback selector identity.


## Layout

- `index.html`
- `module-manifest.json`
- `js/`
- `css/`
- `assets/images/`
- `assets/audio/`

`module-manifest.json` is the authoritative module order. `js/loader.js` reads it,
loads the JavaScript fragments in order, concatenates them into the same shared
lexical scope used by the standalone release, and starts the app.

Because the modular package loads files with `fetch()`, serve this folder through
a web server. For direct local `file://` use, use the separate standalone HTML build.


## v0.4.87 completed-play impact popup

The completed-play GameView popup now prioritizes the fantasy result: player identity is larger, single-impact values explicitly include **FPTS**, and multi-impact plays render each player with a prominent individual FPTS line while the `MULTI IMPACT` / `ONE PLAY` label is intentionally subdued. TOUCHDOWN, SACK, BIG PLAY, MONSTER PLAY, PICK SIX, SCOOP AND SCORE, and KICK SIX banners are positioned lower and remain beneath the popup in stacking order so they cannot cover the fantasy-points readout.


## Testing Area score controls

Testing Area starts with one randomized close matchup score per page load. The baseline remains stable while test plays run and changes only through the ±1 / ±5 controls or New Close Score. Hypothetical event scoring can still drive lead-change context without permanently changing the configured testing score.

API Delta Simulator is a persistent collapsible panel and starts collapsed on first use.

## v0.4.99 simulation stats

GameDay simulations are now stat-first: simulated Sleeper-style weekly stats are generated for each scoring event, fantasy points are calculated from the league scoring settings, Live Lineups shows the accumulating simulated yards/TDs, and GameView delta interpretation consumes those simulated stat changes. Live stats are restored when simulation ends.