# UCL Companion 2026 — v1.10.21 Stable

Modular source is the source of truth. Use `build/build_standalone.py` to generate the standalone HTML.

## v1.10.21

- Fixes false live-projection decay caused by treating Sleeper's date-only schedule values as midnight kickoff timestamps.
- Explicit pregame/scheduled games retain their full weekly projections.
- Date-only schedule rows no longer prematurely lock bench players.
- Final games still use actual final fantasy points.
- Live decay uses quarter/clock or a genuine timestamp only; when elapsed game progress is unavailable, the baseline is preserved rather than fabricated.

## v1.10.21

- Bundles the supplied 2026 NFL schedule as the authoritative exact kickoff-time table.
- Exact UTC kickoff timestamps are merged with Sleeper schedule rows, preserving Sleeper live status/quarter/clock while replacing incomplete date-only timing.
- The local reference schedule is available even if Sleeper's schedule request fails.
- Pacific display conversion uses `America/Los_Angeles`, automatically switching between PDT and PST at the real daylight-saving boundary.
- Pregame projections, bench lock state, GameDay live detection, and live projection timing can now use true kickoff times for the full season.

## v1.10.21

- Fixes the UCL GameDay live-game counter overstating the number of games in progress.
- Explicit final/closed/complete status now always excludes a game from the live count.
- Explicit live/in-progress/halftime/overtime status counts as live.
- Explicit pregame/scheduled/created status never counts as live.
- The four-hour kickoff-window heuristic is now used only when no usable game status exists.
- Duplicate bundled-reference/Sleeper rows are collapsed before live-state evaluation, with the richer explicit-status row taking precedence.
- Reference-schedule merging now also matches by team pair when Sleeper omits a week field, preventing duplicate fallback rows from surviving the merge.
- `created` is treated as pregame consistently for projection timing and lineup locking.

## Build

```bash
python build/build_standalone.py
```
