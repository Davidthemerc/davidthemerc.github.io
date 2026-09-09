#!/usr/bin/env python3
from pathlib import Path
import collections, json, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'module-manifest.json').read_text(encoding='utf-8'))
failures=[]
def check(name,ok,detail=''):
    if not ok: failures.append((name,detail))
    print(f"{'PASS' if ok else 'FAIL'}  {name}{' — '+detail if detail else ''}")

# Manifest/files
for rel in manifest.get('css',[])+manifest.get('js',[])+manifest.get('data',[]):
    check(f'module exists: {rel}',(ROOT/rel).is_file())

# JS syntax
for rel in manifest.get('js',[]):
    r=subprocess.run(['node','--check',str(ROOT/rel)],capture_output=True,text=True)
    check(f'JS syntax: {rel}',r.returncode==0,r.stderr.strip()[:240] if r.returncode else '')

# Static DOM integrity
html=(ROOT/'index.html').read_text(encoding='utf-8')
ids=re.findall(r'\bid=["\']([^"\']+)["\']',html)
dup_ids=[k for k,v in collections.Counter(ids).items() if v>1]
check('duplicate DOM IDs',not dup_ids,', '.join(dup_ids))
for tab in sorted(set(re.findall(r'data-tab=["\']([^"\']+)',html))):
    check(f'tab target: {tab}',f'id="{tab}View"' in html)

# Duplicate named globals
funcs=[]
for rel in manifest.get('js',[]):
    text=(ROOT/rel).read_text(encoding='utf-8')
    funcs+=re.findall(r'\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(',text)
dup_funcs=[k for k,v in collections.Counter(funcs).items() if v>1]
check('duplicate named functions',not dup_funcs,', '.join(dup_funcs))

# Modular load-order callback hazards: passing a later-defined global directly as a callback.
order={rel:i for i,rel in enumerate(manifest.get('js',[]))}
defs={}
for rel in manifest.get('js',[]):
    text=(ROOT/rel).read_text(encoding='utf-8')
    for m in re.finditer(r'\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(',text):
        defs.setdefault(m.group(1),[]).append((order[rel],rel))
hazards=[]
for rel in manifest.get('js',[]):
    text=(ROOT/rel).read_text(encoding='utf-8');idx=order[rel]
    for pat in [r'addEventListener\([^,]+,\s*([A-Za-z_$][\w$]*)\s*\)',r'\.onclick\s*=\s*([A-Za-z_$][\w$]*)\s*;']:
        for m in re.finditer(pat,text):
            ds=defs.get(m.group(1),[])
            if ds and min(x[0] for x in ds)>idx:
                hazards.append(f'{rel}: {m.group(1)} -> {ds[0][1]}')
check('cross-module callback load order',not hazards,'; '.join(hazards))

# Product constraints
all_js='\n'.join((ROOT/rel).read_text(encoding='utf-8') for rel in manifest.get('js',[]))
check('no Sleeper /players/nfl query',not re.search(r'sleeperGet(?:Cached|Safe)?\(\s*["\']\/players\/nfl',all_js))
check('FA/W candidate cap is three',
      'FAW_MAX_CANDIDATES_PER_POSITION=3' in all_js and '.slice(0,20)' not in (ROOT/'js/season/free-agency.js').read_text(encoding='utf-8'))
check('Trade Evaluation II uses package-adjusted value',
      'function tradePackageScoreFromValues' in all_js and 'Package Out' in all_js and 'Package In' in all_js and 'TRADE VERDICT II' in all_js)
check('Weekly Action Brief replaces Command Center Team Management',
      'function homeWeeklyActionBrief' in all_js and
      "$('#homeRecTitle').textContent='Weekly Action Brief'" in all_js and
      "setHomeNavButton(rec,'season','This Week')" in all_js and
      "rec.dataset.homeSection='seasonThisWeek'" in all_js and
      'No active suggestions this week.' in all_js)
check('Weekly Action Brief is capped and uses existing loaded intelligence',
      ').slice(0,5)' in (ROOT/'js/ui/command-center.js').read_text(encoding='utf-8') and
      'benchThreatAnalysis(roster,mineMatch,week,playerCache)' in all_js and 'normalizedMatchupSlots(roster,matchup,playerCache)' in all_js and
      'waiverPercentageSuggestions(roster,week,playerCache)' in all_js and
      'waiverAvailableForPosition(need.pos,week,1' in all_js)
check('League Teams roster sorts by position starter status and Trade Value',
      'const positionOrder={QB:0,RB:1,WR:2,TE:3,K:4,DEF:5}' in all_js and
      "value:typeof tradePlayerValue==='function'?tradePlayerValue(p):0" in all_js and
      'if(a.starter!==b.starter)return a.starter?-1:1;' in all_js and
      'if(b.value!==a.value)return b.value-a.value;' in all_js)
check('Command Center shares a render-scoped roster-player cache',
      'const homePlayerCache=new Map()' in all_js and 'seasonWarnings(roster,homePlayerCache)' in all_js and
      'homeWeeklyActionBrief(roster,matchup.mine,homeWeek,homePlayerCache)' in all_js and
      'benchThreatAnalysis(roster,mineMatch,week,playerCache)' in all_js and 'normalizedMatchupSlots(roster,matchup,playerCache)' in all_js and
      'waiverPercentageSuggestions(roster,week,playerCache)' in all_js)
check('My Team shares per-render player and point caches',
      'const playerCache=new Map()' in (ROOT/'js/ui/my-team.js').read_text(encoding='utf-8') and
      'const pointCache=new Map()' in (ROOT/'js/ui/my-team.js').read_text(encoding='utf-8'))
check('My Team shows injury designation only in My Team renderer',
      'function myTeamInjuryStatus' in (ROOT/'js/ui/my-team.js').read_text(encoding='utf-8') and
      'my-team-injury' in (ROOT/'js/ui/my-team.js').read_text(encoding='utf-8') and
      '#teamView .my-team-injury' in (ROOT/'css/09-settings-and-late-fixes.css').read_text(encoding='utf-8'))
check('Roster Needs & Moves is health-aware and distinguishes precautionary vs actionable injuries',
      "for(const pos of ['QB','RB','WR'])" in (ROOT/'js/season/waivers.js').read_text(encoding='utf-8') and
      'const healthFloors={QB:1,RB:2,WR:3}' in (ROOT/'js/season/waivers.js').read_text(encoding='utf-8') and
      'waiverPositionHealthCounts' in (ROOT/'js/season/waivers.js').read_text(encoding='utf-8') and
      "healthState:'potential'" in (ROOT/'js/season/waivers.js').read_text(encoding='utf-8') and
      "healthState:'action'" in (ROOT/'js/season/waivers.js').read_text(encoding='utf-8'))
check('Season depth displays use shared precautionary/actionable health counts',
      "waiverPositionHealthCounts(roster,pos,playerCache)" in (ROOT/'js/season/core.js').read_text(encoding='utf-8') and
      'Potential problem — monitor Questionable designations' in (ROOT/'js/season/core.js').read_text(encoding='utf-8') and
      'Actionable availability concern' in (ROOT/'js/season/core.js').read_text(encoding='utf-8'))
check('Bench recommendations use position-specific projection thresholds',
      'function benchThreatRequiredMultiplier' in (ROOT/'js/season/core.js').read_text(encoding='utf-8') and
      "if(pos==='QB')return 1.10" in (ROOT/'js/season/core.js').read_text(encoding='utf-8') and
      "if(pos==='TE'&&slot==='FLEX'&&starterPos==='WR')return 1.40" in (ROOT/'js/season/core.js').read_text(encoding='utf-8') and
      'return 1.20' in (ROOT/'js/season/core.js').read_text(encoding='utf-8') and
      'No eligible bench player clears the position-specific projection threshold' in (ROOT/'js/season/core.js').read_text(encoding='utf-8'))


check('Roster Watch uses potential/action health labels',
      "healthState==='potential'?'POTENTIAL'" in (ROOT/'js/ui/command-center.js').read_text(encoding='utf-8'))
check('Roster Pressure uses precautionary vs actionable health states',
      'Potential problem — monitor Questionable designations' in (ROOT/'js/season/core.js').read_text(encoding='utf-8') and
      'Actionable availability concern' in (ROOT/'js/season/core.js').read_text(encoding='utf-8'))
check('Weekly Watch describes Questionable as precautionary',
      'Precautionary only: monitor the Questionable designations' in (ROOT/'js/season/core.js').read_text(encoding='utf-8'))


check('News rivalry history is lazy and current-matchup gated',
      'function newsCurrentRivalryPair()' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'async function ensureNewsRivalryData()' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      "if(typeof ensureNewsRivalryData==='function')void ensureNewsRivalryData();" in (ROOT/'js/core/navigation.js').read_text(encoding='utf-8'))
check('News rivalry loader reuses per-pair cache and rerenders newsroom',
      'RIVALRY_API_CACHE_MAX_AGE=7*24*60*60*1000' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      "if($('#newsView')?.classList.contains('active'))renderNewsroom();" in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))

check('CTESPN Newsroom uses rolling current-plus-prior-week window',
      'function newsroomWindowWeeks()' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      "return current===1?[1]:[current-1,current];" in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      ".filter(s=>newsroomWeekInWindow(s.week))" in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
check('Transactions and playoff stories receive concrete Newsroom weeks',
      'function transactionStoryWeek(tx)' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'function firstPlayoffStatusWeek(rosterId,kind)' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      "transactionImpact(tx),week,'major'" in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
check('Rivalry stories are generated league-wide and target their own pair',
      'function newsroomRivalryStories()' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'teamRosterIds:' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'data-rivalry-team-a=' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))

check('CTESPN dominance story requires at least five wins to zero',
      'ctx.oneSided&&Math.max(series.aWins,series.bWins)>=5' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
check('Season never-beaten Series Note remains independent of dominance threshold',
      'has never beaten' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
check('Rivalry-only Lead Story favors longest-running series',
      'function newsroomLeadStory(stories)' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'Number(b.seriesGames||0)-Number(a.seriesGames||0)' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'Number(!!b.hasBowl)-Number(!!a.hasBowl)' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))

check('Fixed 2026 Home Away matrix is embedded',
      'const UCL_2026_HOME_ROSTERS_BY_WEEK=Object.freeze({' in (ROOT/'js/core/state.js').read_text(encoding='utf-8') and
      "14:['5','4','1','7']" in (ROOT/'js/core/state.js').read_text(encoding='utf-8') and
      'function uclVenueForRoster(week,rosterId)' in (ROOT/'js/core/state.js').read_text(encoding='utf-8'))
check('HOME and AWAY venue pills use semantic green/yellow styling',
      '.venue-pill.home' in (ROOT/'css/09-settings-and-late-fixes.css').read_text(encoding='utf-8') and
      'background:#b7e4c7!important' in (ROOT/'css/09-settings-and-late-fixes.css').read_text(encoding='utf-8') and
      '.venue-pill.away' in (ROOT/'css/09-settings-and-late-fixes.css').read_text(encoding='utf-8') and
      'background:#ffe08a!important' in (ROOT/'css/09-settings-and-late-fixes.css').read_text(encoding='utf-8'))
check('Venue designations appear across core season screens',
      'uclVenuePill(homeWeek,matchup.mine.roster_id)' in (ROOT/'js/ui/command-center.js').read_text(encoding='utf-8') and
      'uclVenuePill(week,roster.roster_id)' in (ROOT/'js/ui/season.js').read_text(encoding='utf-8') and
      'uclVenuePill(week,p.ar.roster_id)' in (ROOT/'js/season/core.js').read_text(encoding='utf-8') and
      'uclVenuePill(week,roster.roster_id)' in (ROOT/'js/ui/my-team.js').read_text(encoding='utf-8'))

check('Report Card is removed from top-level navigation',
      '<button class="tab-btn" data-tab="draft">Report Card</button>' not in html)



check('v1.10.1 is marked as Stable release',
      "const APP_VERSION='1.10.1';" in (ROOT/'js/data/sleeper-api.js').read_text(encoding='utf-8') and
      "const RELEASE_CHANNEL='Stable';" in (ROOT/'js/data/sleeper-api.js').read_text(encoding='utf-8') and
      manifest.get('version')=='1.10.1' and manifest.get('channel')=='Stable')
check('Gold and Ice Blue themes are registered and selectable',
      "gold:'Gold'" in (ROOT/'js/ui/settings.js').read_text(encoding='utf-8') and
      "iceblue:'Ice Blue'" in (ROOT/'js/ui/settings.js').read_text(encoding='utf-8') and
      'data-theme-choice="gold"' in html and 'data-theme-choice="iceblue"' in html and
      ':root[data-theme="gold"]' in (ROOT/'css/09-settings-and-late-fixes.css').read_text(encoding='utf-8') and
      ':root[data-theme="iceblue"]' in (ROOT/'css/09-settings-and-late-fixes.css').read_text(encoding='utf-8'))
check('My Team bench sorts by position then projection or score',
      'MY_TEAM_BENCH_POSITION_ORDER=Object.freeze({QB:0,RB:1,WR:2,TE:3,DEF:4,K:5})' in (ROOT/'js/ui/my-team.js').read_text(encoding='utf-8') and
      'function sortMyTeamBenchIds(ids,playerFn,pointFn)' in (ROOT/'js/ui/my-team.js').read_text(encoding='utf-8') and
      'if(ao!==bo)return ao-bo;' in (ROOT/'js/ui/my-team.js').read_text(encoding='utf-8') and
      'if(bn!==an)return bn-an;' in (ROOT/'js/ui/my-team.js').read_text(encoding='utf-8'))
check('Roster-health UI uses healthy terminology',
      '${h.secure} healthy' in (ROOT/'js/season/core.js').read_text(encoding='utf-8') and
      '${h.secure} healthy ${pos}' in (ROOT/'js/season/waivers.js').read_text(encoding='utf-8'))
check('Teams header copy and live roster metadata are polished',
      'Browse the Draft Report Card, every UCL roster profile, results, and recent roster activity.' in html and
      'id="teamPagePointsAgainst"' in html and
      'League Rank: ${ordinal(leagueRank)} • Live Roster' in (ROOT/'js/core/navigation.js').read_text(encoding='utf-8'))
check('Teams metrics use six bubbles including Points Against',
      'grid-template-columns:repeat(6,1fr)' in (ROOT/'css/05-teams.css').read_text(encoding='utf-8') and
      'pointsAgainst.toFixed(2)' in (ROOT/'js/core/navigation.js').read_text(encoding='utf-8'))
check('Teams screen prominently links to the dedicated Report Card',
      'class="teams-report-card-btn"' in html and
      'data-home-nav="draft"' in html and
      '<strong>Report Card</strong>' in html and
      'Open full draft grades &amp; analysis' in html)
check('Dedicated News tab precedes Command Center',
      'data-tab="news">News</button><button class="tab-btn active" data-tab="home">Command Center' in html and
      'id="newsView"' in html and 'id="newsLeague"' in html and 'id="seasonLeague"' not in html)
check('News tab contains all three former Season news cards',
      'League Activity & Transactions' in html and 'CTESPN Newsroom' in html and 'CTESPN Weekly League Report' in html)

check('Newsroom inactive filters override global ghost-button white text',
      '#newsView .newsroom-controls [data-news-filter]{' in (ROOT/'css/09-settings-and-late-fixes.css').read_text(encoding='utf-8') and
      'color:#1f2937!important' in (ROOT/'css/09-settings-and-late-fixes.css').read_text(encoding='utf-8') and
      '#newsView .newsroom-controls [data-news-filter].active' in (ROOT/'css/09-settings-and-late-fixes.css').read_text(encoding='utf-8'))
check('Newsroom inactive filters have explicit readable contrast',
      'color:#1f2937!important' in (ROOT/'css/09-settings-and-late-fixes.css').read_text(encoding='utf-8') and
      '#newsView .newsroom-controls [data-news-filter].active' in (ROOT/'css/09-settings-and-late-fixes.css').read_text(encoding='utf-8'))
check('Newsroom filter row keeps all six filters visible',
      all(x in html for x in ['data-news-filter="all"','data-news-filter="my-team"','data-news-filter="matchup"','data-news-filter="standings"','data-news-filter="transaction"','data-news-filter="rivalry"']) and
      '#newsView .newsroom-controls [data-news-filter]' in (ROOT/'css/09-settings-and-late-fixes.css').read_text(encoding='utf-8'))
check('Newsroom exposes labeled My Team story filter',
      'NEWS STORY FILTER' in html and 'data-news-filter="my-team">My Team' in html)
check('Established rivalry enforces 25 percent competitiveness with Bowl upset exception',
      'weakerWinShare>=0.25||championshipUpsetException' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'function weakerTeamBowlWin' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
check('Rivalry detail includes Closest Matchup and shared News modal renderer',
      "{l:'Closest Matchup'" in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'function renderRivalryDetailElements' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'id="newsRivalryDialog"' in html and 'data-open-rivalry-detail' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
check('Established rivalry uses UCL exceptions and excludes one-sided series',
      's.games.length>=5||championship||seasons.size>=3' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'const established=!oneSided' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
check('One-sided current matchup gets dominance newsroom story',
      'Can ${searching} finally break through against ${dominant}?' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      ",'rivalry',72," in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
check('CTESPN rivalry renewal requires an actual matchup in the Newsroom window',
      'for(const week of newsroomWindowWeeks())' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      "if(m?.matchup_id==null||seen.has(String(m.matchup_id)))continue;" in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'They meet in Week ${week}' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
check('Visible 2026 Season Archive card is removed while archive engine remains',
      'id="seasonArchiveCenter"' not in html and
      'function build2026HistorySnapshot' in all_js)
check('Season consolidates waiver intelligence into Roster Needs & Moves', 'Roster Needs &amp; Moves' in html and 'Top Available for Your Needs' not in html and 'Add / Drop Suggestions' not in html and 'waiverGrid' not in html and 'waiverSwapGrid' not in html)
check('Other League Matchups card and modal exist', 'id="otherLeagueMatchupsCard"' in html and 'id="otherMatchupDialog"' in html and 'function renderOtherLeagueMatchups' in all_js and 'function openOtherLeagueMatchup' in all_js)
check('Other League Matchups excludes selected team matchup', "String(p.a.roster_id)!==mineId&&String(p.b.roster_id)!==mineId" in all_js)
check('Rivalry archive loads historical Sleeper data lazily by stable owner IDs',
      'ensureRivalryApiHistory(roster,oppRoster)' in (ROOT/'js/ui/season.js').read_text(encoding='utf-8') and
      'previous_league_id' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      "String(r.owner_id)===pair.userA" in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'RIVALRY_API_CACHE_KEY' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
check('Rivalry metrics place Largest Margin beside Series before PF cards',
      (ROOT/'js/season/history-news.js').read_text(encoding='utf-8').find("{l:'Largest Blowout'") <
      (ROOT/'js/season/history-news.js').read_text(encoding='utf-8').find("{l:`${a} PF`"))
_rivalry_metric_js=(ROOT/'js/season/history-news.js').read_text(encoding='utf-8')
check('Rivalry metrics include Highest-Scoring Meeting before Last Meeting',
      'highestScoring' in _rivalry_metric_js and
      "{l:'Highest-Scoring Meeting'" in _rivalry_metric_js and
      _rivalry_metric_js.index("{l:'Highest-Scoring Meeting'") < _rivalry_metric_js.index("{l:'Last Meeting'"))
check('Rivalry Recent Meetings are display-only',
      'data-rivalry-game' not in _rivalry_metric_js and 'open game' not in _rivalry_metric_js and 'openHistoricalGame' not in _rivalry_metric_js)
check('runtime snapshot uses IndexedDB','apiCachePut(RUNTIME_SNAPSHOT_SCOPE,RUNTIME_SNAPSHOT_REQUEST_KEY' in all_js)
check('runtime snapshot keeps local mirror','RUNTIME_LOCAL_MIRROR_KEY' in all_js and 'writeRuntimeLocalMirror(payload)' in all_js)
check('startup restores mirror before IndexedDB',
      'hydrateRuntimeCache(savedSleeperUser)' in all_js and
      "backgroundTask('storage-hydration'" in all_js and
      'peekNewestRuntimeCache(savedSleeperUser)' in all_js)
check('UI initializes before async storage','function initializeStaticUi' in all_js and 'initializeStaticUi();' in all_js)
check('startup storage hydration is background-only',
      "backgroundTask('storage-hydration'" in all_js)
check('startup avoids full render churn',
      'function renderRestoredRuntimeState' in all_js and
      "document.querySelector('.tab-view.active')" in all_js and
      'hydrateSavedProjectionMap(currentWeekNumber())' in all_js)
sync_js=(ROOT/'js/core/sync.js').read_text(encoding='utf-8')
check('post-draft sync skips full draft rebuild',
      'if(draftAllowsPostDraftViews())' in sync_js and 'sameLoadedTeam' in sync_js)

check('live-season tabs are visible in initial markup',
      'data-tab="season" hidden' not in html and 'data-tab="trade" hidden' not in html and 'data-tab="faw" hidden' not in html)
expected_menu=['news','home','teams','team','season','faw','trade','settings','analysis','log']
menu_tabs=re.findall(r'<button class="tab-btn[^"]*" data-tab="([^"]+)"',html.split('<div class="tabs">',1)[1].split('</div>',1)[0])
check('top menu order is stable',menu_tabs==expected_menu,' → '.join(menu_tabs))
check('draft utility tabs hidden in initial markup',
      'data-tab="analysis" hidden' in html and 'data-tab="log" hidden' in html)


check('IndexedDB startup is bounded','const timer=setTimeout' in all_js and '1800' in all_js and 'function boundedStartup' in all_js)
check('tab render errors are isolated','function safeUiCall' in all_js and 'activateTabView(name);' in all_js)
check('startup team can recover from bootstrap','RUNTIME_BOOTSTRAP_KEY' in all_js and 'bootUser' in all_js)
check('legacy runtime migration exists','readLegacyRuntimeCache' in all_js and 'hydrateRuntimeCacheAsync' in all_js)
check('Command Shortcuts normalized','function activateHomeShortcut' in all_js and 'return navigateCommand(tab,section)' in all_js)
check('Teams tab contains no draft archive markup','teamPageDraftList' not in html and '2026 Draft History' not in html)
nav=(ROOT/'js/core/navigation.js').read_text(encoding='utf-8')
team_fn=nav[nav.find('function renderLeagueTeamPage('):]
team_fn=team_fn[:team_fn.find('\nfunction ',1) if team_fn.find('\nfunction ',1)>=0 else len(team_fn)]
check('Teams roster omits rank and NR presentation','tp-rank' not in team_fn and 'List #' not in team_fn and "' • NR'" not in team_fn)
check('Teams current matchup uses shared scoring context',
      'function teamCurrentMatchupSummary' in nav and 'const scoring=matchupScoringContext' in nav and
      'Number(matchup.mine.points||0).toFixed(2)' not in nav)
teams_js=(ROOT/'js/ui/teams.js').read_text(encoding='utf-8')
teams_render=teams_js[teams_js.find('function renderLeagueTeams'):teams_js.find('function renderTeamAnalysis')]
check('Teams render has no draft-grade dependency',
      'function leagueSeasonTeams' in teams_js and 'leagueDraftGrades' not in teams_render)
check('Teams page skips unused draft analysis',
      'const a=teamDraftAnalysis(team);' not in nav)
check('Teams trend analysis is deferred',
      'function scheduleTeamTrends' in nav and 'requestIdleCallback' in nav)

season_core=(ROOT/'js/season/core.js').read_text(encoding='utf-8')
roster_player_fn=season_core[season_core.find('function sleeperRosterPlayer('):]
roster_player_fn=roster_player_fn[:roster_player_fn.find('\nfunction ',1) if roster_player_fn.find('\nfunction ',1)>=0 else len(roster_player_fn)]
check('roster rendering is persistence-free',
      'rememberDiscoveredPlayer' not in roster_player_fn and 'storageSetJson' not in roster_player_fn)
pick_fn=(ROOT/'js/data/sleeper-api.js').read_text(encoding='utf-8')
pick_fn=pick_fn[pick_fn.find('function sleeperPickPlayer('):]
pick_fn=pick_fn[:pick_fn.find('\nfunction ',1) if pick_fn.find('\nfunction ',1)>=0 else len(pick_fn)]
check('draft-pick rendering is persistence-free',
      'rememberDiscoveredPlayer' not in pick_fn and 'storageSetJson' not in pick_fn)
check('Season primary render shares matchup scoring context',
      'function seasonWeeklyWatch(roster,oppRoster,mineMatch,oppMatch,scoringOverride=null)' in season_core and
      'scoring=scoringOverride||matchupScoringContext' in season_core and
      'function renderMatchupCenter(roster,oppRoster,mine,opp,scoringOverride=null)' in season_core)
check('Pregame intelligence has loading branch',
      "else if(scoring.started)" in season_core and 'Pregame projections loading' in season_core)
check('FA/W view exists','id="fawView"' in html and 'data-tab="faw"' in html)
check('Main menu shows Players before Trade Center', html.find('data-tab="faw">Players</button>') < html.find('data-tab="trade">Trade Center</button>') and html.find('data-tab="faw">Players</button>')>=0)
check('Season waiver order UI exists','waiverOrderList' in html and 'Current Waiver Order' in html)
check('Waiver needs are health-aware','function waiverPlayerHealth' in all_js and 'function waiverHealthyCount' in all_js and 'function waiverPositionHealthCounts' in all_js and 'healthFloors={QB:1,RB:2,WR:3}' in all_js and "healthState:'potential'" in all_js and "healthState:'action'" in all_js)
check('Add/drop suggestions use position-specific percentage thresholds','function waiverPercentageSuggestions' in all_js and 'function waiverReplacementMultiplier' in all_js and "if(pos==='QB')return 1.10" in all_js and "if(pos==='TE'&&slot==='FLEX'&&starterPos==='WR')return 1.40" in all_js and 'return 1.20' in all_js)
check('Health-driven waiver exemption requires actionable severe designation',
      'function waiverHealthEmergencyPositions' in all_js and
      "return need.healthState==='action';" in (ROOT/'js/season/waivers.js').read_text(encoding='utf-8') and
      'healthEmergency:emergency' in (ROOT/'js/season/waivers.js').read_text(encoding='utf-8'))

faw_js=(ROOT/'js/season/free-agency.js').read_text(encoding='utf-8')
check('FA/W excludes owned players','fawOwnedPlayerIds' in faw_js and 'owned.has(String(id))' in faw_js)
check('FA/W sorts by weekly projections','b.pts-a.pts' in faw_js and 'projectionMapForWeek' in faw_js)
check('FA/W compares weakest same-position player','fawWeakestByPosition' in faw_js and 'candidate.pts-weakest.pts' in faw_js)
check('Projection payload enriches metadata in a bounded batch',
      'PROJECTION_AVAILABLE_METADATA_PER_POSITION=12' in all_js and
      'rememberDiscoveredPlayer(row.id,row.rawPlayer,{persist:false})' in all_js and
      'persistDiscoveredPlayers(learnedIds)' in all_js)

check('discovered-player startup cache is size bounded',
      'DISCOVERED_PLAYERS_MAX_CHARS=500000' in all_js and 'readDiscoveredPlayersBounded' in all_js)
check('discovered-player registry is count bounded',
      'DISCOVERED_PLAYER_MAX=220' in all_js and 'pruneDiscoveredPlayers' in all_js)
check('runtime snapshot no longer duplicates discovered-player registry',
      'discoveredSleeperPlayers,\n    seasonDataMeta' not in (ROOT/'js/data/sleeper-api.js').read_text(encoding='utf-8'))
check('projection cache is compacted before IndexedDB write',
      'compactProjectionPayload(raw)' in teams_js and "apiCachePut('projection',cacheKey,compact" in teams_js)
check('Live Season Sync bypasses archival draft refresh',
      'if(seasonToolsAvailable()||draftAllowsPostDraftViews())await syncSeasonData(true);' in sync_js and
      'if(seasonToolsAvailable())await ensureSeasonDataFresh(true);' not in sync_js)
check('season sync does not preload future matchup weeks',
      'const futureWeeks=[]' not in sync_js and 'Future schedule weeks are loaded lazily' in sync_js)
check('Postseason owns lazy remaining-schedule loading boundary',
      'ensureRemainingRegularSeasonSchedule' in all_js and
      'void ensureRemainingRegularSeasonSchedule()' in (ROOT/'js/ui/season.js').read_text(encoding='utf-8') and
      "`/league/${SLEEPER_LEAGUE_ID}/matchups/${week}`" in (ROOT/'js/season/playoffs-achievements.js').read_text(encoding='utf-8'))
check('season archive hydration is bounded per sync',
      'SYNC_ARCHIVE_WEEKS_PER_RUN=4' in all_js and 'missingWeeks.slice(-SYNC_ARCHIVE_WEEKS_PER_RUN)' in sync_js)
check('runtime persistence coalesces repeated writes',
      'runtimePersistDirty' in all_js and 'runtimePersistTimer=setTimeout' in all_js)
check('obsolete full player DB cache is removed, not read during sync',
      "apiCacheDelete('api','/players/nfl')" in sync_js and 'await ensureSleeperPlayerDb()' not in sync_js)

check('Season waiver render never auto-syncs projections',
      'syncCurrentWeekProjections(week,false).then(()=>renderWaiverCenter(roster))' not in (ROOT/'js/season/waivers.js').read_text(encoding='utf-8'))
check('FA/W render never auto-syncs projections',
      'syncCurrentWeekProjections(week,false).then(()=>renderFaw())' not in faw_js)
report_js=(ROOT/'js/draft/report-card.js').read_text(encoding='utf-8')
check('Report Card render never auto-syncs Week 1 projections',
      'if(!week1ProjectionData&&!week1ProjectionSyncPromise)ensureWeek1ProjectionReport();' not in report_js)
intel_js=(ROOT/'js/draft/intelligence.js').read_text(encoding='utf-8')
stats_fn=intel_js[intel_js.find('function strategyHistoryStats('):]
stats_fn=stats_fn[:stats_fn.find('\nfunction ',1) if stats_fn.find('\nfunction ',1)>=0 else len(stats_fn)]
check('Report Card strategy stats are persistence-free',
      'finalizeStrategyHistory' not in stats_fn and 'saveStrategyHistory' not in stats_fn and 'storageSetJson' not in stats_fn)

history_js=(ROOT/'js/season/history-news.js').read_text(encoding='utf-8')
check('Season subsection navigation exists', 'class="season-section-nav"' in html and 'data-command-section="seasonRecords"' in html)
check('Rivalry championship requires title pairing and exact playoff week', '/winners_bracket' in history_js and 'Number(x?.p)===1' in history_js and 'Number(game.week)===Number(champ.week' in history_js and 'rg-champ' in history_js)
check('Rivalry margin is explicitly labeled', 'Margin: ${Math.abs(ap-bp).toFixed(2)} PTS' in history_js)
check('Redundant rivalry source wording removed', 'Sleeper archive + 2026' not in all_js and 'Sleeper archive + 2026' not in html)
check('Series notes use numbered UCL Bowls across full rivalry series', 'series.games.filter(rivalryGameIsChampionship)' in history_js and 'uclBowlLabel(bowlGame.season)' in history_js and 'has never beaten' in history_js and 'Recent Form' not in history_js and 'Largest Recorded Win' not in history_js)
check('Season status uses guide copy', 'Your guide to NFL Week ${week}.' in (ROOT/'js/ui/season.js').read_text(encoding='utf-8') and 'season_type' not in (ROOT/'js/ui/season.js').read_text(encoding='utf-8')[(ROOT/'js/ui/season.js').read_text(encoding='utf-8').find("$('#seasonStatus').textContent"):(ROOT/'js/ui/season.js').read_text(encoding='utf-8').find('const health=', (ROOT/'js/ui/season.js').read_text(encoding='utf-8').find("$('#seasonStatus').textContent"))])
check('Rivalry history rejects 0-0 placeholders', 'if(ap===0&&bp===0)return null;' in history_js and '!(g.scoreA===0&&g.scoreB===0)' in history_js and 'if(scoreA===0&&scoreB===0)continue;' in history_js and 'if(Number(g.scoreA)===0&&Number(g.scoreB)===0)continue;' in history_js)
check('UCL Bowl notes include score and year', 'winningScore.toFixed(2)' in history_js and 'losingScore.toFixed(2)' in history_js and '(${bowlGame.season})' in history_js)

trade_js=(ROOT/'js/season/trade-center.js').read_text(encoding='utf-8')
check('Trade Center secondary analysis is lazy',
      'TRADE_LAZY_SECTIONS' in trade_js and 'updateTradeLazyContext(mine);' in trade_js and
      "renderTradePartnerIdeas(mine);\n  renderTradeRetrospectives();" not in trade_js)

check('Trade value context precomputes shared league inputs',
      'rankedRanks' in trade_js and 'rosteredByPos' in trade_js and 'rosterByPlayer' in trade_js and 'rosterCountsById' in trade_js)
check('Trade Center resets valuation cache per render',
      'function renderTradeCenter()' in trade_js and 'tradeValueContextCache=null;' in trade_js)
check('Trade Center uses dynamic 0-100 UCL Trade Value',
      'function tradePlayerValueDetail' in trade_js and 'tradeProjectionScore' in trade_js and 'tradeSeasonProductionScore' in trade_js and 'tradeHealthMultiplier' in trade_js and '310-p.rank' not in trade_js)
check('Trade Center player list is position grouped',
      'trade-position-group' in trade_js and 'trade-position-grid' in trade_js and "order=['QB','RB','WR','TE','K','DEF']" in trade_js)
check('Report Card lower analysis is lazy',
      'REPORT_LAZY_SECTIONS' in report_js and 'updateReportLazyContext({grade:g,efficiency:eff,leagueGrades,myLeague,assessment});' in report_js)
check('Report Card Week 1 evaluation avoids duplicate league calculation',
      'const week1League=leagueWeek1ProjectionGrades();' in report_js and
      'leagueWeek1ProjectionGrades().length' not in report_js)
settings_js=(ROOT/'js/ui/settings.js').read_text(encoding='utf-8')
check('Settings has no removed diagnostics callback','renderSettingsChecks' not in settings_js)




check('Players screen uses Player Acquisition title', '<h2 class="team-title">Player Acquisition</h2>' in html and '<h2 class="team-title">FA/W</h2>' not in html)
check('Players disclaimer uses Free Agency / Waivers guidance', 'These players were listed as available through Free Agency or Waivers.' in html and 'Please refer to the Sleeper app.' in html)
late_css=(ROOT/'css/09-settings-and-late-fixes.css').read_text(encoding='utf-8')
check('Playoff Machine week cards are compact with larger outcome buttons', '#seasonView .playoff-game' in late_css and 'width:40px!important' in late_css and 'height:29px!important' in late_css and 'padding:1px 3px!important' in late_css)
check('League empty states use compact card classes', 'activity-center.compact-empty' in late_css and 'newsroom-center.compact-empty' in late_css and 'weekly-report.compact-empty' in late_css)
check('League empty-state CSS is parsed as real CSS, not escaped text', '\\n' not in late_css and 'height:auto!important' in late_css and 'font-size:12px!important' in late_css)
check('Waiver Watchlist removed from production UI and runtime', 'Waiver Watchlist' not in html and 'waiverWatchlist' not in html and 'WAIVER_WATCH_KEY' not in (ROOT/'js/season/waivers.js').read_text(encoding='utf-8') and 'data-watch' not in (ROOT/'js/season/waivers.js').read_text(encoding='utf-8'))
check('Analytics positional placeholder uses compact card state', 'season-analytics.compact-empty' in late_css and "analyticsCard?.classList.toggle('compact-empty',!ctx.length);" in season_core)


check('Player Acquisition deltas use semantic positive/negative colors',
      "kind:delta>0?'good':delta<0?'bad':'neutral'" in (ROOT/'js/season/free-agency.js').read_text(encoding='utf-8') and
      '.faw-player-row.good .faw-comp b{color:#177245}' in (ROOT/'css/07-trade-and-season-tools.css').read_text(encoding='utf-8') and
      '.faw-player-row.bad .faw-comp b{color:#9d3b3b}' in (ROOT/'css/07-trade-and-season-tools.css').read_text(encoding='utf-8') and
      '.faw-player-row.neutral .faw-comp b{color:#667085}' in (ROOT/'css/07-trade-and-season-tools.css').read_text(encoding='utf-8'))
check('Player Acquisition position cards use requested color framing',
      '[data-faw-group="QB"]' in (ROOT/'css/07-trade-and-season-tools.css').read_text(encoding='utf-8') and
      '[data-faw-group="WR"]' in (ROOT/'css/07-trade-and-season-tools.css').read_text(encoding='utf-8') and
      '[data-faw-group="RB"]' in (ROOT/'css/07-trade-and-season-tools.css').read_text(encoding='utf-8') and
      '[data-faw-group="TE"]' in (ROOT/'css/07-trade-and-season-tools.css').read_text(encoding='utf-8') and
      '[data-faw-group="K"]' in (ROOT/'css/07-trade-and-season-tools.css').read_text(encoding='utf-8') and
      '[data-faw-group="DEF"]' in (ROOT/'css/07-trade-and-season-tools.css').read_text(encoding='utf-8'))
check('Player Acquisition player rows remain neutral white',
      '.faw-position-card .faw-player-row{background:#fff!important}' in (ROOT/'css/07-trade-and-season-tools.css').read_text(encoding='utf-8'))

# Data files
rankings=json.loads((ROOT/'data/ucl-rankings-2026.json').read_text(encoding='utf-8'))
byes=json.loads((ROOT/'data/nfl-byes-2026.json').read_text(encoding='utf-8'))
check('ranked pool has 299 active rows',len(rankings)==299,str(len(rankings)))
ranks=[int(x.get('rank',0)) for x in rankings]
check('ranking numbers preserve deliberate Josh Jacobs NR gap',len(set(ranks))==299 and set(range(1,301))-set(ranks)=={61})
check('Josh Jacobs remains outside ranked pool',not any('josh jacobs' in str(x.get('name','')).lower() for x in rankings))
check('NFL bye map has 32 teams',len(byes)==32,str(len(byes)))
check('NFL bye weeks valid',all(5<=int(v)<=14 for v in byes.values()))

if failures:
    print(f'\n{len(failures)} static smoke failure(s).')
    sys.exit(1)
print('\nStatic smoke suite passed.')

check('no in-app Diagnostics UI',
      'settingsDiagnostics' not in html and 'settingsRunChecksBtn' not in html and 'debugErrors' not in html)
check('no embedded development regression suites',
      'runReleaseCandidateRegressionSuite' not in all_js and
      'runFullFunctionalRegressionSweep' not in all_js and
      'runSeasonLogicRegressionSuite' not in all_js)
nav_js=(ROOT/'js/core/navigation.js').read_text(encoding='utf-8')
sync_js=(ROOT/'js/core/sync.js').read_text(encoding='utf-8')
boot_js=(ROOT/'js/core/bootstrap.js').read_text(encoding='utf-8')
check('tab navigation is render-only',
      'ensureSeasonDataFresh(false)' not in nav_js and 'syncSeasonData(false)' not in nav_js)
check('automatic polling disabled',
      'function startSleeperPolling(){stopSleeperPolling();return false;}' in all_js and
      "document.addEventListener('visibilitychange'" not in sync_js)
check('startup does not auto-connect Sleeper',
      'ensureStartupSleeperConnection(true)' not in boot_js and
      'scheduleStartupConnectionRecovery()' not in boot_js)

boot_js=(ROOT/'js/core/bootstrap.js').read_text(encoding='utf-8')
check('archived draft board is lazy-rendered',
      "if(draftAllowsPostDraftViews()) safeUiCall('initial-home-render'" in boot_js and
      "safeUiCall('archived-board-render',()=>render())" in boot_js)

# v1.9.42 Settings + themes
check('Settings removes Navigation card','<h3>Navigation</h3>' not in html and 'Default Home' not in html)
check('Settings removes Weekly Workspace and Refresh Behavior','Weekly Workspace' not in html and 'Refresh Behavior' not in html)
check('Settings includes six theme choices',all(f'data-theme-choice="{x}"' in html for x in ['blue','forest','purple','crimson','orange','slate']))
_settings_js=(ROOT/'js/ui/settings.js').read_text(encoding='utf-8')
check('Theme selection persists and applies immediately','THEME_KEY' in _settings_js and 'applyColorTheme' in _settings_js and "storageSet(THEME_KEY,clean)" in _settings_js)
check('Theme preference preserved across reset',"KEY+'-color-theme'" in (ROOT/'js/draft/intelligence.js').read_text(encoding='utf-8'))

# v1.9.43 theme coverage
_responsive_css=(ROOT/'css/08-responsive-polish.css').read_text(encoding='utf-8')
_late_css=(ROOT/'css/09-settings-and-late-fixes.css').read_text(encoding='utf-8')
check('Season Intelligence follows theme', '.season-intel-hero' in _late_css and 'linear-gradient(135deg,var(--navy),var(--blue))' in _late_css)
check('neutral roster-need bubble follows theme', '.waiver-need.low' in _late_css and 'background:var(--theme-soft)!important' in _late_css)
check('standings playoff separator follows theme', '.standing-row.playoff-line' in _late_css and 'var(--theme-line)' in _late_css)
check('Teams informational chips follow theme', '.team-trend-chip.active' in _late_css and '.team-page-pos span.heavy' in _late_css)

# v1.9.44 theme coverage II
check('Report Card draft-finished banner follows theme', ':root[data-theme] .draft-finished-banner' in _late_css and 'linear-gradient(135deg,var(--navy),var(--blue))' in _late_css)
check('Trade Partner container border removed', '#tradeView .trade-partner-selector{border:0;' in _responsive_css)
check('Trade Partner select receives theme border', '#tradeView .trade-partner-selector #tradePartner{width:100%;max-width:none;border:2px solid var(--blue2)!important}' in _responsive_css and ':root[data-theme] #tradeView #tradePartner' in _late_css)

# v1.9.46 RC roster/settings cleanup
check('Color Theme subtitle uses requested copy', "Choose the Companion Color scheme. No, we are NOT adding mental health green. Don't ask." in html)
check('Live Season Roster Watch action can route to My Team', 'id="homeThreatAction"' in html and "threatAction.dataset.homeNav=complete?'team':'analysis'" in (ROOT/'js/core/state.js').read_text(encoding='utf-8') and "threatAction.textContent=complete?'My Team':'Team Analysis'" in (ROOT/'js/core/state.js').read_text(encoding='utf-8'))
check('Roster Pressure moved to bottom of My Team', 'id="teamRosterPressureGrid"' in html and 'id="seasonPressureGrid"' not in html and 'seasonRosterPressure(roster,playerCache)' in (ROOT/'js/ui/my-team.js').read_text(encoding='utf-8'))
check('Season Roster Health card removed', '<h3>Roster Health</h3>' not in html and 'seasonRosterWarnings' not in html and 'seasonRosterCount' not in html)
check('Season Archive removes dev-like counters and package export UI', 'historyValidation' not in html and 'historySnapshotBtn' not in html and 'historySnapshotNote' not in html and 'Download Complete 2026 Season Package' not in html)
check('Settings omits developer-facing package and season readiness diagnostics', 'settingsPackageCheck' not in html and 'settingsSeasonDataCheck' not in html and 'renderSettingsSeasonData' not in all_js)
check('Current Sleeper Lineup card removed from Season', 'Current Sleeper Lineup' not in html and 'id="seasonStarters"' not in html and 'id="seasonBench"' not in html and 'seasonStarters' not in (ROOT/'js/ui/season.js').read_text(encoding='utf-8') and 'seasonBench' not in (ROOT/'js/ui/season.js').read_text(encoding='utf-8'))




check('Historical correction matching uses Sleeper identity aliases',
      'function managerAliasValues(user)' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'function managerIdentityKey(label,ownerId=' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'function managerIdentityMatches(label,ownerId,identity)' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
check('Historical matchup audit exposes candidates and final merge',
      'function historicalMatchupAudit(teamA,teamB,season,week)' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'correctionMatched:' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
check('Historical correction integrity UI is removed from Settings',
      '<h3>Historical Results</h3>' not in html and 'settingsHistoricalResultStatus' not in all_js and
      'settingsHistoricalResultScore' not in html)
check('Rivalry history cache is v5 after identity matching fix',
      'rivalry-api-history-v5' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
check('Verified 2019 W10 historical correction is seeded',
      "season:2019,week:10" in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      "teamA:'dmercado',teamB:'fograw'" in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'scoreA:140.47,scoreB:138.51' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
check('Historical matchup dedupe identity excludes score',
      'function historicalGameIdentity(game)' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'function historicalGameSourcePriority(game)' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'const byGame=new Map();' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
check('Historical matchup score authority prefers custom_points',
      'function sleeperAuthoritativeMatchupScore(matchup)' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'const custom=matchup.custom_points;' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      "return {value:n,source:'custom'}" in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      "return Number.isFinite(raw)?{value:raw,source:'points'}" in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
check('Rivalry history cache migrates after score-authority fix',
      "rivalry-api-history-v5" in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
check('Longest win streak stores end and active span',
      'function rivalryStreakSpan(streak)' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      'end:streakEnd,active:streakActive' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8') and
      '`${start}–Present`' in (ROOT/'js/season/history-news.js').read_text(encoding='utf-8'))
