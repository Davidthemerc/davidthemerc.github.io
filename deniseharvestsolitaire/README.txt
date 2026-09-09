Denise's Solitaire Harvest v43.2.2 — Return Reward Economy Rebalance

WHAT CHANGED
- Return Reward coin value now starts at roughly 45x the v43.2.1 economy.
- Daily streak coins no longer plateau after 14 days; the streak can keep increasing.
- Rewards are much more varied: coins, gems, Rosie Treats, Windmills, Magic Gates,
  and Rosie Rescues can all appear in Return Reward bundles.
- Day 7, Day 14, and Day 30 streak milestones award substantially larger mixed bundles.
- Weekly and Monthly individual slots are much more valuable.
- Weekly completion reward baseline:
    25,000 coins
    120 gems
    5 Rosie Treats
    3 Windmills
    3 Magic Gates
    3 Rosie Rescues
- Monthly completion reward baseline:
    100,000 coins
    500 gems
    18 Rosie Treats
    8 Windmills
    8 Magic Gates
    8 Rosie Rescues

LOYALTY GROWTH
- Loyalty Rank increases every 7 total return days.
- Each Loyalty Rank adds +10% to future Return Reward value.
- Every 30 total return days adds another +25% permanent reward-value boost.
- Loyalty growth is based on total return visits, so missing a day may reset the
  consecutive Daily streak but does not erase long-term loyalty value.
- The Return Rewards screen now displays Loyalty Rank, total return days, the next
  rank threshold, and current effective coin-value multiplier.

REWARD HISTORY ACCURACY
- New rewards are snapshotted when unlocked so an older collected day always displays
  the exact reward bundle that was actually available at that time.
- Pre-v43.2.2 claimed Daily/Weekly/Monthly rewards still display their original,
  smaller historical reward formulas instead of falsely showing the new values.
- Unclaimed rewards carried forward from older versions can benefit from the new economy
  when they are first resolved under v43.2.2.

MANUAL COLLECTION
- Return visits still unlock Daily/Weekly/Monthly rewards without auto-paying them.
- The player manually collects each reward from the board.
- Collected days remain tappable and open the floating Reward Details dialog.
- Missed Weekly/Monthly days remain recoverable through Makeup Boards.

SAVE / COMPATIBILITY
- Save schema remains v40.
- Existing v43.1/v43.2/v43.2.1 Return Reward history remains compatible.
- Reward snapshots and completion-reward snapshots are sanitized by Save Doctor.

QA
- JS syntax, HTML parsing, CSS parsing, duplicate-ID and literal DOM-reference audits passed.
- 50,000 generated Levels 1–1000: 0 invalid / 0 fallback.
- 20,000 Endless Harvest Levels 1001–2000: 0 invalid / 0 fallback.
- Full 1,000-level runtime campaign clear passed.
- 137 Challenge Hands; all 8 Challenge variants observed.
- All 12 Seasonal Focus variants and all 8 seasonal formations observed.
- 100 Season Baskets and 25 Farm Years completed.
- Level 1000 -> 1001 and Daily season isolation verified.
- Reward tests verified the ~45x starting economy, richer reward variety, Rank 2 growth,
  Day-30 growth, exact reward snapshots, large Weekly completion rewards, and exact
  legacy reward-history display.
- Makeup recovery still recovers both Weekly and Monthly slots and remains isolated
  from campaign/Season/Farm/Mastery progression.
- Save Doctor representative migrations and 1,000 malformed-save cases passed.
