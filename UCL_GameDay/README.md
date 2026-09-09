# UCL GameDay v0.5.03 — Modular Package

## v0.5.03 — Offline First-Run Team Fallback

All eight UCL team identities are now built into the app as a first-run fallback. A clean install with Live Sleeper Updates still OFF can immediately choose a team and complete setup instead of reaching an empty team selector. The built-in entries are used only when no saved/live roster data exists; cached or live Sleeper roster/user data replaces them as soon as it is available. Team preference survives that transition by using the Sleeper username as the fallback selector identity.

## v0.5.02 — CTESPN Audio Simplification + Outcome Timing

CTESPN Audio now uses a smaller, clearer event vocabulary. The old dedicated combination-call recordings are removed. Turnovers are split into **QB Intercepted**, **Your Player Fumbled**, **Defensive Interception**, and **Fumble Recovery**. Trick Play has no dedicated sound; a trick play may still trigger the sound for its actual outcome (for example a touchdown). A qualifying late lead change can only add the generic lead-change follow-up after the primary outcome call.

GameView audio is now prepared when playback starts but the automatic call is released at the **outcome** milestone after the action animation rather than immediately at the start of the play. Each resolution also records duration-aware timing metadata so actual clip durations can be tuned against animation milestones once recordings are installed.

The announcer manifest now contains **31 planned clips**. No MP3 files are bundled yet.

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

## CTESPN Audio

v0.4.85 added `js/15_ctespn_audio.js` and `assets/audio/audio-manifest.json`. No sound clips are bundled yet; missing files fail silently except for the Testing Area status message.


## CTESPN announcer library
The app is pre-wired for 31 announcer clips. See `assets/audio/audio-manifest.json` for exact filenames. No audio files are bundled yet. Turnovers use separate offensive and defensive reactions, there is no dedicated Trick Play call, and the old specialized lead-change combination recordings are gone. Each canonical GameView event gets one primary outcome call; a qualifying late lead change may add only the generic lead-change follow-up. Long-rush threshold: 25 yards. Long-reception threshold: 30 yards.

## v0.4.87 completed-play impact popup

The completed-play GameView popup now prioritizes the fantasy result: player identity is larger, single-impact values explicitly include **FPTS**, and multi-impact plays render each player with a prominent individual FPTS line while the `MULTI IMPACT` / `ONE PLAY` label is intentionally subdued. TOUCHDOWN, SACK, BIG PLAY, MONSTER PLAY, PICK SIX, SCOOP AND SCORE, and KICK SIX banners are positioned lower and remain beneath the popup in stacking order so they cannot cover the fantasy-points readout.


## Testing Area score controls

Testing Area starts with one randomized close matchup score per page load. The baseline remains stable while test plays run and changes only through the ±1 / ±5 controls or New Close Score. Hypothetical event scoring can still drive lead-change context without permanently changing the configured testing score.

CTESPN Audio Soundboard and API Delta Simulator are persistent collapsible panels and start collapsed on first use.

## v0.4.99 simulation stats

GameDay simulations are now stat-first: simulated Sleeper-style weekly stats are generated for each scoring event, fantasy points are calculated from the league scoring settings, Live Lineups shows the accumulating simulated yards/TDs, and GameView delta interpretation consumes those simulated stat changes. Live stats are restored when simulation ends.
