Denise's Solitaire Harvest - v5

Open index.html in a modern browser, or upload the entire folder contents to GitHub Pages.

Highlights
- Fixed full-screen gameplay with no page scrolling.
- Startup main menu: Solitaire, Farm, Options, Stats.
- Save/backup/import tools are inside Options.
- Versioned save schema v5; migrates v1-v4 saves.
- Gold coin currency display is visible in gameplay, main menu, and Farm.
- Rosie is represented as a sable/brown farm pup with a pink collar, based on the supplied reference.
- Procedural layouts and variable card counts.
- Wild cards and harvest-earned Windmill cards.
- Every 5-card streak awards immediate coins plus a bonus draw; every 10-card streak adds a Wild bonus draw.
- Card movement, reveal, Windmill, bonus animations, and Web Audio sound effects.

Save compatibility
Progress autosaves to localStorage. Use Options > Save & Backup to export a .dshsave file or text backup before deploying major future updates.

v6 changes
----------
- Fixed completed-level resume bug. A won hand is explicitly marked complete and can never be resumed.
- If you choose Main Menu after a win, visit Farm/Options/Stats, then choose Solitaire, the next level is freshly dealt.
- Rosie reverted to the original simple brown dog graphic with a pink collar.
- Save schema v6 migrates older saves.

v7 changes
----------
- Replaced platform-dependent dog emoji with a fixed inline SVG Rosie graphic.
- Rosie now uses a darker sable/chocolate-brown coat with darker ears/back and warmer muzzle.
- Pink collar is part of the vector graphic itself, so it cannot drift or misalign on Android/mobile browsers.
- Save schema v7 migrates older saves.

v8 changes
----------
- Restored the original simple dog graphic for Rosie; removed custom SVG/recolor/collar work.
- Rosie is centered in the open farm strip between the left edge and crop field.
- Solitaire HUD abbreviates large coin balances (for example 1,676 -> 1.6k).
- Farm and menu currency displays retain the full exact coin balance.
- Mobile solitaire HUD spacing and control sizes tightened to prevent top-row crowding.
- Save schema v8 migrates older saves.

v9 changes
----------
- Fixed abbreviated Solitaire currency display: HUD now uses a separate element and can no longer be overwritten by exact-balance rendering.
- Solitaire shows values such as 1.6k while Main Menu and Farm show the exact coin total.
- Main Menu is now a dedicated opaque full-screen app state.
- Solitaire HUD, field, scenery, tray and effects are hidden while the Main Menu is active.
- On mobile, the Main Menu card itself expands to the full viewport.
- Save schema v9 migrates older saves.

v10 changes
-----------
- Buy Draws: spend 100 coins for +3 stock cards, maximum twice per level.
- Cozy Fence now has a gameplay purpose: owned fences can produce rare Magic Gate charges during harvests.
- Magic Gate lets you move one exposed field card to the bottom of the stock without changing the active waste card.
- Purchased Cozy Fence is visibly drawn around the farm scene.
- Rosie reduced roughly 20% in farm size.
- Barn moved upward so more of it remains visible behind the crop plots.
- Save schema v10 migrates older saves and tracks new powerup statistics.

v11 changes
-----------
- Rosie reduced another ~15%.
- Cozy Fence redesigned as smaller T-shaped fence posts rather than long rails.
- Fence moved visually behind/above Rosie instead of crossing over her.
- Barn remains in its current location but is layered behind the crop plots.
- Save schema v11 migrates older saves.

v12 changes
-----------
- Cozy Fence simplified to two connected T-style fence posts on the left side only.
- Pink Collar now has a gameplay benefit: harvests can occasionally award Rosie's Rescue charges.
- Rosie's Rescue examines up to the next three stock cards and fetches a playable one when possible; otherwise it chooses one of those three. It consumes one charge and resets the streak like a normal draw.
- Collar is visibly indicated on Rosie when the Pink Collar upgrade is owned.
- Save schema v12 migrates older saves.

v13 changes
-----------
- Major mobile Solitaire HUD redesign.
- Top bar is now status/navigation only: Coins, Level, compact Streak meter, Menu.
- Rosie's Rescue, Magic Gate, Windmill, Buy +3 Draws, and Undo moved into a compact bottom power strip.
- Zero-count powerups remain visible but subdued.
- Combo no longer permanently consumes bottom-tray space; it appears as a compact overlay only when a meaningful combo is active.
- Streak header now includes compact numeric progress.
- Instruction banner reduced on mobile to give the tableau more breathing room.
- Save schema v13 migrates older saves.

v14 changes
-----------
- Removed the redundant Combo display; Streak is now the sole visible consecutive-play mechanic.
- Existing escalating chain scoring is retained under the Streak system.
- Added a dedicated power shelf above the bottom tray for Rosie Rescue, Magic Gate, Windmill, and +3 Draws.
- Bottom tray is simplified to Stock, Active/Waste card, and Undo with substantially more spacing.
- Disabled powerups remain subdued without crowding the primary card controls.
- Save schema v14 migrates older saves.

v15 changes
-----------
- Implemented the approved portrait mobile layout.
- Powerups sit on a separate labeled shelf above the primary card tray.
- Stock, active card, and Undo now occupy a clean tray firmly anchored at the bottom of the screen.
- Draw deck presentation reduced in size to prevent overlap.
- Removed remaining Combo UI; Streak is the only visible chain system.
- Added a Fullscreen button beside the Main Menu button using the browser Fullscreen API where supported.
- Responsive phone and short-landscape layouts included.
- Save schema v15 migrates older saves.

v16 changes
-----------
- Fixed the v15 regression where the tableau could collapse to near-zero height on mobile.
- Tableau bounds are now measured dynamically from the actual HUD, power shelf, and bottom tray positions.
- Card renderer enforces a minimum playable field height and width.
- Mobile browser chrome / dynamic viewport changes can no longer push the tableau completely offscreen.
- Orientation and resize events resync the tableau before rendering.
- v15 control layout is otherwise preserved.
- Save schema v16 migrates older saves.

v17 changes
-----------
- Fixed the actual blank-tableau regression introduced when Combo was removed.
- render() still referenced the deleted #streak element, causing JavaScript to stop before cards were rendered.
- Legacy streak DOM access is now null-safe and gameplay no longer depends on removed cosmetic UI.
- Removed the unnecessary v16 dynamic tableau-measurement workaround.
- Restored simple stable CSS tableau bounds while keeping the v15 bottom tray and power shelf layout.
- Added a defensive text-update helper to reduce the chance of future UI removals breaking gameplay.
- Save schema v17 migrates older saves.

v18 changes
-----------
- Reworked long-term difficulty: draw supply no longer shrinks as the player advances.
- Levels now maintain a healthy 24–34-card stock budget, while difficulty shifts toward formation size, blocking, and layout complexity.
- Tableau growth is slower and capped at 30 cards so high levels remain practical on mobile.
- +3 Draws is now a once-per-level emergency purchase for 75 coins.
- Harvest payouts increased substantially: Clover 40, Sunflower 95, Berry 175, Pumpkin 300 coins.
- Windmill harvest chances increased; Cozy Fence Magic Gate chance increased to 12%; Pink Collar Rosie Rescue chance increased to 10%.
- Butterfly harvest bonus increased to 15%.
- Level-completion coin rewards increased and bonus gems now arrive every third level.
- Save schema v18 migrates older saves.

v19 changes
-----------
- +3 Draws may now be purchased three times per solitaire level (3 draws each time, 75 coins each).
- Crop growth is much faster: Clover 1 clear, Sunflower 2, Berry 2, Pumpkin 3.
- Harvest payouts increased again: Clover 45, Sunflower 110, Berry 200, Pumpkin 340 coins.
- Windmill chances greatly increased to 12% / 18% / 25% / 34% by crop.
- A successful Windmill harvest can award 1, 2, or occasionally 3 Windmills.
- Cozy Fence Magic Gate harvest chance increased to 28%; successful rolls can award 2.
- Pink Collar Rosie Rescue harvest chance increased to 30%; successful rolls can award 2.
- Butterfly harvest bonus increased to 20%.
- Consumable rewards intentionally stack because each is a one-time-use gameplay power.
- Save schema v19 migrates older saves.

v20 changes
-----------
- Added a separate Rewards Shop to the main menu; gem currency now has a dedicated consumable economy.
- Magic Dice (3 gems): once per match, roll 1–6 and remove one exposed card 1 or 2 ranks above the roll.
- Lucky Seed (4 gems): once per match, turn one exposed field card into a Wild.
- Sun Charm (3 gems): once per match, inspect the next 3 stock cards and choose a playable one when available.
- Shop rewards remain in inventory until used and can be purchased repeatedly.
- Added in-game inventory controls and per-match use limits for all three shop powers.
- Save schema v20 migrates v19 saves.

v21 changes
-----------
- Replaced the always-visible seven-item power shelf with a compact Magic Pouch.
- Solitaire now shows one Magic Pouch button above the card tray with a badge for owned consumables.
- Tapping the pouch opens a compact pop-up containing Rosie Rescue, Magic Gate, Windmill, Magic Dice, Lucky Seed, Sun Charm, and +3 Draws.
- The pouch closes automatically when a power is selected, restoring maximum tableau visibility.
- Existing inventories, gem-shop purchases, per-match limits, and +3 Draw purchases are preserved.
- Save schema v21 migrates v20 saves.

v22 changes
-----------
- Magic Dice, Lucky Seed, and Sun Charm are now permanent gem-shop unlocks rather than consumables.
- Each permanent reward can still be activated only once per solitaire match.
- New permanent unlock prices: Magic Dice 18 gems, Lucky Seed 24 gems, Sun Charm 20 gems.
- Existing v21 saves automatically convert any owned Dice/Seed/Sun inventory into the corresponding permanent unlock, so previously earned purchases are not lost.
- Permanent powers display ∞ in the Magic Pouch until used for the current match; locked powers display a lock.
- Farm-derived Rosie Rescue, Magic Gate, and Windmill remain stackable consumables.
- Save schema v22 migrates v21 saves.

v23 changes
-----------
- Fixed Magic Pouch refresh regression from v22: permanent purchases now immediately update the pouch badge and contents.
- Magic Dice / Lucky Seed / Sun Charm permanent unlocks are correctly detected after purchase and after loading a save.
- Magic Pouch can always be opened, including with zero owned powers.
- +3 Draws is confirmed as a Magic Pouch action and now contributes up to 3 remaining purchase opportunities to the pouch availability badge when affordable.
- Pouch badge now counts currently usable actions rather than only raw inventory.
- Permanent powers show infinity while available, a check mark after their once-per-match use, and a lock if not purchased.
- Unavailable power taps no longer unnecessarily close the pouch.
- Added a static audit for stale JavaScript element references.
- Save schema v23 migrates v22 saves.

v24 changes
-----------
- Fixed the Magic Pouch popup being completely clipped by an obsolete v16 `contain: layout paint` rule on the power shelf.
- Power shelf and pouch popup now explicitly allow visible overflow.
- Raised pouch popup stacking layer and restored pointer interaction throughout the popup.
- Added aria-expanded synchronization and Escape-key closing.
- Empty pouches remain fully openable; +3 Draws remains available inside the pouch.
- Save schema v24 migrates v23 saves.

v25 changes
-----------
- Added a passive Farm Harvest that matures every 30 real-world minutes, including while the app is closed.
- Up to 3 timed harvests (90 minutes) accumulate; further harvests do not accumulate until claimed.
- Each timed harvest pays 150 coins plus 25 per unlocked farm region. Bigger Barn adds another 10%.
- Each timed harvest has a 9% chance to award 1 gem.
- Added Rosie Find: each timed harvest has a 12% chance for Rosie to find a farm consumable; with Cozy Fence owned, some finds become Magic Gates.
- +3 Draws upgraded to +5 Draws.
- Up to three +5 Draws packs remain available per solitaire level, with escalating prices: 175, 275, then 400 coins.
- The Magic Pouch displays the current +5 Draws price and only counts draw purchases the player can presently afford.
- Corrected outdated crop descriptions in the Farm screen to match the current faster growth and more generous payouts.
- Save schema v25 migrates v24 saves and preserves offline timer progress from the migration moment.

v26 changes
-----------
- Added centralized js/config.js for draw prices, crop values, timers, probabilities, happiness gains, streak milestones, scoring, and achievements.
- Added persistent Rosie Happiness (0–100) with no real-time decay.
- Farm visits, crop/timed harvests, level completion, upgrades, long streaks, petting, treats, and Rosie Finds can raise Happiness.
- Rosie can be petted every 30 minutes; stackable dog treats are now found occasionally and can be fed for larger Happiness gains.
- Higher Happiness raises Rosie Find odds. Reaching 100 prepares Rosie's Treasure for the next timed harvest; Treasure pays coins, gems and farm powers, then Happiness returns to 75.
- Added Harvest Streak multiplier: each timed harvest advances a +5% step, capped at +25%, with no late-claim penalty.
- Added Perfect Clears: finish without purchased draw packs or pouch powers for a substantial coin bonus and a gem chance.
- Added 1–3 star level grading and persistent best-star storage by level.
- Reworked streak milestones: 5 = coins, 10 = bonus draw, 15 = uncover a hidden card, 20 = active Wild; pattern repeats.
- Added reward toast animations and dedicated Rosie Find / Treasure presentations.
- Added animated Magic Dice roll.
- Targeted powers now highlight eligible cards, dim invalid cards, and show a Cancel Power bar.
- Expanded Stats for timed harvests, perfect clears, stars, Rosie, treats, powers and achievements.
- Added five achievement milestones with gem rewards.
- Save schema v26 migrates v25 saves.

v27 changes
-----------
- Added special tableau mechanics that phase in gradually:
  Vines (level 8), Flowers (12), Crates (16), Golden Cards (20), Mud (24), Chains (30), and rare Rainbow Cards (36+).
- Vines unlock after a nearby card is cleared; Crates require two nearby clears.
- Flower Cards add a stock draw when cleared.
- Golden Cards pay bonus coins with a rare gem chance.
- Mud Cards cannot be transformed by Lucky Seed.
- Chained Cards require a 3-card streak for normal play.
- Rainbow Cards are premium Wilds that pay coins and add a draw.
- Obstacle levels automatically receive 1–5 additional stock cards based on obstacle difficulty.
- Added six formation families: Orchard Rows, Garden Gate, Trellis, Creek Crossing, Harvest Spiral, and Windmill Ring.
- Added a level-preview banner showing formation, special-card types, and obstacle draw compensation.
- Added Garden Shears as a non-inventory rescue mechanic in the Magic Pouch.
  Obstacle levels begin with 1 Shears charge; clearing 8 tableau cards earns another, with a maximum of 2 charges.
  One charge cuts away any exposed card without changing the waste, but resets the streak and counts as an assist for Perfect Clear.
- Power targeting now understands Mud and Garden Shears.
- Special-card rewards trigger no matter how the tableau card is cleared, including Shears or other powers.
- Expanded stats for special cards, Golden Cards/Gems, and Garden Shears.
- Undo snapshots now restore gems and key consumables as well as coins/game state.
- Save schema v27 migrates v26 saves.

v28 changes
-----------
- Farm Regions are now fully explorable rather than passive names. Use left/right arrows to revisit any unlocked region.
- Each of the five regions has a distinct CSS-drawn visual atmosphere and a region-specific gameplay bonus:
  Meadow Patch: +5% crop Windmill chance.
  Sunflower Hollow: +10% crop coin payouts.
  Rosie Creek: +8% Rosie Find chance.
  Golden Orchard: +3% timed-harvest gem chance.
  Harvest Ridge: +15% timed-harvest coin payouts.
- Crops now unlock by region and have a home region. Growing a crop in its home region pays +15%.
- Added Orchard Apples as a new crop in Golden Orchard.
- Existing planted crops from older saves remain harvestable; v28 adds region metadata only to newly planted crops.
- Added one permanent region decoration per region:
  Songbird Bath, Sunflower Lanterns, Creek Footbridge, Orchard Bench, and Harvest Weather Vane.
  Each has a small global mechanical bonus in addition to its visual presence.
- Region unlocks now award one-time progression packages of coins, gems, treats, and/or farm powers.
  Existing v27 saves can claim previously unlocked region packages retroactively on the next Farm visit.
- Newly unlocked regions become the active Farm view automatically.
- Timed harvest calculations now respond to the active region and applicable region decorations.
- Stats now track regions unlocked, regional decorations, and Orchard Apples harvested.
- Save schema v28 migrates v27 saves.

v29 changes
-----------
- Added Daily Challenge to the Main Menu.
- Every local calendar day generates one deterministic seeded Solitaire board. Restarting/retrying that day reproduces the same formation, tableau cards, special-card placement, starting waste, and stock.
- Daily difficulty varies from challenge level 18–30 and includes the v27 obstacle system where appropriate.
- Daily boards receive +2 additional starting stock cards on top of normal obstacle compensation.
- Daily Challenges are unlimited-retry with no lives/energy system.
- First clear each day awards 300 coins, 3 gems, and one deterministic farm power (Windmill, Magic Gate, or Rosie Rescue).
- A Perfect Daily Clear (no purchased draw packs and no powers/Shears) adds +1 gem.
- Consecutive daily wins build a persistent Daily Win Streak. Every 7th consecutive day awards +2 additional gems and 1 Rosie Treat.
- After the daily reward is claimed, the same board can still be replayed for score, but repeat clears cannot mint the main reward again.
- Daily Gold/Rainbow cards and streak coin milestones convert their repeatable currency portions into challenge score, preventing replay farming while keeping their gameplay effects.
- Added Daily Challenge status, reward preview, win streak, and best Daily score UI.
- Added Daily Challenge stats: attempts started, completions, Perfect clears, and best win streak.
- Daily completion does not advance the normal Solitaire level or grow crops.
- Save schema v29 migrates v28 saves.

v30 changes
-----------
- Fixed the timed Farm Harvest cap exploit. Only 3 half-hour charges can ever be stored.
- If the farm has been capped at 3/3, claiming those charges discards all excess offline elapsed time and restarts a fresh 30:00 timer from the claim moment.
- Shorter uncapped gaps still preserve partial progress correctly.
- Farm Harvest now displays "3/3 FULL" and explicitly says storage is capped at 3.
- Added Rewards Shop Tier II permanent upgrades:
  Enchanted Dice — 45 gems: Magic Dice rolls 1–10 instead of 1–6, still once per match.
  Twin Lucky Seed — 55 gems: Lucky Seed can be used twice per match.
  Brilliant Sun Charm — 50 gems: Sun Charm searches the next 5 stock cards instead of 3.
- Tier II upgrades require ownership of their corresponding base permanent power.
- Magic Pouch availability/counts and tooltips now understand Twin Lucky Seed's two charges.
- Added Tier II upgrade ownership to Stats.
- Save schema v30 migrates v29 saves.

v31 changes
-----------
- Added the Harvest Almanac / Collection Book to the Main Menu.
- Almanac categories: Special Cards, Crops, Farm Regions, Powers, and Rosie milestones.
- Entries are hidden until discovered; migrated saves intelligently reveal content already reached/unlocked.
- Collection progress is shown on the Main Menu and in the Almanac.
- Reworked Rosie Rescue into a context-sensitive board assistant:
  * If two identical playable cards can form a short chain, Rosie can nudge one forward/back one rank to create a mini-streak.
  * If the player is stuck with an empty stock, Rosie clears 1 or 2 exposed field cards at random.
  * If the active card cannot play anything but stock still exists, Rosie conjures a highly useful replacement active card even if it was never in the deck.
  * If a play already exists but no duplicate-chain opportunity does, Rosie can alter another exposed card to create a continuation.
  * As a last resort against a field of locked/special cards, Rosie directly clears one exposed trouble card.
- Rosie Rescue no longer requires at least two stock cards and always chooses an outcome based on the current board.
- Added Rosie Rescue outcome stats: cards cleared, nudges, and magical active-card swaps.
- The mobile Main Menu is re-compressed into a non-scrolling two-column layout with Solitaire/Daily Challenge spanning full width.
- Save schema v31 migrates v30 saves.

v32 changes
-----------
- Added an optional Mission Board before every normal Solitaire level.
- The player is offered exactly 3 procedurally selected missions and may choose ONE or skip missions entirely.
- Once selected, the mission is locked to that level. Restarting the level keeps the same chosen mission rather than rerolling three new choices. Failing the completed attempt means no mission reward.
- Mission types include Streak Farmer, Stock Saver, No Help Needed, Frugal Farmer, Natural Harvest, Rosie's Route, Treasure Hunter, and Clean Sweep.
- Mission selection respects level/content requirements; obstacle-dependent Treasure Hunter only appears when the board actually contains special cards.
- No Help Needed / Natural Harvest fail immediately if a power is used. Frugal Farmer fails if extra draws are purchased.
- Mission progress appears in a compact in-game HUD chip.
- Completing a mission awards level-scaled bonus coins, with a 16% gem chance and 24% chance for a Windmill, Magic Gate, or Rosie Rescue.
- Mission rewards are only paid after the level itself is successfully cleared.
- Added mission statistics for missions chosen, completed, and failed.
- Daily Challenge remains separate and does not use the Mission Board.
- Save schema v32 migrates v31 saves.

v33 changes
-----------
- Added Farm Orders as persistent bonus objectives on the Farm.
- Exactly three active orders are maintained: Easy, Standard, and Premium.
- Orders only request crops the player has already unlocked.
- Harvesting a crop advances EVERY active order requesting that crop; crops do not need to be assigned to a single order.
- Completed orders pay substantial bonus coins and immediately generate a replacement order of the same tier.
- Standard/Premium orders have progressively better chances for gems and farm powers; Rosie Happiness slightly improves those bonus odds.
- Added a daily In-Demand crop. Harvesting that crop pays +25% normal crop coins for the day and is visibly marked on the Farm.
- Farm Order progress, rewards, and In-Demand crop persist in save data.
- Added Farm Order statistics.
- Added Reset Game Save under Options. Reset requires confirmation plus typing RESET and clears the browser-local save.
- Added a password-gated Developer Menu. Password: failspy.
- Developer tools include +coins, +gems, +farm powers, max Rosie Happiness, force 3/3 timed harvest, mature crops, unlock shop powers, unlock all farm content, reveal the Almanac, regenerate Farm Orders, clear Daily Challenge claim, and set the level.
- Developer access is session-only and is not stored in the save.
- Save schema v33 migrates v32 saves.

v34 changes
-----------
- Added 10-level Chapters to campaign progression, with named themes through Level 100 and repeating Endless Harvest chapters afterward.
- Main Menu now shows the current Chapter, level position, progress bar, and next Milestone.
- Every 10th level is a Milestone Level with a special broad Ridge formation and +4 additional stock cards.
- Later Milestones deliberately mix more special-card mechanics; Level 36+ Milestones can include a guaranteed Rainbow element.
- First-time Milestone clears award a large level-scaled coin bundle, bonus gems, and +1 Rosie Rescue.
- Milestone rewards are first-clear only, while failed Milestone levels can be retried normally.
- Added a Milestones tab to the Harvest Almanac covering Levels 10 through 100.
- Added Milestone completion, coin, and gem statistics.
- Save schema v34 migrates v33 saves.

v35 changes
-----------
- Added Barn Key + Barn Lock: clear the matching Key before its Lock can be played. Generation places Keys above their Locks to prevent self-locking dependencies.
- Added Watering Can cards: clearing one turns a random exposed ordinary card into a Wild.
- Added Bee cards: when drawing from stock, an exposed Bee can buzz by swapping field positions with another exposed ordinary card.
- Added linked Harvest Chain cards. Clearing linked cards consecutively awards 25 coins at two cards; a three-card chain awards another 50 coins and +1 streak progress. Drawing or breaking the chain resets it.
- Added smarter late-game complexity scaling and extra obstacle stock compensation instead of relying only on increasing tableau size.
- Added the new v35 special cards to the Harvest Almanac discovery system.
- Save schema v35 migrates v34 saves.

v36 changes
-----------
- Added Rosie's Adventures: Quick Sniff (30 min), Farm Patrol (60 min), and Big Adventure (120 min).
- Choose any unlocked Farm Region as Rosie's destination; each region favors a different reward category.
- Only one adventure can be active at a time. It uses real elapsed time and persists while the game is closed.
- Rosie disappears from her normal farm position while exploring and must be welcomed home before another adventure begins.
- Rosie Happiness improves gem, power, and rare-find odds without being required.
- Added four rare Adventure Finds: Lucky Clover (double next Farm Order coins), Curious Feather (+3 stock next normal level), Shooting Star (+1 guaranteed gem next normal clear), and Rosie Cache (openable randomized bundle).
- Main Menu Farm button reports when Rosie is exploring or has returned.
- Added Rosie Adventure statistics and Adventure Finds to the Harvest Almanac.
- Developer Menu can instantly finish an adventure or force a rare Adventure Find.
- Save schema v36 migrates v35 saves and includes all adventure state/history/finds.

v37 changes
-----------
- Added deterministic 6-hour weather periods with a visible forecast: Sunny, Rain, Windy, Rainbow, Fog, Storm, and Perfect Day.
- Weather modifies crop payouts/growth, Solitaire stock/rewards/special appearances, Windmill finds, and Rosie Adventure rewards without making any period a hard blocker.
- Added daily chance-based Farm Events: Market Day, Bumper Crop, Rosie Day, Gem Rush, and Harvest Festival.
- Harvest Festival tracks 3 Solitaire clears and awards 500 coins + 2 gems once per event day.
- Added Farm Bulletin to Main Menu and Farm with current weather, remaining time, next forecast, event details, and Festival progress.
- Weather/event schedule is deterministic from local time/date, so reloads and ordinary save imports do not reroll it.
- Developer Menu can cycle Weather, start/change Farm Events, and complete the Festival objective.
- Save schema v37 migrates v36 saves and persists event progress plus developer overrides.

v38 changes
-----------
- Added Denise's Farmhouse to the Main Menu as a permanent visual progress room.
- The Farmhouse includes a Trophy Shelf, Chapter Wall, Rosie's Corner/Toy Box, Harvest Cabinet, Achievement Tiers, Rosie's Journal, and Lifetime Stats.
- Added 14 permanent trophies, including chapter milestones, streak/perfect/order/adventure accomplishments, funny hidden accomplishments, and the secret Goodest Girl trophy.
- Trophy rewards are recorded before their notification and are one-time only.
- Added Bronze/Silver/Gold achievement tiers for Farmhand, Card Sharp, and Rosie's Explorer, awarding 1/2/3 gems.
- Completed chapter milestones place permanent keepsakes on the Chapter Wall through Level 100.
- Rosie's Adventures can now rarely return with one of six unique collectible toys: Squeaky Bear, Tennis Ball, Giant Bone, Rope Toy, Squeaky Duck, and the Mysteriously Acquired Shoe.
- Toys are pure collectibles and permanently appear in Rosie's Corner.
- Added Rosie's Journal with adventure totals, favorite destination, rare finds, reward totals, and Toy Box.
- Added lifetime coin/gem earned/spent accounting beginning with v38. Older saves begin lifetime wallet accounting from their imported v38 balance rather than fabricating historical totals.
- Added Farmhouse/Toy/Trophy statistics.
- Developer Menu can give a random Rosie toy, unlock a test trophy, add tier-achievement progress, complete Chapter keepsakes, and reset trophy/tier flags for testing without removing previously granted rewards.
- Save schema v38 migrates v37 saves.

v39 changes
-----------
- Solitaire Evolves: later levels now gain Heavy, Sleeping, and Sunflower tableau cards while retaining the existing Vines, Chains, Barn Locks, Bees, Watering Cans, and Harvest Chains.
- Heavy Cards require two valid interactions: first crack, then clear. Sleeping Cards wake after four clears. Sunflower Cards uncover a hidden card when cleared.
- Added a once-per-level Reserve Slot: preserve the active card and draw a replacement, then plan around the saved value. Reserve is disabled in Daily Challenge.
- Added rare Preview Choice draws: choose between the next two stock cards; the unchosen card returns deeper into the stock.
- Added Lucky Hands (~1 in 12) with +3 stock and a bonus Wild.
- Added optional Challenge Hand offers on periodic later levels. Accepting adds tougher mechanics and pays +750 coins +2 gems on victory; declining has no penalty.
- Existing selectable Mission Board continues to serve as the optional secondary-objective system.
- Long-term difficulty remains bounded by the existing 14–30 tableau-card and 24–34 base-stock ranges; later challenge comes increasingly from mechanic combinations rather than draw starvation.
- Added Farmhouse trophies for Reserve strategy, Challenge Hands, ten Challenge wins, and perfect Lucky Hands.
- Added v39 statistics for Reserve, Challenge/Lucky wins, Preview Choice, and the new special cards.
- Save schema v39 migrates v38 saves.

v40 changes
-----------
- Major stabilization, balance, accessibility, save-reliability, and mobile-polish release.
- Save schema v40 migrates v39 saves.
- Added Save Doctor under Options. It validates core progression, currency, Rosie state, farm plots, Farm Orders, settings, statistics, timestamps, and active Rosie Adventures, then safely repairs malformed values.
- Save Doctor creates a pre-repair automatic backup when repairs are required.
- Added three rotating local automatic backups (A/B/C), refreshed at most once every five minutes during autosave activity.
- If the primary local save becomes unreadable at startup, v40 can recover from the newest readable automatic backup.
- Added Restore Latest Auto Backup to Options.
- Exported .dshsave files now include version/date metadata, a concise save summary, and a checksum.
- Import now previews Level/coins/gems/Rosie/trophies, validates checksums when present, warns about repairs, and backs up the current local save before replacement.
- Reset Game Save now also removes the rotating automatic backups.
- Added a Developer Diagnostics section: Level 1–500 audit, sample Level 1/50/100/500 generation, economy snapshot, save validation, safe corruption/repair test, diagnostic report copy, and mechanic-notice reset.
- Added an internal deterministic level-generation audit. v40 difficulty uses central stock/tableau bounds instead of unbounded level-number escalation.
- Normal procedural tableau size remains capped at 30; starting stock is centrally bounded to 24–44 before weather, with weather allowed up to 48.
- Emergency +5 Draw packs retain their escalating base prices and now gain a +50 coin surcharge every 10 campaign levels so they remain an emergency purchase later in progression.
- Added SFX Volume control.
- Added High Contrast Cards, Large Card Values, and Color-Independent Suit Aid options.
- Expanded keyboard support: focusable tableau cards; Enter/Space plays focused cards; focusable stock pile; D draws, R uses Reserve, U undoes, and P opens/closes the Magic Pouch during unobstructed gameplay.
- Added first-time mechanic notices with one-time explanations for Reserve, Vines, Crates, Chains, Keys/Barn Locks, Watering Cans, Bees, Harvest Chains, Heavy/Sleeping/Sunflower cards, Mud, Rainbow, Flower, and Golden cards.
- Mechanic notices can be disabled in Options or reset through the Developer Menu.
- Added additional Web Audio cues for Rosie Rescue, Heavy Card cracking, and achievements.
- Added a short Rosie paw-print trail animation to Rosie Rescue; Reduced Motion disables it.
- When Rosie returns from an Adventure she can peek onto the Main Menu; tapping her opens the Farm.
- Added stronger internal panel scrolling/safe-area/mobile layout rules so gameplay stays fixed while large menus scroll within their own panels.
- Retained and regression-tested the 3/3 timed-harvest cap, Weather/Events, Farm Orders, Farmhouse, Daily Challenge, Mission Board, v39 Reserve/Challenge/Lucky Hands, and all prior save migrations.

v40.1 bug-fix / general error pass
----------------------------------
- Fixed Daily Challenge completion occasionally leaving an empty tableau without opening the completion screen.
- Root cause fixed: Daily completion contained an invalid reference to a normal-level Shooting Star reward detail. Shooting Star is now correctly preserved for the next NORMAL Solitaire clear.
- Added a centralized tableau-completion guard used by normal card play, Garden Shears, Magic Gate, Rosie direct clears, Magic Dice, Windmill, draw-pile interaction, and a final render safety net.
- If the tableau is already empty, tapping Draw now routes to completion before any stock-empty warning can appear.
- Fixed a contradictory stale "No cards remain in the draw pile" message remaining visible after bonus/added stock appeared.
- Empty stock is now visually dimmed so an actually exhausted draw pile is unmistakable.
- Fixed a separate Rosie Adventures runtime error caused by a missing unlockedRegionIndex() helper in farm.js.
- Restored the Shooting Star Adventure Find's intended behavior: it is consumed only by a completed normal Solitaire level and guarantees +1 gem there.
- Added build marker 40.1 while retaining save schema v40; no save migration is needed from v40.
- Added cache-busting ?v=40.1 asset URLs so GitHub Pages/mobile Chrome is less likely to mix old JS/CSS with the new index after deployment.
- General static error pass: TypeScript checkJs high-signal undefined-name scan is clean across all JS files.
- Runtime smoke tests now cover Farm rendering, Daily completion, Shooting Star preservation in Daily, Shooting Star consumption on normal clears, and stock-count/message synchronization.

v40.2 Farm Feedback & Active Collection
---------------------------------------
- Farm Orders no longer auto-pay or instantly replace themselves when completed.
- A completed Easy/Standard/Premium Farm Order freezes in a READY state until the player taps COLLECT REWARD.
- Harvests made while an order is waiting do not secretly count toward its replacement.
- Collecting the reward generates that tier's replacement order.
- Lucky Clover is now consumed when the player chooses which completed order to collect; it doubles that collected order's coins.
- Farm Order cards visibly pulse when matching harvest progress is made and get a stronger READY state when completed.
- Main Menu Farm status and the Farm Orders header show when order rewards are waiting.
- Planting now gives plot-local feedback showing exactly which crop was planted.
- Growing plots retain a visible crop identity icon/name instead of showing only a generic seedling.
- Mature crops have a clearer ready-to-harvest animation.
- When all six plots are occupied, every Plant button visibly grays out and reads Fields Full until a plot is harvested.
- Crop harvesting now uses local floating feedback instead of an interrupting popup: coins, Rosie Happiness, Home bonus, In Demand bonus, Bumper bonus, Windmills, Gates, Rescues, Treats, and Farm Order progress can all appear directly above the harvested field.
- The farm coin balance pulses when harvest/order coins arrive.
- Rosie Adventure homecoming now has a dedicated reward reveal popup with individual cards for coins, gems, powers, rare finds, and newly discovered toys.
- While Rosie is away, Pet Rosie and Treat are disabled and grayed out. They remain disabled after she returns until her Adventure homecoming/reward collection is acknowledged.
- Returned Rosie is visible and can be tapped directly to reveal/collect her Adventure rewards.
- Farmhouse trophies now unlock separately from their rewards. Newly earned trophy rewards wait in Denise's Farmhouse for manual collection.
- Bronze/Silver/Gold achievement-tier rewards likewise wait for manual collection.
- Main Menu Farmhouse status and the Farmhouse itself show how many rewards are waiting.
- Existing v40/v40.1 saves are protected from duplicate rewards: trophies and tier achievements that were already auto-paid are automatically marked as previously collected.
- Added Developer Menu helpers to complete Farm Orders and mark the test trophy reward unclaimed.
- Build marker/cache-busting updated to 40.2; integer save schema remains v40 for full v40/v40.1 compatibility.

v40.3 Milestone / Blank-Hand Recovery
-------------------------------------
- Fixed the Level 10/20/30/etc. Milestone Ridge generator using an obsolete card relationship format. Milestone cards now use the same blockers array and normalized 0-1 coordinates as every other formation.
- This fixes the blank-tableau / apparent Level 1 screen seen when starting Level 30. The save itself was not necessarily reset; the old build crashed before replacing the HTML placeholder HUD.
- blocked() now defensively accepts legacy coveredBy relationships instead of crashing on a missing blockers array.
- Added board-data validation for card IDs, blocker arrays/references, normalized coordinates, exposed starting cards, and stock targets.
- Normal and Daily level starts use buildSafe(); any future malformed generated board falls back to a healthy Recovery Meadow instead of leaving the game screen blank.
- Level HUD now displays the actual campaign level immediately while a field is being prepared, so a build failure can no longer masquerade as Level 1.
- Added highestLevelReached as a redundant campaign checkpoint. If a save's level field is missing/regressed, v40.3 reconstructs it from the checkpoint and completed-level evidence rather than silently defaulting to Level 1.
- Developer Set Level updates the redundant checkpoint too.
- Developer level diagnostics now run the same structural board validator that gameplay uses.
- Build marker/cache-busting updated to 40.3; save schema remains v40.

v40.4 Broad-Spectrum Solitaire QA / Reliability Pass
----------------------------------------------------
This patch is intentionally system-heavy rather than feature-heavy. The main Solitaire
engine was exercised through generator simulation, full level clears, randomized action
fuzzing, targeted fault injection, Daily/Challenge/Restart tests, and save regressions.

Generator / special-card safety
- Fixed real circular-dependency deadlocks involving Vine and Crate requirements.
  Requirement selection now traverses both physical blockers and other special
  requirements before adding an unlock dependency.
- Added structural solvability validation to generated boards.
- Sleeping Cards can no longer spawn in positions that can become reachable before the
  required four prior clears.
- Chain Cards are placed later in the dependency graph and now permanently unlock once a
  3-card streak has been achieved during the hand.
- Added a Chain safety release: if locked Chain Cards become the only actionable tableau
  route, they release rather than forcing the player to spend a power.
- 50,000 seeded boards across Levels 1-500 passed the final structural validator with
  zero fallback/recovery boards.

Restart / hand consistency
- Normal Restart now replays the same generated deal instead of rerolling the field.
- The selected Mission Board choice remains selected on Restart.
- Skipping the Mission Board remains skipped on Restart.
- An accepted or declined Challenge Hand decision remains the same on Restart.
- Lucky Hand status remains the same on Restart.
- Curious Feather's +3 starting stock persists on Restart but the Feather is consumed
  only once, rather than once per retry.
- The hand's weather effects are frozen with the deal so crossing a weather-period
  boundary cannot change the board/reward conditions on Restart.

Completion / transition reliability
- Completion is now transactional. If the reward/win flow throws after partially changing
  coins, gems, stats, level, or the local save, those changes are rolled back before one
  controlled retry.
- A persistent completion error can no longer enter a rapid retry loop and repeatedly
  duplicate rewards; after one failed retry the player is returned safely to Main Menu.
- Normal and Daily level startup are likewise transactional so a startup exception cannot
  consume a Curious Feather or partially mutate persistent state.
- Start-failure recovery now clears Mission, Challenge, Preview Choice, and mechanic
  overlays instead of allowing a stale modal to survive on Main Menu.
- Explicit regression coverage was added for the reported path: Level 29, zero stock,
  purchase +5 Draws, clear the last card, press Next Level, successfully enter Milestone
  Ridge 30.

Undo / economic integrity
- Undo snapshots now include lifetime currency accounting and Farmhouse trophy/tier
  earned/claimed state.
- Undoing an immediate Golden/Rainbow/etc. reward no longer creates fake lifetime
  "earned then spent" totals or leaves an achievement earned from a move that no longer
  happened.
- Leaving the Solitaire table for Main Menu commits the current Undo history so an old
  Solitaire snapshot cannot erase later Farm/Farmhouse currency activity.
- Buying a +5 Draw pack is now an economic commit boundary. An older card-move Undo can
  no longer refund the pack or restore the pre-purchase stock.
- Preview Choice can be undone safely; Undo restores both its stock state and the visible
  choice prompt instead of leaving an invisible pending-choice soft lock.
- Attempting Reserve with zero stock no longer creates a useless Undo snapshot.

Powers / special interactions
- Magic Dice rolls are committed once rolled. Cancelling targeting or switching powers
  can no longer reroll the Dice for free; reopening Dice resumes the saved result.
- Assisted clears (Shears, Dice, Windmill, Rosie direct clears) now count toward Sleeping
  Card wake progress.
- Draws, Preview Choice, Reserve draws, Heavy cracking, Shears, Gate, Dice, Rosie active
  card changes/direct clears, Sun Charm, and Windmill correctly break an in-progress
  Harvest Chain where appropriate.
- Magic Gate now behaves as a MOVE rather than a clear: moving a Golden/Flower/Watering/
  Rainbow special into stock no longer incorrectly grants that card's clear reward or
  cleared-special statistics.
- Bee movement now swaps the Bee/card contents between exposed structural slots rather
  than moving tableau node coordinates away from their blocker graph.
- Mission state is re-evaluated after assisted clears and stock-changing special effects.

Mission / modal reliability
- Reversible mission states (Stock Saver, Frugal Farmer, No Help Needed, Clean Sweep)
  can no longer remain visually stuck on COMPLETE after their condition is broken.
- Failed missions explicitly display FAILED in the gameplay chip.
- Preview Choice, Reserve draw, and Sun Charm now update stock-sensitive mission state
  consistently.
- Challenge Hand offers wait until the Mission Board has actually been chosen/skipped.
- Challenge offers also wait until first-time mechanic notices are dismissed, preventing
  stacked modal dialogs.
- Challenge-added Sleeping Cards avoid existing special requirement targets and are
  placed only where enough prerequisite clears exist.
- The delayed Mission Board callback now verifies the player is still at the table before
  opening, preventing it from popping up after a fast return to Main Menu.
- Stock Saver is now a legitimate Level 1 mission so the Mission Board no longer fills its
  third Level 1 slot with a mission whose minimum level had not been reached.

Other fixes found during the sweep
- Farm-render regression fixed: tapping Rosie at home once again pets her after normal
  Farm re-renders; returned Rosie still opens her Adventure homecoming rewards.
- Mission/milestone-awarded farm powers now increment their corresponding "found" stats.
- Added explicit beeBuzzes default statistic.
- Normal win reward counters now display the total coins/gems actually granted by the
  completion flow, including mission/milestone/challenge/achievement/region bonuses,
  instead of only the base reward subset.
- Pause/Main navigation is blocked during in-flight card/Windmill animations to prevent
  asynchronous completion from racing navigation.

QA performed for v40.4
- 50,000 generated boards across Levels 1-500: zero structural validation failures and
  zero Recovery Meadow fallbacks.
- Full runtime autoplay clear of every Level 1-500 through real play/special/win logic.
- 500 randomized hands / over 23,000 mixed gameplay actions including Draw, Preview,
  Reserve, Undo, +5 Draws, Rosie, Gate, Seed, Sun Charm, Dice, Shears, and Windmill.
- All 66 Challenge-offer levels from 42 through 500 tested for sequencing and safe
  dynamic obstacles.
- Daily Challenge deterministic retry and completion regressions.
- Exact normal-hand Restart signature tests including accepted Challenge, Weather,
  Mission selection/skip, Lucky state, and Curious Feather.
- Save migration/repair/checksum/backup recovery and Level-30 inference regression.
- v30 3/3 timed-harvest cap regression retained.
- JavaScript syntax, literal HTML ID references, and high-signal undefined-name/type
  checks clean across the project.
- Build marker/cache-busting updated to 40.4. Integer save schema remains v40.


v40.5 Solitaire Gameplay Polish
-------------------------------
- Added a compact in-hand status strip for remaining Stock, Chain unlock progress, and
  Sleeping Card wake progress. It automatically hides on very short displays.
- Low stock is visually flagged at three cards or fewer.
- Playable exposed cards now receive a clearer highlight.
- Power targeting is substantially clearer: eligible cards pulse/highlight and invalid
  Lucky Seed / Magic Dice targets are visually subdued.
- Locked special cards have stronger visual differentiation.
- Chain Card labels now show live streak progress and OPEN status.
- Sleeping Card labels now show live clear progress and AWAKE status.
- Barn Locks explicitly show KEY / OPEN state.
- Invalid ordinary card taps now explain exactly which two ranks are playable from the
  current active card instead of only saying the selected card is invalid.
- Updated the Magic Pouch tooltip to correctly say +5 Draws.
- Retained the v40.4 reliability architecture and save schema v40.


v40.5.1 Viewport Feedback / Indicator Audit
-------------------------------------------
- Added a global viewport-safe feedback layer for scrolling menu screens.
- Farm messages that previously used the gameplay message bar now appear fixed to the visible viewport while Farm/Farmhouse/menu screens are open.
- This makes planting confirmation, plot selection, full-field warnings, insufficient-funds messages, harvest summaries, Farm Order notices, Rosie status messages, and similar Farm feedback visible regardless of scroll position.
- Existing plot-local planting/harvest animations remain in place when the plot itself is visible, so local feedback is preserved rather than replaced.
- Farmhouse reward burst now attaches to the viewport instead of the scrolled Farmhouse panel.
- Rosie-is-home Main Menu peek is now viewport-fixed so it cannot sit below the visible portion of a scrolling Main Menu.
- Generic rewardToast was audited and retained as viewport-fixed; Timed Harvest, Farm Orders, Farm upgrades, Rosie finds/cache, region rewards, and trophy/tier collection already route through this fixed reward system.
- Rosie Adventure homecoming and mechanic/mission dialogs remain modal overlays and are already viewport-safe.
- Solitaire-only feedback (message bar, streak bonus, level preview, mission chip, power-target bar) remains table-relative/fixed because Solitaire itself does not page-scroll.
- Build/cache marker updated to 40.5.1. Save schema remains v40.
- Overlay stacking was audited as part of v40.5.1: true modal overlays now sit above scrolling section screens, fixing cases such as Rosie Adventure homecoming/confirmation dialogs potentially rendering behind the Farm/Options panel.
- rewardToast now has an explicit viewport-level z-index above scrolling Farm/Farmhouse sections.


v40.5.2 Draw & Touch Interaction Polish
---------------------------------------
- Added an animated card-back travel from the Stock pile to the active/waste card on a normal Draw.
- Preview Choice selections use the same Stock-to-active-card draw animation.
- Reduced Motion bypasses the travel animation while preserving the same gameplay timing/state.
- The Stock graphic now visibly thins as cards are consumed instead of always looking like a full five-card stack.
  Five visual depth states step down through the hand, with a single card shown as a single card and an empty pile strongly faded.
- Stock ARIA text now reports the live number of cards remaining.
- Expanded the invisible tap area around exposed tableau cards on touch/mobile without enlarging their visible artwork.
- Expanded the Stock pile tap target beyond the visible card-back stack.
- Explicitly enabled touch-action: manipulation and removed mobile tap-highlight/selection behavior on tableau cards and Stock.
- Added subtle touch-down feedback and disabled sticky hover lifting on coarse-touch devices.
- Save schema remains v40; all v40.x saves remain compatible.


v40.5.3 Mission Completion Hotfix
---------------------------------
- Fixed Stock Saver announcing COMPLETE on the first card simply because the starting stock already met its end-of-hand target.
- Fixed Frugal Farmer announcing COMPLETE on the first card simply because no draw pack had been purchased yet.
- Applied the same terminal-condition correction to No Help Needed and Natural Harvest.
- These missions now display Still on track during play, fail immediately if their rule is broken, and become COMPLETE only after the tableau is actually cleared.
- Mid-hand accomplishment missions such as Streak Farmer, Rosie's Route, Treasure Hunter, and Clean Sweep still complete as soon as their actual target is reached.
- Save schema remains v40.


v40.5.4 HUD / Rosie Status / UI State Sweep
-------------------------------------------
- Fixed the top Solitaire STREAK fraction, which had stopped updating even though the
  streak dots and internal streak value were still changing.
- The fraction now follows the five-dot streak phase: 1/5 through 5/5, then starts the
  next five-card phase while the full streak itself continues internally.
- Main Menu Rosie status is now derived from the live Adventure state instead of static
  copy. While Rosie is away it shows that she is adventuring, her destination, and a
  brief approximate time remaining.
- The Farm menu subtitle also includes Rosie's approximate return time and refreshes
  automatically while the Main Menu remains open.
- Once Rosie's Adventure timer expires, the Main Menu automatically changes to the
  returned/home state and offers the quick route to welcome her back.
- When Rosie is simply home and not awaiting Adventure rewards, the special quick-return
  card is hidden rather than falsely implying that she just returned.
- Fixed another stale Rosie indicator discovered in the sweep: the Farm description no
  longer says "Rosie is supervising" while she is away. It now reflects exploring,
  returned, or normal-at-home state.
- Planting feedback now reports remaining field capacity after every planting, e.g.
  "5 crop spaces left", and explicitly says "Fields full" after the sixth plot is filled.
- Retained the v40.5.3 terminal-mission fix for Stock Saver, Frugal Farmer, No Help
  Needed, and Natural Harvest.

QA for v40.5.4
- Runtime regression for live streak update/reset.
- Runtime Rosie Main Menu away/ETA/returned/home-state tests.
- Runtime crop-capacity feedback test including the sixth/full field.
- Runtime Farm Rosie descriptive-state test.
- Terminal-mission regression for all four finish-condition missions.
- Full runtime clear of every Level 1-500.
- 300 randomized hands / 19,643 play-draw actions with streak-HUD invariants.
- 10,000 generated boards across Levels 1-500: zero validation failures or fallbacks.
- Save migrations/Level-30 recovery retained.
- JavaScript syntax/high-signal name checks, literal HTML ID wiring, button wiring,
  and dynamic-label wiring audits clean.
- Save schema remains v40.
