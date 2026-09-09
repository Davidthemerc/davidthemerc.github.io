import re
#!/usr/bin/env python3
"""Browser smoke suite for the generated standalone build.
Requires Python Playwright plus a Chromium executable. Network calls are stubbed;
the suite exercises local UI/rendering with a deterministic eight-team fixture.
"""
from pathlib import Path
import asyncio, json, shutil, sys
try:
    from playwright.async_api import async_playwright
except Exception:
    print('SKIP: Playwright is not installed.')
    raise SystemExit(0)

ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'module-manifest.json').read_text())
VERSION=manifest['version']
HTML=ROOT/'build'/f'Unmanaged_Chaos_League_Companion_2026_v{VERSION}.html'
CHROMIUM=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not CHROMIUM:
    print('SKIP: Chromium executable not found.')
    raise SystemExit(0)

FIXTURE=r'''() => {
  const names=['dmercado','ChiefJuannataco','MadRagin','karebear','fograw','mgarcia49','brianbrianrbianbrina','Ntsuas'];
  leagueUsers=names.map((n,i)=>({user_id:`u${i+1}`,username:n,display_name:n,metadata:{team_name:n}}));
  const positions=['QB','RB','RB','WR','WR','WR','TE','K','DEF','RB','WR','QB'];
  discoveredSleeperPlayers={}; leagueRosters=[]; currentMatchups=[];
  for(let i=1;i<=8;i++){
    const ids=[];
    for(let j=0;j<12;j++){
      const id=`p${i}_${j}`;ids.push(id);
      discoveredSleeperPlayers[id]={id,full_name:`Player ${i}-${j+1}`,position:positions[j],team:['SF','DAL','KC','BUF','PHI','SEA','BAL','DET'][i-1],active:true};
    }
    leagueRosters.push({roster_id:i,owner_id:`u${i}`,players:ids,starters:ids.slice(0,9),reserve:i===1?[ids[10]]:[],settings:{wins:i%4,losses:(i+1)%4,ties:0,fpts:1000+i*10,fpts_decimal:0,waiver_position:9-i}});
    currentMatchups.push({roster_id:i,matchup_id:Math.ceil(i/2),points:0,players:ids,starters:ids.slice(0,9),players_points:{}});
  }
  verifiedLeague={league_id:SLEEPER_LEAGUE_ID,name:'Unmanaged Chaos League',total_rosters:8,roster_positions:['QB','RB','RB','WR','WR','WR','FLEX','K','DEF','BN','BN','BN'],settings:{leg:1,playoff_week_start:15}};
  verifiedDraft={draft_id:'d1',status:'complete',settings:{teams:8,rounds:14}};
  nflState={week:1,season:'2026',season_type:'regular'};
  seasonMatchupsByWeek={1:currentMatchups,2:JSON.parse(JSON.stringify(currentMatchups))};
  currentTransactions=[];seasonTransactionsByWeek={1:[],2:[]};
  sleeperCtx={...sleeperCtx,username:'dmercado',userId:'u1',leagueId:SLEEPER_LEAGUE_ID,draftId:'d1',rosterId:1,leagueName:'Unmanaged Chaos League',teamName:'dmercado'};
  const proj=new Map();for(const id of Object.keys(discoveredSleeperPlayers))proj.set(id,{pts:8+(Number(id.split('_')[1])||0)});
  discoveredSleeperPlayers.fa_rb1={id:'fa_rb1',full_name:'Available Runner A',position:'RB',team:'MIA',active:true};
  discoveredSleeperPlayers.fa_rb2={id:'fa_rb2',full_name:'Available Runner B',position:'RB',team:'NYJ',active:true};
  discoveredSleeperPlayers.fa_wr1={id:'fa_wr1',full_name:'Available Receiver',position:'WR',team:'TB',active:true};
  discoveredSleeperPlayers.fa_qb1={id:'fa_qb1',full_name:'Available Quarterback A',position:'QB',team:'LAC',active:true};
  discoveredSleeperPlayers.fa_qb2={id:'fa_qb2',full_name:'Available Quarterback B',position:'QB',team:'SEA',active:true};
  discoveredSleeperPlayers.fa_qb3={id:'fa_qb3',full_name:'Available Quarterback C',position:'QB',team:'CHI',active:true};
  discoveredSleeperPlayers.fa_qb4={id:'fa_qb4',full_name:'Available Quarterback D',position:'QB',team:'CAR',active:true};
  discoveredSleeperPlayers.fa_qb5={id:'fa_qb5',full_name:'Available Quarterback E',position:'QB',team:'NE',active:true};
  discoveredSleeperPlayers.fa_te1={id:'fa_te1',full_name:'Available Tight End',position:'TE',team:'GB',active:true};
  // Leave only one healthy WR on the selected team to exercise health-aware Major Roster Needs.
  discoveredSleeperPlayers.p1_3.injury_status='Questionable';
  discoveredSleeperPlayers.p1_4.injury_status='Questionable';
  discoveredSleeperPlayers.p1_5.injury_status='Questionable';
  proj.set('fa_rb1',{pts:16.5});proj.set('fa_rb2',{pts:11.25});proj.set('fa_wr1',{pts:14.75});
  proj.set('fa_qb1',{pts:21.1});proj.set('fa_qb2',{pts:20.1});proj.set('fa_qb3',{pts:19.1});proj.set('fa_qb4',{pts:18.1});proj.set('fa_qb5',{pts:17.1});proj.set('fa_te1',{pts:14.0});
  weekProjectionMaps.set(1,proj);weekProjectionMaps.set(2,proj);rememberProjectionMap(1,proj);
  lastDraftPicks=[];
  for(let r=1;r<=14;r++)for(let slot=1;slot<=8;slot++){
    const id=`p${slot}_${(r-1)%12}`,md=discoveredSleeperPlayers[id];
    lastDraftPicks.push({pick_no:(r-1)*8+slot,round:r,draft_slot:slot,roster_id:slot,picked_by:`u${slot}`,player_id:id,metadata:{first_name:'Player',last_name:`${slot}-${((r-1)%12)+1}`,position:md.position,team:md.team}});
  }
  runtimeDataMode='current';seasonDataMeta={lastSync:Date.now(),failures:[],historicalWeeksLoaded:0};
  ensureSeasonDataFresh=()=>Promise.resolve();syncSeasonData=()=>Promise.resolve();
  applyLifecycleUI();configureHomeForPhase(true,true,true);renderDraftSyncViews({force:true,changed:true});renderSeasonSyncViews();renderCompanionHome();
}'''

async def main():
    failures=[]; page_errors=[]
    def check(name,ok,detail=''):
        print(f"{'PASS' if ok else 'FAIL'}  {name}{' — '+detail if detail else ''}")
        if not ok: failures.append((name,detail))
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,executable_path=CHROMIUM,args=['--no-sandbox','--disable-web-security'])
        page=await browser.new_page(viewport={'width':1280,'height':900})
        page.on('pageerror',lambda e:page_errors.append(str(e)))
        await page.evaluate("window.fetch=async()=>new Response('{}',{status:404})")
        await page.set_content(HTML.read_text(encoding='utf-8'),wait_until='domcontentloaded')
        await page.wait_for_timeout(100)
        check('startup has one active view',await page.locator('.tab-view.active').count()==1)
        cold_nodes=await page.locator('*').count()
        check('cold-start DOM stays lightweight',cold_nodes<3500,str(cold_nodes))
        initial_tabs=await page.locator('.tabs .tab-btn').evaluate_all(
            "(els)=>els.map(e=>({tab:e.dataset.tab,hidden:e.hidden,text:e.textContent.trim()}))")
        check('FA/W visible on cold start',
              any(x['tab']=='faw' and not x['hidden'] for x in initial_tabs),
              str(initial_tabs))
        check('FA/W is renamed Players on main menu',
              any(x['tab']=='faw' and x['text']=='Players' for x in initial_tabs),
              str(initial_tabs))
        check('live-season menu order stable',
              [x['tab'] for x in initial_tabs]==['news','home','teams','team','season','faw','trade','settings','analysis','log'],
              str([x['tab'] for x in initial_tabs]))

        check('Team Analysis hidden on cold start',
              any(x['tab']=='analysis' and x['hidden'] for x in initial_tabs),
              str(initial_tabs))
        check('Draft Log hidden on cold start',
              any(x['tab']=='log' and x['hidden'] for x in initial_tabs),
              str(initial_tabs))
        visible_initial=[x['tab'] for x in initial_tabs if not x['hidden']]
        check('visible season menu has no draft-utility flash',
              visible_initial==['news','home','teams','team','season','faw','trade','settings'],
              str(visible_initial))

        # Critical real-startup test: navigation must work before fixture data,
        # IndexedDB hydration, or a successful Sleeper response.
        await page.locator('.tab-btn[data-tab="settings"]').click()
        empty_active=await page.locator('.tab-view.active').get_attribute('id')
        check('empty startup navigation is immediately usable',empty_active=='settingsView',empty_active or '')
        settings_labels=await page.locator('#settingsView .settings-section-label').all_text_contents()
        check('Settings II exposes full Companion sections',
              settings_labels==['Appearance','General','Draft & Report Card','Sleeper & Data','Reset & Maintenance'],
              str(settings_labels))
        check('archived draft preferences start collapsed',
              not await page.locator('#settingsView .settings-secondary-shell').evaluate('(e)=>e.open'))
        theme_count=await page.locator('#settingsThemeGrid [data-theme-choice]').count()
        check('Settings offers eight color themes',theme_count==8,str(theme_count))
        await page.locator('[data-theme-choice="forest"]').click()
        theme_state=await page.evaluate("({theme:document.documentElement.dataset.theme,nav:getComputedStyle(document.documentElement).getPropertyValue('--navy').trim(),selected:document.querySelector('[data-theme-choice=forest]').getAttribute('aria-checked'),danger:getComputedStyle(document.querySelector('.settings-danger-card')).borderColor})")
        check('theme applies immediately',theme_state['theme']=='forest' and theme_state['nav']=='#173d2b' and theme_state['selected']=='true',str(theme_state))
        coverage=await page.evaluate("""() => {
          const root=document.documentElement;
          root.dataset.theme='forest';
          const mk=(cls,parent=document.body)=>{const e=document.createElement('div');e.className=cls;parent.appendChild(e);return e};
          const intel=mk('season-intel-hero');
          const need=mk('waiver-need low');
          const chip=mk('team-trend-chip active');
          const standings=mk('standings-list rich');const row=mk('standing-row playoff-line',standings);
          const out={intel:getComputedStyle(intel).backgroundImage,needBg:getComputedStyle(need).backgroundColor,needBorder:getComputedStyle(need).borderColor,chipBg:getComputedStyle(chip).backgroundColor,rowShadow:getComputedStyle(row).boxShadow};
          [intel,need,chip,standings].forEach(e=>e.remove());
          return out;
        }""")
        check('theme coverage reaches Season/Teams informational surfaces', '23, 61, 43' in coverage['intel'] and coverage['needBg']=='rgb(237, 247, 240)' and coverage['chipBg']=='rgb(237, 247, 240)' and '155, 198, 167' in coverage['rowShadow'],str(coverage))
        theme_surface=await page.evaluate("""() => {
          const root=document.documentElement; root.dataset.theme='forest';
          const banner=document.querySelector('.draft-finished-banner');
          const partnerBox=document.querySelector('.trade-partner-selector');
          const partnerSelect=document.querySelector('#tradePartner');
          const b=getComputedStyle(banner),p=getComputedStyle(partnerBox),s=getComputedStyle(partnerSelect);
          return {bannerBg:b.backgroundImage,bannerBorder:b.borderTopColor,boxBorder:p.borderTopStyle,selectBorder:s.borderTopColor,selectBorderWidth:s.borderTopWidth};
        }""")
        check('Report Card banner + Trade Partner select follow theme',
              '23, 61, 43' in theme_surface['bannerBg'] and theme_surface['boxBorder']=='none' and theme_surface['selectBorder']=='rgb(63, 134, 95)' and theme_surface['selectBorderWidth']=='2px',
              str(theme_surface))
        await page.locator('[data-theme-choice="blue"]').click()
        await page.set_viewport_size({'width':320,'height':800})
        settings_width=await page.evaluate('''()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})''')
        check('320px page containment: settings',settings_width['sw']<=settings_width['cw']+1,str(settings_width))
        await page.set_viewport_size({'width':1280,'height':900})
        await page.locator('.tab-btn[data-tab="home"]').click()
        check('empty startup can return Home',(await page.locator('.tab-view.active').get_attribute('id'))=='homeView')

        perf=await page.evaluate('''()=>({
          hasBackground: initializeCompanionRuntime.toString().includes("backgroundTask('storage-hydration'"),
          noFullRender: !initializeCompanionRuntime.toString().includes('render();'),
          currentWeekOnly: initializeCompanionRuntime.toString().includes('hydrateSavedProjectionMap(currentWeekNumber())')
        })''')
        check('startup hydration is background-only',
              perf['hasBackground'] and perf['noFullRender'] and perf['currentWeekOnly'],
              str(perf))

        startup_perf=await page.evaluate('''()=>({
          activeOnly: renderRestoredRuntimeState.toString().includes("document.querySelector('.tab-view.active')"),
          sameTeam: connectSleeper.toString().includes('sameLoadedTeam'),
          postDraftShortCircuit: renderDraftSyncViews.toString().indexOf('if(draftAllowsPostDraftViews())')<
            renderDraftSyncViews.toString().indexOf('render();'),
          noAutoDiagnostics: !document.getElementById('settingsDiagnostics')
        })''')
        check('post-load main-thread protections enabled',
              all(startup_perf.values()),str(startup_perf))

        await page.evaluate(FIXTURE)

        await page.evaluate("switchTab('news')")
        filter_contrast=await page.evaluate("""() => {
          const all=document.querySelector('#newsView [data-news-filter="all"]');
          const games=document.querySelector('#newsView [data-news-filter="matchup"]');
          const a=getComputedStyle(all),g=getComputedStyle(games);
          return {activeColor:a.color,activeBg:a.backgroundColor,inactiveColor:g.color,inactiveBg:g.backgroundColor};
        }""")
        check('Newsroom inactive filter labels have visible computed contrast',
              filter_contrast['inactiveColor']=='rgb(31, 41, 55)' and filter_contrast['inactiveBg']=='rgb(255, 255, 255)',
              str(filter_contrast))
        check('Newsroom active filter retains inverse contrast',
              filter_contrast['activeColor']=='rgb(255, 255, 255)' and filter_contrast['activeBg']!='rgb(255, 255, 255)',
              str(filter_contrast))
        empty_cards=await page.evaluate('''()=>{
          currentTransactions=[];
          seasonTransactionsByWeek={1:[],2:[]};
          seasonMatchupsByWeek={1:currentMatchups,2:JSON.parse(JSON.stringify(currentMatchups))};
          switchTab('season');
          prepareSeasonSection('seasonLeague');
          document.querySelector('#seasonLeague')?.scrollIntoView({block:'start'});
          const info=sel=>{
            const el=document.querySelector(sel),msg=el?.querySelector('.empty');
            const cs=el?getComputedStyle(el):null,ms=msg?getComputedStyle(msg):null;
            return {
              cls:el?.className||'',
              h:el?.getBoundingClientRect().height||0,
              minH:cs?.minHeight||'',
              font:ms?.fontSize||'',
              line:ms?.lineHeight||'',
              text:msg?.textContent.trim()||''
            };
          };
          return {
            activity:info('.activity-center'),
            newsroom:info('.newsroom-center'),
            weekly:info('.weekly-report'),
            activityStatus:getComputedStyle(document.querySelector('#activityStatus')).display,
            newsroomStatus:getComputedStyle(document.querySelector('#newsroomStatus')).display,
            weeklyControls:getComputedStyle(document.querySelector('.weekly-report-controls')).display
          };
        }''')
        check('News Results Movement empty cards collapse at outer-card level',
              all('compact-empty' in empty_cards[k]['cls'] and empty_cards[k]['h']<90 for k in ['activity','newsroom','weekly']),str(empty_cards))
        check('News Results Movement empty messages use identical typography',
              len({empty_cards[k]['font'] for k in ['activity','newsroom','weekly']})==1 and
              len({empty_cards[k]['line'] for k in ['activity','newsroom','weekly']})==1,str(empty_cards))
        check('Empty league cards hide status/control scaffolding',
              empty_cards['activityStatus']=='none' and empty_cards['newsroomStatus']=='none' and empty_cards['weeklyControls']=='none',str(empty_cards))

        season_lazy=await page.evaluate('''()=>{
          window.scrollTo(0,0);
          switchTab('season');
          return {
            nodes:document.querySelectorAll('#seasonView *').length,
            dirty:[...seasonLazyDirty],
            waiverRows:document.querySelectorAll('#waiverGrid .waiver-player').length,
            newsroomRows:document.querySelectorAll('#newsroomGrid > *').length,
            standingsRows:document.querySelectorAll('#standingsList > *').length,
            historyRows:document.querySelectorAll('#historyBridgeGrid > *').length
          };
        }''')
        check('Season first-open DOM is reduced',season_lazy['nodes']<650,str(season_lazy))
        check('Season keeps below-fold groups deferred on first open',
              all(x in season_lazy['dirty'] for x in ['seasonPostseason','seasonRecords']) and 'seasonLeague' not in season_lazy['dirty'],str(season_lazy))


        other_matchups=await page.evaluate('''()=>{
          renderOtherLeagueMatchups();
          const rows=[...document.querySelectorAll('#otherLeagueMatchupsList .other-matchup-row')];
          const mine=String(sleeperCtx.rosterId||'');
          const pairIds=otherLeagueMatchupPairs(seasonDisplayWeek()).filter(p=>String(p.a.roster_id)!==mine&&String(p.b.roster_id)!==mine).map(p=>String(p.matchupId));
          rows[0]?.click();
          const d=document.querySelector('#otherMatchupDialog');
          const out={rows:rows.length,pairIds,open:!!d?.open,title:document.querySelector('#otherMatchupTitle')?.textContent||'',team1:document.querySelector('#otherTeam1StarterLabel')?.textContent||'',team2:document.querySelector('#otherTeam2StarterLabel')?.textContent||'',bench:document.querySelector('#otherMatchupBenchDetail')?.textContent||''};
          d?.close();return out;
        }''')
        check('Other League Matchups shows only the other three games and opens detail modal',
              other_matchups['rows']==3 and len(other_matchups['pairIds'])==3 and other_matchups['open'] and ' @ ' in other_matchups['title'] and other_matchups['team1'].endswith(' Starters') and other_matchups['team2'].endswith(' Starters') and ' / ' in other_matchups['bench'],str(other_matchups))


        venue_matrix=await page.evaluate("""()=>{
          const teams=['1','2','3','4','5','6','7','8'];
          const rows={};
          for(const id of teams)rows[id]=[];
          for(let w=1;w<=14;w++)for(const id of teams)rows[id].push(uclVenueForRoster(w,id));
          const audit=Object.fromEntries(Object.entries(rows).map(([id,v])=>[id,{
            home:v.filter(x=>x==='home').length,
            away:v.filter(x=>x==='away').length,
            pattern:v.map(x=>x==='home'?'H':'A').join('')
          }]));
          return {
            audit,
            w1:{dmercado:uclVenueForRoster(1,'1'),fograw:uclVenueForRoster(1,'5')},
            w8:{dmercado:uclVenueForRoster(8,'1'),fograw:uclVenueForRoster(8,'5')},
            pillHome:uclVenuePill(1,'5'),
            pillAway:uclVenuePill(1,'1')
          };
        }""")
        check('Fixed Home Away matrix gives every roster 7 home and 7 away',
              all(x['home']==7 and x['away']==7 for x in venue_matrix['audit'].values()),
              str(venue_matrix))
        check('Return dmercado fograw meeting reverses venue',
              venue_matrix['w1']=={'dmercado':'away','fograw':'home'} and
              venue_matrix['w8']=={'dmercado':'home','fograw':'away'},
              str(venue_matrix))
        check('HOME and AWAY pills render semantic classes',
              'venue-pill home' in venue_matrix['pillHome'] and 'HOME' in venue_matrix['pillHome'] and
              'venue-pill away' in venue_matrix['pillAway'] and 'AWAY' in venue_matrix['pillAway'],
              str(venue_matrix))


        bench_sort=await page.evaluate("""()=>{
          const players={
            qb1:{name:'QB One',pos:'QB'},
            rb1:{name:'RB Low',pos:'RB'},rb2:{name:'RB High',pos:'RB'},
            wr1:{name:'WR Low',pos:'WR'},wr2:{name:'WR High',pos:'WR'},
            te1:{name:'TE One',pos:'TE'},def1:{name:'Defense',pos:'DEF'},k1:{name:'Kicker',pos:'K'}
          };
          const pts={qb1:20,rb1:8,rb2:14,wr1:7,wr2:13,te1:9,def1:6,k1:5};
          return sortMyTeamBenchIds(
            ['k1','wr1','rb1','def1','qb1','te1','wr2','rb2'],
            id=>players[id],
            id=>pts[id]
          ).map(id=>players[id].name);
        }""")
        check('My Team bench order is positional with higher projection first',
              bench_sort==['QB One','RB High','RB Low','WR High','WR Low','TE One','Defense','Kicker'],
              str(bench_sort))

        health_floor=await page.evaluate('''()=>{
          const ids=['hf1','hf2','hf3','hf4','hf5','hf6'];
          const cache=new Map();
          ids.forEach((id,i)=>{const q=i>=3;discoveredSleeperPlayers[id]={player_id:id,full_name:'Health WR '+(i+1),position:'WR',team:'SF',injury_status:q?'Questionable':''};cache.set(id,{id,name:'Health WR '+(i+1),pos:'WR',team:'SF'});});
          const roster={roster_id:'health-test',players:ids,starters:ids.slice(0,3),reserve:[],settings:{}};
          const needs=waiverNeedProfile(roster,cache);const wr=needs.find(n=>n.pos==='WR');
          ids.forEach(id=>delete discoveredSleeperPlayers[id]);
          return wr||null;
        }''')
        check('Three healthy WRs plus three Questionable WRs triggers precautionary WR need',
              health_floor and health_floor.get('kind')=='potential' and health_floor.get('severity')==3 and '3 healthy WRs' in health_floor.get('reason',''),str(health_floor))

        command_lazy=await page.evaluate('''()=>{
          const oldSync=syncSeasonData;let syncs=0;syncSeasonData=async()=>{syncs++;};
          try{
            navigateCommand('season','seasonManagement');
            return {syncs,dirty:[...seasonLazyDirty],waiverText:document.querySelector('#waiverMajorGrid')?.textContent||''};
          }finally{syncSeasonData=oldSync;}
        }''')
        check('Season command section renders target without sync',
              command_lazy['syncs']==0 and 'seasonManagement' not in command_lazy['dirty'] and len(command_lazy['waiverText'].strip())>0,
              str(command_lazy))

        postseason_lazy=await page.evaluate('''async()=>{
          // Leave Week 2 cached and make Weeks 3-14 missing, matching real lazy schedule behavior.
          for(let w=3;w<playoffStartWeek();w++)delete seasonMatchupsByWeek[w];
          const oldGet=sleeperGetSafe,oldPersist=persistRuntimeCache;
          let calls=[],persists=0;
          sleeperGetSafe=async(path,opts)=>{
            const m=String(path).match(/\/matchups\/(\d+)$/);calls.push(Number(m?.[1]||0));
            return {ok:true,value:JSON.parse(JSON.stringify(currentMatchups))};
          };
          persistRuntimeCache=()=>{persists++;};
          try{
            switchTab('season');
            const before=calls.length;
            prepareSeasonSection('seasonPostseason');
            await ensureRemainingRegularSeasonSchedule();
            const first=calls.slice();
            const labels=[...document.querySelectorAll('#playoffScheduleList .playoff-game b')].map(x=>x.textContent.trim());
            const beforeSecond=calls.length;
            await ensureRemainingRegularSeasonSchedule();
            return {before,first,secondCalls:calls.length-beforeSecond,persists,labels,loaded:Object.keys(seasonMatchupsByWeek).filter(w=>Number(w)>=3&&Number(w)<playoffStartWeek()).length};
          }finally{sleeperGetSafe=oldGet;persistRuntimeCache=oldPersist;}
        }''')
        check('Postseason lazy-loads only missing remaining schedule weeks on demand',
              postseason_lazy['before']==0 and postseason_lazy['loaded']==12 and sorted(postseason_lazy['first'])==list(range(3,15)) and postseason_lazy['secondCalls']==0 and postseason_lazy['persists']==1 and all(x!='Schedule not loaded' for x in postseason_lazy['labels']),
              str(postseason_lazy))
        await page.evaluate("window.scrollTo(0,0);switchTab('home')")

        trade_lazy=await page.evaluate('''()=>{
          window.scrollTo(0,0);
          switchTab('trade');
          return {
            dirty:[...tradeLazyDirty],
            partnerRows:document.querySelectorAll('#tradePartnerIdeas > *').length,
            retroRows:document.querySelectorAll('#tradeRetrospectives > *').length,
            nodes:document.querySelectorAll('#tradeView *').length
          };
        }''')
        check('Trade Center defers secondary analysis on open',
              all(x in trade_lazy['dirty'] for x in ['tradePartnerIdeasSection','tradeRetrospectivesSection']) and trade_lazy['partnerRows']==0 and trade_lazy['retroRows']==0,
              str(trade_lazy))
        trade_forced=await page.evaluate('''()=>{
          renderTradeLazySection('tradePartnerIdeasSection',{force:true});
          renderTradeLazySection('tradeRetrospectivesSection',{force:true});
          return {partnerRows:document.querySelectorAll('#tradePartnerIdeas > *').length,retroText:document.querySelector('#tradeRetrospectives')?.textContent||''};
        }''')
        check('Trade Center lazy sections render on demand',trade_forced['partnerRows']>0 and len(trade_forced['retroText'].strip())>0,str(trade_forced))
        trade_density=await page.evaluate('''()=>{
          const list=document.querySelector('#tradeGiveList');
          const row=list?.querySelector('.trade-player-option');
          const grid=list?.querySelector('.trade-position-grid');
          const value=row?.querySelector('.trade-value b');
          const partner=document.querySelector('.trade-partner-selector');
          const partnerSelect=document.querySelector('#tradePartner');
          if(!list||!row||!grid||!value||!partner||!partnerSelect)return null;
          const ls=getComputedStyle(list),gs=getComputedStyle(grid),ps=getComputedStyle(partner),ss=getComputedStyle(partnerSelect);
          return {maxHeight:ls.maxHeight,gridColumns:gs.gridTemplateColumns,value:Number(value.textContent),partnerBorder:ps.borderTopStyle,selectBorder:ss.borderTopStyle,selectBorderWidth:ss.borderTopWidth,selectBorderColor:ss.borderTopColor,groups:list.querySelectorAll('.trade-position-group').length};
        }''')
        check('Trade Center uses grouped two-column value layout',
              bool(trade_density) and trade_density['maxHeight']=='300px' and trade_density['gridColumns'].count('px')>=2 and 0<=trade_density['value']<=100 and trade_density['partnerBorder']=='none' and trade_density['selectBorder']=='solid' and trade_density['selectBorderWidth']=='2px' and trade_density['groups']>0,
              str(trade_density))
        value_detail=await page.evaluate('''()=>{
          const first=document.querySelector('#tradeGiveList input')?.value;
          if(!first)return null;
          const d=tradePlayerValueDetail(tradePlayerReference(first));
          return {value:d.value,tier:d.tier,parts:d.parts};
        }''')
        check('UCL Trade Value returns bounded transparent components',
              bool(value_detail) and 0<=value_detail['value']<=100 and bool(value_detail['tier']) and all(k in value_detail['parts'] for k in ['preseason','projection','production','role','scarcity']),
              str(value_detail))

        package_math=await page.evaluate('''()=>({
          elite:tradePackageScoreFromValues([92]),
          threeMids:tradePackageScoreFromValues([60,60,60]),
          twoStrong:tradePackageScoreFromValues([80,70]),
          rawThree:60+60+60
        })''')
        check('Trade Evaluation II discounts package depth and preserves consolidation value',
              package_math['elite']>package_math['threeMids'] and package_math['twoStrong']>package_math['elite'] and package_math['threeMids']<package_math['rawThree'],
              str(package_math))

        calc_audit=await page.evaluate('''()=>{
          const roster=leagueRosters.find(r=>String(r.roster_id)===String(sleeperCtx.rosterId));
          const week=teamDisplayWeek(),match=teamWeekMatchup(roster.roster_id,week);
          const expectedTeam=new Set(matchupPlayerIds(roster,match.mine)).size;
          const homeRosterIds=new Set((roster.players||[]).map(String));
          const expectedHome=homeRosterIds.size;
          const oldPlayer=sleeperRosterPlayer,oldPoint=teamWeekPointFor;
          let teamPlayerCalls=0,teamPointCalls=0,homePlayerCalls=0,homeTotalPlayerCalls=0;
          sleeperRosterPlayer=(...args)=>{teamPlayerCalls++;return oldPlayer(...args);};
          teamWeekPointFor=(...args)=>{teamPointCalls++;return oldPoint(...args);};
          try{renderTeam();}finally{sleeperRosterPlayer=oldPlayer;teamWeekPointFor=oldPoint;}
          sleeperRosterPlayer=(...args)=>{homeTotalPlayerCalls++;if(homeRosterIds.has(String(args[0])))homePlayerCalls++;return oldPlayer(...args);};
          try{renderCompanionHome();}finally{sleeperRosterPlayer=oldPlayer;}
          return {expectedTeam,expectedHome,teamPlayerCalls,teamPointCalls,homePlayerCalls,homeTotalPlayerCalls};
        }''')
        check('My Team resolves each player/weekly value once per render',
              calc_audit['teamPlayerCalls']<=calc_audit['expectedTeam']+1 and calc_audit['teamPointCalls']<=calc_audit['expectedTeam']+1,
              str(calc_audit))
        check('Command Center shares roster lookups across Weekly Action Brief inputs',
              calc_audit['homePlayerCalls']<=calc_audit['expectedHome']+1 and calc_audit['homeTotalPlayerCalls']<100,
              str(calc_audit))

        injury_and_needs=await page.evaluate('''()=>{
          switchTab('team');renderTeam();
          const injuries=[...document.querySelectorAll('#teamView .my-team-injury')].map(x=>x.textContent.trim());
          const roster=leagueRosters.find(r=>String(r.roster_id)===String(sleeperCtx.rosterId));
          const needs=waiverNeedProfile(roster);
          const cards=rosterNeedsMoveCards(roster,1);
          const wrHealthy=waiverHealthyCount(roster,'WR'),wrTotal=waiverPositionTotal(roster,'WR');
          const pressure=seasonRosterPressure(roster).find(x=>x.label==='WR')||null;
          const warnings=seasonWarnings(roster).filter(x=>String(x.text||'').startsWith('WR '));
          return {injuries,wrNeed:needs.find(x=>x.pos==='WR')||null,wrCard:cards.find(x=>x.pos==='WR')||null,wrHealthy,wrTotal,pressure,warnings};
        }''')
        check('My Team shows current injury designations',
              injury_and_needs['injuries'].count('Questionable')>=3,str(injury_and_needs))
        check('Doubtful/out/reserve escalates Roster Needs & Moves to action',
              bool(injury_and_needs['wrNeed']) and injury_and_needs['wrNeed']['kind']=='health' and bool(injury_and_needs['wrCard']) and injury_and_needs['wrCard']['type']=='action' and len(injury_and_needs['wrCard']['alternatives'])>0,
              str(injury_and_needs))
        check('Shared health displays distinguish healthy, Questionable, and severe WR availability',
              injury_and_needs['wrHealthy'] < injury_and_needs['wrTotal'] and 'healthy' in injury_and_needs['pressure']['value'] and 'Q' in injury_and_needs['pressure']['value'] and any('availability problem' in x['text'] for x in injury_and_needs['warnings']),
              str(injury_and_needs))
        threshold_rules=await page.evaluate('''()=>({
          qb:benchThreatRequiredMultiplier('QB',{slot:'QB',player:{pos:'QB'}}),
          rb:benchThreatRequiredMultiplier('RB',{slot:'RB',player:{pos:'RB'}}),
          wr:benchThreatRequiredMultiplier('WR',{slot:'FLEX',player:{pos:'RB'}}),
          teFlexWr:benchThreatRequiredMultiplier('TE',{slot:'FLEX',player:{pos:'WR'}}),
          teFlexRb:benchThreatRequiredMultiplier('TE',{slot:'FLEX',player:{pos:'RB'}}),
          def:benchThreatRequiredMultiplier('DEF',{slot:'DEF',player:{pos:'DEF'}}),
          k:benchThreatRequiredMultiplier('K',{slot:'K',player:{pos:'K'}})
        })''')
        check('Bench recommendation thresholds are QB 10%, standard 20%, TE-over-WR FLEX 40%',
              abs(threshold_rules['qb']-1.10)<0.001 and abs(threshold_rules['rb']-1.20)<0.001 and abs(threshold_rules['wr']-1.20)<0.001 and abs(threshold_rules['teFlexWr']-1.40)<0.001 and abs(threshold_rules['teFlexRb']-1.20)<0.001 and abs(threshold_rules['def']-1.20)<0.001 and abs(threshold_rules['k']-1.20)<0.001,
              str(threshold_rules))

        rivalry_lazy=await page.evaluate('''async()=>{
          switchTab('season');window.scrollTo(0,0);
          const oldGet=sleeperGetSafe;let calls=[];
          verifiedLeague={...verifiedLeague,previous_league_id:'hist2025'};
          const histLeague={league_id:'hist2025',season:'2025',previous_league_id:'0',settings:{playoff_week_start:15}};
          const histRosters=[{roster_id:21,owner_id:'u1'},{roster_id:22,owner_id:'u2'}];
          sleeperGetSafe=async(path,opts={})=>{
            calls.push(path);
            if(path==='/league/hist2025')return {ok:true,value:histLeague,label:'historical league'};
            if(path==='/league/hist2025/rosters')return {ok:true,value:histRosters,label:'historical rosters'};
            const m=path.match(/\/league\/hist2025\/matchups\/([0-9]+)/);
            if(m){const w=Number(m[1]);return {ok:true,value:w===3?[{roster_id:21,matchup_id:1,points:121.5},{roster_id:22,matchup_id:1,points:110.0}]:[],label:'historical matchups'};}
            return oldGet(path,opts);
          };
          rivalryApiGames=[];rivalryApiPairKey='';rivalryApiBusy=false;storageRemove(RIVALRY_API_CACHE_KEY);
          const roster=leagueRosters[0],oppRoster=leagueRosters[1];
          try{await ensureRivalryApiHistory(roster,oppRoster);renderRivalryContext(roster,oppRoster);}
          finally{sleeperGetSafe=oldGet;}
          const labels=[...document.querySelectorAll('#rivalryMetrics .rivalry-metric span')].map(x=>x.textContent.trim());
          return {calls,games:rivalryApiGames.length,labels,status:document.querySelector('#rivalryStatus')?.textContent||''};
        }''')
        check('Rivalry archive fetches historical league chain only on records demand',
              rivalry_lazy['games']==1 and '/league/hist2025' in rivalry_lazy['calls'] and '/league/hist2025/rosters' in rivalry_lazy['calls'] and any('/matchups/' in x for x in rivalry_lazy['calls']),str(rivalry_lazy))
        check('Rivalry metrics order keeps PF cards together',
              rivalry_lazy['labels']==['Series','Largest Blowout','dmercado PF','ChiefJuannataco PF','Highest-Scoring Meeting','Closest Matchup','Last Meeting','Longest Win Streak'],str(rivalry_lazy['labels']))

        rivalry_champ=await page.evaluate('''()=>{
          const roster=leagueRosters[0],oppRoster=leagueRosters[1];
          const a=rosterUserName(roster),b=rosterUserName(oppRoster);
          const oldGames=rivalryApiGames,oldChamps=rivalryChampionships;
          rivalryChampionships={
            '2025':{season:2025,w:'21',l:'22',week:17},
            '2018':{season:2018,w:'21',l:'22',week:16}
          };
          rivalryApiGames=[
            {season:2025,week:17,teamA:a,teamB:b,rosterA:'21',rosterB:'22',scoreA:142.9,scoreB:100.0,source:'sleeper-history'},
            {season:2025,week:10,teamA:a,teamB:b,rosterA:'21',rosterB:'22',scoreA:130.0,scoreB:120.0,source:'sleeper-history'},
            {season:2025,week:4,teamA:a,teamB:b,rosterA:'21',rosterB:'22',scoreA:125.0,scoreB:111.0,source:'sleeper-history'},
            {season:2024,week:12,teamA:a,teamB:b,rosterA:'21',rosterB:'22',scoreA:128.0,scoreB:109.0,source:'sleeper-history'},
            {season:2023,week:8,teamA:a,teamB:b,rosterA:'21',rosterB:'22',scoreA:119.0,scoreB:101.0,source:'sleeper-history'},
            {season:2022,week:7,teamA:a,teamB:b,rosterA:'21',rosterB:'22',scoreA:117.0,scoreB:99.0,source:'sleeper-history'},
            {season:2021,week:6,teamA:a,teamB:b,rosterA:'21',rosterB:'22',scoreA:116.0,scoreB:98.0,source:'sleeper-history'},
            {season:2018,week:16,teamA:a,teamB:b,rosterA:'21',rosterB:'22',scoreA:110.0,scoreB:90.0,source:'sleeper-history'}
          ];
          try{
            renderRivalryContext(roster,oppRoster);
            const rows=[...document.querySelectorAll('#rivalryRecentGames .rivalry-game')].map(x=>({
              champ:x.classList.contains('championship'),
              text:x.textContent.replace(/\s+/g,' ').trim(),
              badge:x.querySelector('.rg-champ')?.textContent||'',
              badgeWidth:x.querySelector('.rg-champ')?.getBoundingClientRect().width||0,
              badgeScroll:x.querySelector('.rg-champ')?.scrollWidth||0
            }));
            const notes=(document.querySelector('#rivalryNotes')?.textContent||'').replace(/\s+/g,' ').trim();
            const labels=[...document.querySelectorAll('#rivalryMetrics .rivalry-metric span')].map(x=>x.textContent.trim());
            return {rows,notes,labels};
          }finally{rivalryApiGames=oldGames;rivalryChampionships=oldChamps;renderRivalryContext(roster,oppRoster);}
        }''')
        check('Only the exact UCL title game receives Championship tag',
              len(rivalry_champ['rows'])==6 and sum(1 for r in rivalry_champ['rows'] if r['champ'])==1 and rivalry_champ['rows'][0]['champ'] and not rivalry_champ['rows'][1]['champ'] and not rivalry_champ['rows'][2]['champ'],str(rivalry_champ))
        check('Championship tag is fully visible',
              rivalry_champ['rows'][0]['badge']=='🏆 CHAMPIONSHIP' and rivalry_champ['rows'][0]['badgeWidth']+1>=rivalry_champ['rows'][0]['badgeScroll'],str(rivalry_champ['rows'][0]))
        check('Rivalry margin uses explicit PTS label',
              'Margin: 42.90 PTS' in rivalry_champ['rows'][0]['text'],str(rivalry_champ['rows']))
        check('Series Notes number UCL Bowls and include championships outside Recent Meetings',
              'UCL Bowl VIII (2025)' in rivalry_champ['notes'] and '142.90 to 100.00' in rivalry_champ['notes'] and 'UCL Bowl I (2018)' in rivalry_champ['notes'] and '110.00 to 90.00' in rivalry_champ['notes'] and 'has never beaten' in rivalry_champ['notes'],str(rivalry_champ['notes']))
        check('Rivalry metrics include Closest Matchup before Last Meeting',
              'Closest Matchup' in rivalry_champ['labels'] and rivalry_champ['labels'].index('Closest Matchup')<rivalry_champ['labels'].index('Last Meeting'),str(rivalry_champ['labels']))

        rivalry_zero=await page.evaluate('''()=>{
          const roster=leagueRosters[0],oppRoster=leagueRosters[1];
          const a=rosterUserName(roster),b=rosterUserName(oppRoster);
          const oldGames=rivalryApiGames,oldChamps=rivalryChampionships;
          rivalryChampionships={};
          rivalryApiGames=[
            {season:2025,week:1,teamA:a,teamB:b,rosterA:'21',rosterB:'22',scoreA:0,scoreB:0,source:'sleeper-history'},
            {season:2025,week:3,teamA:a,teamB:b,rosterA:'21',rosterB:'22',scoreA:101.5,scoreB:95.2,source:'sleeper-history'}
          ];
          try{
            renderRivalryContext(roster,oppRoster);
            return {
              series:(document.querySelector('#rivalryMetrics .rivalry-metric b')?.textContent||'').trim(),
              meetings:(document.querySelector('#rivalryHero span')?.textContent||'').trim(),
              rows:document.querySelectorAll('#rivalryRecentGames .rivalry-game').length
            };
          }finally{rivalryApiGames=oldGames;rivalryChampionships=oldChamps;renderRivalryContext(roster,oppRoster);}
        }''')
        check('Rivalry history excludes phantom 0-0 weeks',
              rivalry_zero['series']=='1-0' and rivalry_zero['rows']==1 and rivalry_zero['meetings'].startswith('1 recorded meeting'),str(rivalry_zero))




        alias_history_merge=await page.evaluate("""()=>{
          const oldUsers=leagueUsers,oldGames=rivalryApiGames,oldSource=uclHistorySource;
          try{
            leagueUsers=[
              {user_id:'u-d',username:'dmercado',display_name:'David',metadata:{team_name:'Mercado Mayhem'}},
              {user_id:'u-f',username:'fograw',display_name:'Fog Raw',metadata:{team_name:'Fog City'}}
            ];
            rivalryApiGames=[
              {season:2019,week:10,teamA:'Mercado Mayhem',teamB:'Fog City',userA:'u-d',userB:'u-f',scoreA:138.07,scoreB:138.41,source:'sleeper-history'}
            ];
            uclHistorySource=null;
            const games=rivalryGamesBetween('Mercado Mayhem','Fog City');
            const w10=games.find(g=>g.season===2019&&g.week===10)||null;
            const audit=historicalMatchupAudit('Mercado Mayhem','Fog City',2019,10);
            return {
              game:w10,
              auditFinal:audit.final,
              matchedRows:audit.rows.filter(r=>r.targetMatch),
              correctionRows:audit.rows.filter(r=>r.correctionMatched)
            };
          }finally{leagueUsers=oldUsers;rivalryApiGames=oldGames;uclHistorySource=oldSource;}
        }""")
        check('Verified correction survives current team-name aliases',
              alias_history_merge['game'] and
              abs(alias_history_merge['game']['scoreA']-140.47)<.001 and
              abs(alias_history_merge['game']['scoreB']-138.51)<.001 and
              alias_history_merge['game']['source']=='verified-correction',
              str(alias_history_merge))
        check('Historical audit exposes alias match and corrected final',
              len(alias_history_merge['matchedRows'])>=1 and len(alias_history_merge['correctionRows'])>=1 and
              alias_history_merge['auditFinal'] and alias_history_merge['auditFinal']['source']=='verified-correction',
              str(alias_history_merge))

        verified_history_merge=await page.evaluate("""()=>{
          const oldGames=rivalryApiGames,oldSource=uclHistorySource;
          try{
            rivalryApiGames=[
              {season:2019,week:10,teamA:'dmercado',teamB:'fograw',scoreA:138.07,scoreB:138.41,source:'sleeper-history'},
              {season:2019,week:7,teamA:'dmercado',teamB:'fograw',scoreA:120,scoreB:110,source:'sleeper-history'}
            ];
            uclHistorySource={games:[
              {season:2019,week:10,teamA:'dmercado',teamB:'fograw',scoreA:138.07,scoreB:138.41},
              {season:2019,week:10,teamA:'dmercado',teamB:'fograw',scoreA:140.47,scoreB:138.51}
            ]};
            const games=rivalryGamesBetween('dmercado','fograw');
            const w10=games.filter(g=>g.season===2019&&g.week===10);
            const series=rivalrySeries('dmercado','fograw');
            return {
              w10Count:w10.length,
              w10:w10[0]||null,
              closest:series.closest,
              totalGames:games.length
            };
          }finally{rivalryApiGames=oldGames;uclHistorySource=oldSource;}
        }""")
        check('Conflicting 2019 W10 sources merge into one verified game',
              verified_history_merge['w10Count']==1 and
              abs(verified_history_merge['w10']['scoreA']-140.47)<.001 and
              abs(verified_history_merge['w10']['scoreB']-138.51)<.001 and
              verified_history_merge['w10']['source']=='verified-correction',
              str(verified_history_merge))
        check('Corrected 2019 W10 can drive Closest Matchup without stale duplicate',
              abs(verified_history_merge['closest']['margin']-1.96)<.001 and
              verified_history_merge['closest']['winner']=='dmercado',
              str(verified_history_merge))

        score_authority=await page.evaluate("""()=>{
          const directCustom=sleeperAuthoritativeMatchupScore({points:138.07,custom_points:140.47});
          const directRaw=sleeperAuthoritativeMatchupScore({points:138.51,custom_points:null});
          const zeroCustom=sleeperAuthoritativeMatchupScore({points:99.99,custom_points:0});
          const game=rivalryHistoryGameFromWeek(
            [
              {roster_id:'1',matchup_id:10,points:138.07,custom_points:140.47},
              {roster_id:'2',matchup_id:10,points:138.41,custom_points:138.51}
            ],
            '1','2',2019,10,'hist2019',
            {nameA:'dmercado',nameB:'fograw',userA:'a',userB:'b'}
          );
          return {directCustom,directRaw,zeroCustom,game};
        }""")
        check('Sleeper custom_points overrides raw historical points',
              abs(score_authority['directCustom']['value']-140.47)<.001 and score_authority['directCustom']['source']=='custom' and
              abs(score_authority['directRaw']['value']-138.51)<.001 and score_authority['directRaw']['source']=='points',
              str(score_authority))
        check('Zero custom_points remains a valid authoritative score',
              score_authority['zeroCustom']['value']==0 and score_authority['zeroCustom']['source']=='custom',
              str(score_authority))
        check('Historical rivalry game reconstruction preserves corrected scores and source',
              abs(score_authority['game']['scoreA']-140.47)<.001 and abs(score_authority['game']['scoreB']-138.51)<.001 and
              score_authority['game']['scoreSourceA']=='custom' and score_authority['game']['scoreSourceB']=='custom',
              str(score_authority))

        streak_span=await page.evaluate("""()=>{
          const oldGames=rivalryApiGames;
          try{
            rivalryApiGames=[
              {season:2021,week:5,teamA:'A',teamB:'B',scoreA:110,scoreB:100,source:'sleeper-history'},
              {season:2022,week:4,teamA:'A',teamB:'B',scoreA:111,scoreB:101,source:'sleeper-history'},
              {season:2023,week:3,teamA:'A',teamB:'B',scoreA:112,scoreB:102,source:'sleeper-history'},
              {season:2024,week:2,teamA:'A',teamB:'B',scoreA:90,scoreB:120,source:'sleeper-history'},
              {season:2025,week:1,teamA:'A',teamB:'B',scoreA:95,scoreB:121,source:'sleeper-history'}
            ];
            const completed=rivalrySeries('A','B').longestStreak;
            const completedSpan=rivalryStreakSpan(completed);
            rivalryApiGames=[
              {season:2023,week:3,teamA:'A',teamB:'B',scoreA:90,scoreB:120,source:'sleeper-history'},
              {season:2024,week:2,teamA:'A',teamB:'B',scoreA:95,scoreB:121,source:'sleeper-history'},
              {season:2025,week:1,teamA:'A',teamB:'B',scoreA:98,scoreB:122,source:'sleeper-history'}
            ];
            const active=rivalrySeries('A','B').longestStreak;
            return {completed:{span:completedSpan,active:completed.active,count:completed.count},active:{span:rivalryStreakSpan(active),active:active.active,count:active.count}};
          }finally{rivalryApiGames=oldGames;}
        }""")
        check('Completed longest streak shows start and end year',
              streak_span['completed']['span']=='2021–2023' and not streak_span['completed']['active'] and streak_span['completed']['count']==3,
              str(streak_span))
        check('Active longest streak shows start year through Present',
              streak_span['active']['span']=='2023–Present' and streak_span['active']['active'] and streak_span['active']['count']==3,
              str(streak_span))


        newsroom_scope=await page.evaluate("""()=>{
          const oldState=nflState,oldTx=seasonTransactionsByWeek;
          try{
            nflState={...(oldState||{}),week:1};
            const week1=newsroomWindowWeeks();
            nflState={...(oldState||{}),week:5};
            const week5=newsroomWindowWeeks();
            seasonTransactionsByWeek={
              4:[{transaction_id:'tx4',type:'waiver',status:'complete'}],
              5:[{transaction_id:'tx5',type:'trade',status:'complete'}],
              3:[{transaction_id:'tx3',type:'trade',status:'complete'}]
            };
            return {
              week1,week5,
              tx4:transactionStoryWeek({transaction_id:'tx4'}),
              tx5:transactionStoryWeek({transaction_id:'tx5'}),
              explicit:transactionStoryWeek({transaction_id:'missing',leg:4})
            };
          }finally{nflState=oldState;seasonTransactionsByWeek=oldTx;}
        }""")
        check('Newsroom Week 1 has no prior-week slot',
              newsroom_scope['week1']==[1],str(newsroom_scope))
        check('Newsroom later weeks show current plus immediately prior week',
              newsroom_scope['week5']==[4,5],str(newsroom_scope))
        check('Transaction stories resolve to concrete Sleeper week buckets',
              newsroom_scope['tx4']==4 and newsroom_scope['tx5']==5 and newsroom_scope['explicit']==4,
              str(newsroom_scope))


        dominance_threshold=await page.evaluate("""()=>{
          const oldState=nflState,oldRosters=leagueRosters,oldMatch=currentMatchups,oldSeason=seasonMatchupsByWeek,oldSource=uclHistorySource,oldApi=rivalryApiGames,oldUsers=leagueUsers;
          try{
            nflState={...(oldState||{}),week:5};
            leagueUsers=[{user_id:'u1',username:'Alpha'},{user_id:'u2',username:'Beta'}];
            leagueRosters=[{roster_id:1,owner_id:'u1',settings:{}},{roster_id:2,owner_id:'u2',settings:{}}];
            currentMatchups=[{roster_id:1,matchup_id:1,points:0},{roster_id:2,matchup_id:1,points:0}];
            seasonMatchupsByWeek={};
            rivalryApiGames=[];
            const run=(wins)=>{
              uclHistorySource={games:Array.from({length:wins},(_,i)=>({season:2020+i,week:1,teamA:'Alpha',teamB:'Beta',scoreA:110+i,scoreB:100}))};
              return newsroomRivalryStories().filter(s=>s.week===5).map(s=>s.headline);
            };
            return {one:run(1),four:run(4),five:run(5)};
          }finally{
            nflState=oldState;leagueRosters=oldRosters;currentMatchups=oldMatch;seasonMatchupsByWeek=oldSeason;uclHistorySource=oldSource;rivalryApiGames=oldApi;leagueUsers=oldUsers;
          }
        }""")
        check('1-0 one-sided series does not generate dominance News',dominance_threshold['one']==[],str(dominance_threshold))
        check('4-0 one-sided series does not generate dominance News',dominance_threshold['four']==[],str(dominance_threshold))
        check('5-0 one-sided series generates dominance News',len(dominance_threshold['five'])==1,str(dominance_threshold))

        rivalry_lead=await page.evaluate("""()=>{
          const r1=newsroomStory('r1','rivalry',72,'Short dominance','','',5,'rivalry',{seriesGames:5,hasBowl:false});
          const r2=newsroomStory('r2','rivalry',66,'Longest rivalry','','',5,'rivalry',{seriesGames:9,hasBowl:false});
          const r3=newsroomStory('r3','rivalry',66,'Bowl rivalry','','',5,'rivalry',{seriesGames:9,hasBowl:true});
          const normal=newsroomStory('n','matchup',82,'Blowout','','',4,'major');
          return {
            only:newsroomLeadStory([r1,r2,r3]).id,
            mixed:newsroomLeadStory([r1,r2,normal]).id
          };
        }""")
        check('Rivalry-only lead favors most meetings then UCL Bowl history',
              rivalry_lead['only']=='r3',str(rivalry_lead))
        check('Normal numeric priority remains authoritative when non-rivalry news exists',
              rivalry_lead['mixed']=='n',str(rivalry_lead))

        league_rivalries=await page.evaluate("""()=>{
          const oldState=nflState,oldRosters=leagueRosters,oldMatch=currentMatchups,oldSeason=seasonMatchupsByWeek,oldSource=uclHistorySource,oldApi=rivalryApiGames,oldUsers=leagueUsers;
          try{
            nflState={...(oldState||{}),week:5};
            leagueUsers=[
              {user_id:'u1',username:'Alpha'},{user_id:'u2',username:'Beta'},
              {user_id:'u3',username:'Gamma'},{user_id:'u4',username:'Delta'}
            ];
            leagueRosters=[
              {roster_id:1,owner_id:'u1',settings:{}},{roster_id:2,owner_id:'u2',settings:{}},
              {roster_id:3,owner_id:'u3',settings:{}},{roster_id:4,owner_id:'u4',settings:{}}
            ];
            currentMatchups=[
              {roster_id:1,matchup_id:1,points:0},{roster_id:2,matchup_id:1,points:0},
              {roster_id:3,matchup_id:2,points:0},{roster_id:4,matchup_id:2,points:0}
            ];
            seasonMatchupsByWeek={};
            rivalryApiGames=[];
            uclHistorySource={games:[
              {season:2021,week:1,teamA:'Alpha',teamB:'Beta',scoreA:110,scoreB:100},
              {season:2022,week:1,teamA:'Alpha',teamB:'Beta',scoreA:90,scoreB:105},
              {season:2023,week:1,teamA:'Alpha',teamB:'Beta',scoreA:120,scoreB:100},
              {season:2024,week:1,teamA:'Alpha',teamB:'Beta',scoreA:95,scoreB:110},
              {season:2025,week:1,teamA:'Alpha',teamB:'Beta',scoreA:115,scoreB:108},
              {season:2020,week:2,teamA:'Gamma',teamB:'Delta',scoreA:101,scoreB:99},
              {season:2021,week:2,teamA:'Gamma',teamB:'Delta',scoreA:98,scoreB:105},
              {season:2022,week:2,teamA:'Gamma',teamB:'Delta',scoreA:107,scoreB:100},
              {season:2023,week:2,teamA:'Gamma',teamB:'Delta',scoreA:102,scoreB:110},
              {season:2024,week:2,teamA:'Gamma',teamB:'Delta',scoreA:111,scoreB:103},
              {season:2025,week:2,teamA:'Gamma',teamB:'Delta',scoreA:99,scoreB:112}
            ]};
            const stories=newsroomRivalryStories();
            return stories.map(s=>({headline:s.headline,teamA:s.teamA,teamB:s.teamB,games:s.seriesGames}));
          }finally{
            nflState=oldState;leagueRosters=oldRosters;currentMatchups=oldMatch;seasonMatchupsByWeek=oldSeason;
            uclHistorySource=oldSource;rivalryApiGames=oldApi;leagueUsers=oldUsers;
          }
        }""")
        check('Newsroom generates rivalry stories for every qualifying league matchup',
              len(league_rivalries)==2 and
              set(tuple(sorted([x['teamA'],x['teamB']])) for x in league_rivalries)=={('Alpha','Beta'),('Delta','Gamma')},
              str(league_rivalries))

        rivalry_rules=await page.evaluate("""()=>{
          const oldChamps=rivalryChampionships;
          const mk=(aw,bw,bowlWinByWeaker=false)=>{
            const a='Alpha',b='Beta',games=[];
            for(let i=0;i<aw;i++)games.push({season:2020+(i%4),week:i+1,teamA:a,teamB:b,rosterA:'1',rosterB:'2',scoreA:120+i,scoreB:100,source:'sleeper-history'});
            for(let i=0;i<bw;i++)games.push({season:2020+(i%4),week:20+i,teamA:a,teamB:b,rosterA:'1',rosterB:'2',scoreA:100,scoreB:120+i,source:'sleeper-history'});
            if(bowlWinByWeaker&&bw>0){const g=games[aw];g.season=2025;g.week=17;g.scoreA=100;g.scoreB=140;rivalryChampionships={'2025':{season:2025,w:'2',l:'1',week:17}};}else rivalryChampionships={};
            return establishedRivalryContext(a,b,{games,aWins:aw,bWins:bw,ties:0});
          };
          try{return {twelveThree:mk(12,3),nineThree:mk(9,3),fourteenOneBowl:mk(14,1,true)};}finally{rivalryChampionships=oldChamps;}
        }""")
        check('12-3 series fails rivalry competitiveness threshold',not rivalry_rules['twelveThree']['established'] and abs(rivalry_rules['twelveThree']['weakerWinShare']-.2)<.001,str(rivalry_rules))
        check('9-3 series meets 25 percent rivalry threshold',rivalry_rules['nineThree']['established'] and abs(rivalry_rules['nineThree']['weakerWinShare']-.25)<.001,str(rivalry_rules))
        check('Weaker-team UCL Bowl win overrides rivalry competitiveness threshold',rivalry_rules['fourteenOneBowl']['established'] and rivalry_rules['fourteenOneBowl']['championshipUpsetException'],str(rivalry_rules))

        rivalry_modal=await page.evaluate("""()=>{
          const roster=leagueRosters[0],a=rosterUserName(roster);
          const mine=(currentMatchups||[]).find(x=>String(x.roster_id)===String(roster.roster_id));
          const oppMatch=(currentMatchups||[]).find(x=>String(x.matchup_id)===String(mine?.matchup_id)&&String(x.roster_id)!==String(roster.roster_id));
          const oppRoster=leagueRosters.find(r=>String(r.roster_id)===String(oppMatch?.roster_id));
          if(!mine||!oppMatch||!oppRoster)return {skipped:true};
          const b=rosterUserName(oppRoster),oldGames=rivalryApiGames,oldChamps=rivalryChampionships,oldRoster=sleeperCtx.rosterId;
          sleeperCtx.rosterId=String(roster.roster_id);rivalryChampionships={};
          rivalryApiGames=[
            {season:2025,week:8,teamA:a,teamB:b,scoreA:120,scoreB:119,source:'sleeper-history'},
            {season:2024,week:7,teamA:a,teamB:b,scoreA:110,scoreB:100,source:'sleeper-history'},
            {season:2023,week:6,teamA:a,teamB:b,scoreA:105,scoreB:115,source:'sleeper-history'},
            {season:2022,week:5,teamA:a,teamB:b,scoreA:130,scoreB:111,source:'sleeper-history'},
            {season:2021,week:4,teamA:a,teamB:b,scoreA:101,scoreB:108,source:'sleeper-history'}
          ];
          try{switchTab('news');renderNewsroom();const story=document.querySelector('#newsroomGrid [data-open-rivalry-detail]')||document.querySelector('#newsroomLead[data-open-rivalry-detail]');story?.click();const dialog=document.querySelector('#newsRivalryDialog');const labels=[...document.querySelectorAll('#newsRivalryMetrics .rivalry-metric span')].map(x=>x.textContent.trim());return {story:!!story,open:!!dialog?.open,labels,title:document.querySelector('#newsRivalryTitle')?.textContent||''};}
          finally{document.querySelector('#newsRivalryDialog')?.close();rivalryApiGames=oldGames;rivalryChampionships=oldChamps;sleeperCtx.rosterId=oldRoster;}
        }""")
        check('CTESPN rivalry story opens shared rivalry detail modal',rivalry_modal.get('skipped') or (rivalry_modal['story'] and rivalry_modal['open'] and 'Closest Matchup' in rivalry_modal['labels']),str(rivalry_modal))

        season_copy=await page.evaluate('''()=>{switchTab('season');renderSeasonCompanion();return (document.querySelector('#seasonStatus')?.textContent||'').trim();}''')
        check('Season status uses guide copy', season_copy.startswith('Your guide to NFL Week ') and season_copy.endswith('.'),season_copy)


        weekly_brief=await page.evaluate('''()=>{
          switchTab('home');renderCompanionHome();
          const card=document.querySelector('#homeRecommendations')?.closest('.home-card');
          return {
            title:(document.querySelector('#homeRecTitle')?.textContent||'').trim(),
            button:(document.querySelector('#homeRecAction')?.textContent||'').trim(),
            section:document.querySelector('#homeRecAction')?.dataset.homeSection||'',
            actions:document.querySelectorAll('#homeRecommendations .home-rec').length,
            compact:!!card?.classList.contains('home-empty-compact')
          };
        }''')
        check('Command Center uses Weekly Action Brief',weekly_brief['title']=='Weekly Action Brief' and weekly_brief['button']=='This Week' and weekly_brief['section']=='seasonThisWeek',str(weekly_brief))
        check('Weekly Action Brief is capped at five',weekly_brief['actions']<=5,str(weekly_brief))

        weekly_empty=await page.evaluate('''()=>{
          const oldBrief=homeWeeklyActionBrief;
          homeWeeklyActionBrief=()=>[];
          try{
            renderCompanionHome();
            const card=document.querySelector('#homeRecommendations')?.closest('.home-card');
            return {compact:!!card?.classList.contains('home-empty-compact'),text:(document.querySelector('#homeRecommendations')?.textContent||'').trim()};
          }finally{homeWeeklyActionBrief=oldBrief;renderCompanionHome();}
        }''')
        check('Weekly Action Brief compacts when there are no active suggestions',weekly_empty['compact'] and 'No active suggestions' in weekly_empty['text'],str(weekly_empty))

        report_lazy=await page.evaluate('''()=>{
          window.scrollTo(0,0);
          switchTab('draft');
          return {
            dirty:[...reportLazyDirty],
            leagueRows:document.querySelectorAll('#reportLeagueLeaderboard > *').length,
            awardRows:document.querySelectorAll('#reportAwards > *').length,
            evaluation:(document.querySelector('#reportEvaluation')?.textContent||'').trim(),
            nodes:document.querySelectorAll('#draftView *').length
          };
        }''')
        check('Report Card defers lower analysis on open',
              all(x in report_lazy['dirty'] for x in ['reportWeek1Section','reportLeagueSection','reportAwardsSection','reportStrategySection','reportEvaluationSection']) and report_lazy['leagueRows']==0 and report_lazy['awardRows']==0 and not report_lazy['evaluation'],
              str(report_lazy))
        report_forced=await page.evaluate('''()=>{
          renderReportLazySection('reportLeagueSection',{force:true});
          renderReportLazySection('reportAwardsSection',{force:true});
          renderReportLazySection('reportEvaluationSection',{force:true});
          return {leagueRows:document.querySelectorAll('#reportLeagueLeaderboard > *').length,awardRows:document.querySelectorAll('#reportAwards > *').length,evaluation:(document.querySelector('#reportEvaluation')?.textContent||'').trim()};
        }''')
        check('Report Card lazy sections render on demand',report_forced['leagueRows']>0 and report_forced['awardRows']>0 and len(report_forced['evaluation'])>0,str(report_forced))
        await page.evaluate("window.scrollTo(0,0);switchTab('home')")

        responsive=await page.evaluate('''()=>new Promise(resolve=>{
          const start=performance.now();
          renderRestoredRuntimeState();
          setTimeout(()=>resolve(performance.now()-start),0);
        })''')
        check('active-view restore yields quickly',responsive<250,f'{responsive:.1f} ms')


        await page.evaluate("switchTab('teams')")
        report_from_teams=await page.evaluate("""()=>{
          const b=document.querySelector('#teamsView .teams-report-card-btn');
          const exists=!!b;
          b?.click();
          return {exists,active:document.querySelector('.tab-view.active')?.id||''};
        }""")
        check('Teams Report Card action opens dedicated Report Card sub-page',
              report_from_teams['exists'] and report_from_teams['active']=='draftView',
              str(report_from_teams))
        await page.evaluate("switchTab('home')")

        for tab in ['home','draft','analysis','teams','team','season','trade','faw','log','settings']:
            await page.evaluate('(t)=>switchTab(t)',tab)
            active=await page.locator('.tab-view.active').get_attribute('id')
            check(f'tab opens: {tab}',active==tab+'View',active or '')

        nav_stress=await page.evaluate('''()=>new Promise(resolve=>{
          const tabs=['home','teams','team','season','trade','faw','draft','settings'];
          const start=performance.now();
          for(let i=0;i<120;i++)switchTab(tabs[i%tabs.length]);
          setTimeout(()=>resolve({
            ms:performance.now()-start,
            active:document.querySelector('.tab-view.active')?.id||'',
            nodes:document.querySelectorAll('*').length
          }),0);
        })''')
        check('repeated season navigation stays responsive',
              nav_stress['ms']<5000 and nav_stress['nodes']<5100,
              str(nav_stress))

        isolated=await page.evaluate('''()=>{
          const old=renderSettingsView;
          renderSettingsView=()=>{throw new Error("synthetic renderer failure")};
          const result=switchTab('settings');
          const active=document.querySelector('.tab-view.active')?.id||'';
          renderSettingsView=old;
          switchTab('home');
          return {result,active};
        }''')
        check('renderer failure cannot kill tab navigation',isolated['active']=='settingsView',str(isolated))

        await page.evaluate("switchTab('teams');renderLeagueTeams()")
        teams_text=await page.locator('#teamsView').inner_text()
        teams_html=await page.locator('#teamsView').inner_html()

        teams_stress=await page.evaluate('''()=>new Promise(resolve=>{
          const start=performance.now();
          for(let i=0;i<80;i++){
            selectedLeagueTeamRosterId=String((i%8)+1);
            renderLeagueTeams();
          }
          const renderMs=performance.now()-start;
          const nodes=document.querySelectorAll('#teamsView *').length;
          const rosterCards=document.querySelectorAll('#teamPageRoster .team-page-player').length;
          setTimeout(()=>resolve({renderMs,nodes,rosterCards}),0);
        })''')
        check('Teams repeated-render stress remains bounded',
              teams_stress['renderMs']<1500 and teams_stress['nodes']<1200 and teams_stress['rosterCards']<=30,
              str(teams_stress))

        check('Teams tab has no draft history language','Draft History' not in teams_text,teams_text[:180])
        check('Teams roster has no rank / NR badges',
              not re.search(r'(^|\\s)#\\d+|\\bNR\\b|List #',teams_text) and 'tp-rank' not in teams_html,
              teams_text[:220])
        draft_dependency=await page.evaluate('''()=>{
          const old=leagueDraftGrades;
          let calls=0;
          leagueDraftGrades=()=>{calls++;return old();};
          renderLeagueTeams();
          leagueDraftGrades=old;
          return calls;
        }''')
        check('Teams does not invoke league draft grading',draft_dependency==0,str(draft_dependency))

        teams_persistence=await page.evaluate('''()=>{
          const old=storageSetJson;
          let writes=0;
          storageSetJson=(...args)=>{writes++;return true;};
          try{
            selectedLeagueTeamRosterId='1';
            renderLeagueTeams();
            return {writes};
          }finally{storageSetJson=old;}
        }''')
        check('Teams render performs no persistence writes',teams_persistence['writes']==0,str(teams_persistence))

        live_tab_purity=await page.evaluate('''async()=>{
          const savedMaps=new Map(weekProjectionMaps),savedCurrent=currentWeekProjectionData,savedWeek=currentWeekProjectionWeek,savedWeek1=week1ProjectionData;
          weekProjectionMaps.clear();currentWeekProjectionData=null;currentWeekProjectionWeek=0;week1ProjectionData=null;
          const old={storageSet,storageSetJson,storageRemove,persistRuntimeCache,syncCurrentWeekProjections,sleeperGetSafe};
          const rows=[];
          let writes=0,network=0;
          storageSet=(...args)=>{writes++;return true};
          storageSetJson=(...args)=>{writes++;return true};
          storageRemove=(...args)=>{writes++;return true};
          persistRuntimeCache=(...args)=>{writes++;return Promise.resolve(true)};
          syncCurrentWeekProjections=(...args)=>{network++;return Promise.resolve(null)};
          sleeperGetSafe=(...args)=>{network++;return Promise.resolve({ok:false,value:null})};
          try{
            for(const tab of ['home','teams','team','season','trade','faw','draft','settings']){
              const beforeW=writes,beforeN=network,start=performance.now();
              switchTab(tab);
              await Promise.resolve();
              const activeId=document.querySelector('.tab-view.active')?.id||'';
              rows.push({tab,writes:writes-beforeW,network:network-beforeN,ms:performance.now()-start,nodes:activeId?document.querySelectorAll(`#${activeId} *`).length:0});
            }
          }finally{
            storageSet=old.storageSet;storageSetJson=old.storageSetJson;storageRemove=old.storageRemove;
            persistRuntimeCache=old.persistRuntimeCache;syncCurrentWeekProjections=old.syncCurrentWeekProjections;sleeperGetSafe=old.sleeperGetSafe;
            weekProjectionMaps.clear();for(const [k,v] of savedMaps)weekProjectionMaps.set(k,v);
            currentWeekProjectionData=savedCurrent;currentWeekProjectionWeek=savedWeek;week1ProjectionData=savedWeek1;
          }
          return rows;
        }''')
        check('all visible Live Season tabs are render-only',
              all(x['writes']==0 and x['network']==0 for x in live_tab_purity),str(live_tab_purity))
        check('all visible Live Season tab renders stay bounded',
              all(x['ms']<1000 and x['nodes']<2500 for x in live_tab_purity),str(live_tab_purity))


        await page.evaluate("switchTab('home');configureHomeForPhase(true,true,true)")
        expected=['seasonView','tradeView','teamView','teamsView','newsView','draftView']
        for i,target in enumerate(expected,1):
            await page.locator(f'#homeShortcut{i}').click()
            active=await page.locator('.tab-view.active').get_attribute('id')
            check(f'Command Shortcut {i}',active==target,active or '')
            await page.evaluate("switchTab('home');configureHomeForPhase(true,true,true)")

        # Pregame projection display must not collapse to 0.00 vs 0.00.
        await page.evaluate("()=>{currentMatchups.forEach(m=>{m.points=0;m.players_points={}});selectedSeasonWeek=1;renderCompanionHome();renderSeasonCompanion();}")
        home=await page.locator('#homeFocusValue').inner_text(); state=await page.locator('#matchupState').inner_text()
        check('pregame Command Center uses projections',home!='0.00 – 0.00' and '108.00' in home,home)
        check('pregame Season labels projections','projections' in state.lower(),state)
        bench_analysis=await page.locator('#matchupBenchList').inner_text()
        check('Season uses Bench Analysis','Bench Decision Context' not in bench_analysis and await page.locator('section.bench-analysis').count()==1,bench_analysis)
        check('Matchup Intelligence II removed',await page.get_by_text('Matchup Intelligence II',exact=True).count()==0,'removed')
        check('Analytics preserves Season Positional Context',await page.locator('section.season-analytics').count()==1 and await page.get_by_text('Season Positional Context',exact=True).count()==1,'analytics')
        analytics_empty=await page.evaluate("""() => {
          const card=document.querySelector('section.season-analytics');
          const empty=card?.querySelector('.empty');
          if(!card||!empty)return null;
          const cs=getComputedStyle(card),es=getComputedStyle(empty);
          return {cls:card.className,h:card.getBoundingClientRect().height,minH:cs.minHeight,font:es.fontSize,text:empty.textContent.trim()};
        }""")
        check('Analytics placeholder collapses to compact card',bool(analytics_empty) and 'compact-empty' in analytics_empty['cls'] and analytics_empty['h']<90 and analytics_empty['font']=='12px',str(analytics_empty))

        await page.evaluate("switchTab('season');prepareSeasonSection('seasonPostseason')")
        playoff_dims=await page.evaluate("""() => {
          const card=document.querySelector('#playoffScheduleList .playoff-game');
          const btn=card?.querySelector('.playoff-outcome button');
          if(!card||!btn)return null;
          const c=getComputedStyle(card);
          return {cardH:card.getBoundingClientRect().height,padTop:c.paddingTop,padBottom:c.paddingBottom,btnW:btn.getBoundingClientRect().width,btnH:btn.getBoundingClientRect().height,grid:c.gridTemplateColumns};
        }""")
        check('Playoff Machine week cards hug larger tap targets',bool(playoff_dims) and playoff_dims['btnW']>=39 and playoff_dims['btnH']>=29 and float(playoff_dims['padTop'].replace('px',''))<=2 and float(playoff_dims['padBottom'].replace('px',''))<=2 and playoff_dims['cardH']<=34,str(playoff_dims))

        await page.evaluate("switchTab('teams');selectedLeagueTeamRosterId='1';renderLeagueTeams()")
        snapshot_text=await page.locator('#teamPageSeasonSnapshot').inner_text()
        check('pregame Teams Season Snapshot uses projections',
              '108.00 - 108.00 projected' in snapshot_text and '0.00 - 0.00' not in snapshot_text,
              snapshot_text)

        # If projection data is temporarily unavailable before kickoff, no surface may pretend 0-0 is actual scoring.
        pending=await page.evaluate("""() => {
          const saved=new Map(weekProjectionMaps);
          weekProjectionMaps.clear();currentWeekProjectionData=null;currentWeekProjectionWeek=0;week1ProjectionData=null;
          currentMatchups.forEach(m=>{m.points=0;m.players_points={}});
          renderCompanionHome();renderSeasonCompanion();selectedLeagueTeamRosterId='1';renderLeagueTeams();
          const out={
            home:document.querySelector('#homeFocusValue')?.textContent||'',
            snap:document.querySelector('#teamPageSeasonSnapshot')?.textContent||'',
            watch:document.querySelector('#seasonWatchList')?.textContent||'',
            intel:document.querySelector('#matchupBenchList')?.textContent||''
          };
          weekProjectionMaps.clear();for(const [k,v] of saved)weekProjectionMaps.set(k,v);rememberProjectionMap(1,saved.get(1));
          return out;
        }""")
        check('pregame pending state never masquerades as 0-0',
              '0.00 – 0.00' not in pending['home'] and '0.00 - 0.00' not in pending['snap'] and
              'projections loading' in (pending['snap']+pending['watch']).lower(),
              str(pending))

        await page.evaluate("switchTab('faw');fawSelectedPosition='RB';renderFaw()")
        faw_text=await page.locator('#fawGroups').inner_text()
        faw_rows=await page.locator('#fawGroups .faw-player-row').count()
        first_faw=await page.locator('#fawGroups .faw-player-row').first.inner_text() if faw_rows else ''
        check('FA/W tab ranks available RBs by projection',faw_rows>=2 and 'Available Runner A' in first_faw and '16.50' in first_faw,first_faw)
        faw_candidate_names=await page.locator('#fawGroups .faw-player-main b').all_inner_texts()
        check('FA/W excludes rostered players',all(not name.startswith('Player 1-') for name in faw_candidate_names),str(faw_candidate_names))
        check('FA/W shows weakest-position comparison','Your low:' in first_faw and 'vs Player 1-' in first_faw,first_faw)

        await page.evaluate("fawSelectedPosition='QB';renderFaw()")
        qb_names=await page.locator('#fawGroups .faw-player-main b').all_inner_texts()
        check('FA/W caps a selected position at top 3',
              len(qb_names)==3 and qb_names==['Available Quarterback A','Available Quarterback B','Available Quarterback C'],
              str(qb_names))
        await page.evaluate("fawSelectedPosition='ALL';renderFaw()")
        per_position=await page.locator('#fawGroups .faw-position-card').evaluate_all(
            "els=>Object.fromEntries(els.map(e=>[e.dataset.fawGroup,e.querySelectorAll('.faw-player-row').length]))")
        faw_styles=await page.locator('#fawGroups .faw-position-card').evaluate_all("els=>Object.fromEntries(els.map(e=>{const h=e.querySelector('.season-card-head');const r=e.querySelector('.faw-player-row');return [e.dataset.fawGroup,{border:getComputedStyle(e).borderTopColor,head:getComputedStyle(h).backgroundColor,row:r?getComputedStyle(r).backgroundColor:null}]}))")
        expected_faw_borders={'QB':'rgb(233, 134, 120)','WR':'rgb(114, 184, 223)','RB':'rgb(127, 190, 120)','TE':'rgb(229, 141, 53)','K':'rgb(173, 139, 200)','DEF':'rgb(180, 139, 98)'}
        check('Player Acquisition cards use position color framing',all(faw_styles.get(pos,{}).get('border')==color for pos,color in expected_faw_borders.items()),str(faw_styles))
        
        # Semantic comparison colors must not be theme-colored, even for tiny deltas.
        semantic_delta=await page.evaluate("""() => {
        const oldTheme=document.documentElement.dataset.theme||'blue';
        if(typeof applyColorTheme==='function')applyColorTheme('forest',false);
        const mk=(delta)=>{
        const weak={pts:10,player:{name:'Roster Player'}};
        const row={pts:10+delta,player:{id:'x',name:'Available Player',pos:'QB',team:'FA',bye:0}};
        const host=document.createElement('div');
        host.innerHTML=fawPlayerRow(row,weak);
        document.body.appendChild(host);
        const el=host.querySelector('.faw-comp b');
        const color=getComputedStyle(el).color;
        const cls=host.querySelector('.faw-player-row').className;
        host.remove();
        return {color,cls};
        };
        const out={positive:mk(.03),negative:mk(-.03),zero:mk(0)};
        if(typeof applyColorTheme==='function')applyColorTheme(oldTheme,false);
        return out;
        }""")
        check('Player Acquisition tiny positive delta stays green under theme',
        semantic_delta['positive']['color']=='rgb(23, 114, 69)' and 'good' in semantic_delta['positive']['cls'],str(semantic_delta))
        check('Player Acquisition tiny negative delta stays red under theme',
        semantic_delta['negative']['color']=='rgb(157, 59, 59)' and 'bad' in semantic_delta['negative']['cls'],str(semantic_delta))
        check('Player Acquisition exact tie stays neutral under theme',
        semantic_delta['zero']['color']=='rgb(102, 112, 133)' and 'neutral' in semantic_delta['zero']['cls'],str(semantic_delta))

        check('Player Acquisition player rows remain white',all(v.get('row') in (None,'rgb(255, 255, 255)') for v in faw_styles.values()),str(faw_styles))
        check('FA/W caps every ALL-view position at 3',
              all(v<=3 for v in per_position.values()),str(per_position))

        await page.evaluate("switchTab('season');renderWaiverCenter(leagueRosters.find(r=>r.roster_id===1))")
        waiver_order=await page.locator('#waiverOrderList').inner_text()
        check('Season shows current waiver order','#1' in waiver_order and 'YOU' in waiver_order,waiver_order)
        major_text=await page.locator('#waiverMajorGrid').inner_text()
        check('Roster Needs & Moves shows actionable WR replacement','WR • ROSTER MOVE RECOMMENDED' in major_text and 'Available Receiver' in major_text,major_text)
        swap_text=await page.locator('#waiverMajorGrid').inner_text()
        check('Roster Needs & Moves uses percentage projection comparisons',
              'Available Runner A' in swap_text and 'Available Receiver' in swap_text and '20%+ THRESHOLD' in swap_text and 'within ±2.00 threshold' not in swap_text,
              swap_text)
        waiver_thresholds=await page.evaluate('''()=>{
          const roster=leagueRosters.find(r=>r.roster_id===1),map=weekProjectionMaps.get(1);
          const original=new Map(map);
          // QB: 10% threshold. Starter is 8.00; 8.79 fails, 8.80 qualifies.
          for(const id of ['fa_qb1','fa_qb2','fa_qb3','fa_qb4','fa_qb5'])map.set(id,{pts:8.79});let qbFail=waiverPercentageSuggestions(roster,1).some(x=>x.pos==='QB');
          map.set('fa_qb1',{pts:8.80});let qbPass=waiverPercentageSuggestions(roster,1).some(x=>x.pos==='QB');
          // TE over WR in FLEX: force a WR into FLEX at 10.00 and no TE incumbent advantage.
          const flexId=roster.starters[6],oldFlex=discoveredSleeperPlayers[flexId];
          discoveredSleeperPlayers[flexId]={...oldFlex,position:'WR'};map.set(flexId,{pts:10});
          map.set('fa_te1',{pts:13.99});let teFail=waiverPercentageSuggestions(roster,1).some(x=>x.pos==='TE');
          map.set('fa_te1',{pts:14.00});let tePass=waiverPercentageSuggestions(roster,1).some(x=>x.pos==='TE');
          discoveredSleeperPlayers[flexId]=oldFlex;weekProjectionMaps.set(1,original);
          return {qbFail,qbPass,teFail,tePass};
        }''')
        check('Waiver thresholds enforce QB +10% and TE-over-WR FLEX +40%',
              not waiver_thresholds['qbFail'] and waiver_thresholds['qbPass'] and not waiver_thresholds['teFail'] and waiver_thresholds['tePass'],
              str(waiver_thresholds))

        waiver_health_exemption=await page.evaluate('''()=>{
          const roster=leagueRosters.find(r=>r.roster_id===1),map=weekProjectionMaps.get(1);
          const original=new Map(map);
          // WR usable depth is already below the health threshold in this fixture.
          // Force the best available WR far below the ordinary +20% gate.
          map.set('fa_wr1',{pts:5.00});
          const positions=[...waiverHealthEmergencyPositions(roster)];
          const suggestion=waiverPercentageSuggestions(roster,1).find(x=>x.pos==='WR')||null;
          const brief=homeWeeklyActionBrief(roster,currentMatchups.find(m=>m.roster_id===1),1).filter(x=>x.tag==='WAIVER');
          weekProjectionMaps.set(1,original);
          return {positions,suggestion,brief};
        }''')
        check('Injury-driven major need bypasses ordinary waiver percentage gate',
              'WR' in waiver_health_exemption['positions'] and bool(waiver_health_exemption['suggestion']) and waiver_health_exemption['suggestion']['healthEmergency'],
              str(waiver_health_exemption))
        check('Weekly Action Brief still surfaces waiver help during injury emergency',
              any('WR' in (x.get('title','')+x.get('detail','')) for x in waiver_health_exemption['brief']),
              str(waiver_health_exemption['brief']))

        # Live points replace projections once scoring starts.
        await page.evaluate("()=>{const a=currentMatchups.find(m=>m.roster_id===1),b=currentMatchups.find(m=>m.roster_id===2);a.points=23.45;b.points=17.25;a.players_points={[a.starters[0]]:10};b.players_points={[b.starters[0]]:8};renderCompanionHome();renderSeasonCompanion();}")
        home=await page.locator('#homeFocusValue').inner_text()
        check('live scoring replaces projections','23.45' in home and '17.25' in home,home)

        pdata=await page.evaluate("()=>({k:sleeperRosterPlayer('p1_7'),d:sleeperRosterPlayer('p1_8')})")
        check('K bye derived from NFL team',pdata['k']['pos']=='K' and pdata['k']['bye']==8,str(pdata['k']))
        check('DEF bye derived from NFL team',pdata['d']['pos']=='DEF' and pdata['d']['bye']==8,str(pdata['d']))

        await page.evaluate("selectedSeasonWeek=2;selectedTeamWeek=2;renderSeasonCompanion();renderTeam()")
        check('Season week selector supports Week 2',(await page.locator('#seasonWeekSelect').input_value())=='2')
        check('My Team week selector supports Week 2',(await page.locator('#teamWeekSelect').input_value())=='2')
        await page.evaluate("selectedSeasonWeek=1;renderSeasonCompanion()")
        check('IR/reserve status renders on My Team',await page.locator('#teamView .my-team-injury.bad').filter(has_text='IR / Reserve').count()>=1)

        sync_path=await page.evaluate('''async()=>{
          const oldDraft=syncSleeper,oldSeason=syncSeasonData,oldRender=renderRestoredRuntimeState;
          let draft=0,season=0,renders=0;
          syncSleeper=async()=>{draft++;};syncSeasonData=async()=>{season++;};renderRestoredRuntimeState=()=>{renders++;};
          try{
            document.querySelector('#sleeperUser').value='dmercado';
            document.querySelector('#syncNowBtn').click();
            await new Promise(r=>setTimeout(r,20));
            return {draft,season,renders};
          }finally{syncSleeper=oldDraft;syncSeasonData=oldSeason;renderRestoredRuntimeState=oldRender;}
        }''')
        check('Live Season Sync uses season path only',sync_path['draft']==0 and sync_path['season']==1,str(sync_path))

        projection_bounds=await page.evaluate('''()=>{
          const savedPlayers=discoveredSleeperPlayers,savedLeague=verifiedLeague,savedRosters=leagueRosters;
          const oldSet=storageSetJson;let writes=0;
          storageSetJson=(...args)=>{writes++;return true;};
          try{
            discoveredSleeperPlayers={};leagueRosters=[];
            verifiedLeague={...(verifiedLeague||{}),scoring_settings:{pts:1}};
            const pos=['QB','RB','WR','TE','K','DEF'];
            const rows=Array.from({length:600},(_,i)=>({player_id:`bulk${i}`,stats:{pts:600-i},player:{player_id:`bulk${i}`,full_name:`Bulk ${i}`,position:pos[i%pos.length],team:'SF'}}));
            const map=normalizeWeek1Projections(rows),compact=compactProjectionPayload(rows);
            return {map:map.size,discovered:Object.keys(discoveredSleeperPlayers).length,compact:compact.length,writes};
          }finally{storageSetJson=oldSet;discoveredSleeperPlayers=savedPlayers;verifiedLeague=savedLeague;leagueRosters=savedRosters;}
        }''')
        check('projection normalization keeps metadata bounded',
              projection_bounds['map']==600 and projection_bounds['discovered']<=72 and projection_bounds['compact']<=72 and projection_bounds['writes']==1,
              str(projection_bounds))

        roundtrip=await page.evaluate('''async()=>{
          const mem=new Map(),oldPut=apiCachePut,oldGet=apiCacheGet;
          apiCachePut=async(scope,key,value,meta={})=>{mem.set(scope+':'+key,{scope,requestKey:key,value,time:Date.now(),meta});return true};
          apiCacheGet=async(scope,key)=>mem.get(scope+':'+key)||null;
          const saved=await persistRuntimeCacheNow();
          leagueRosters=[];sleeperCtx.teamName='BROKEN';verifiedLeague=null;
          const c=await readRuntimeCacheAsync('dmercado');
          const applied=applyRuntimeCache(c,'dmercado');
          const result={saved,applied,team:sleeperCtx.teamName,rosters:leagueRosters.length,schema:c?.version};
          apiCachePut=oldPut;apiCacheGet=oldGet;return result;
        }''')
        check('runtime snapshot round-trip',roundtrip['saved'] and roundtrip['applied'] and roundtrip['rosters']==8 and roundtrip['schema']==4,str(roundtrip))
        local_fallback=await page.evaluate('''async()=>{
          const oldPut=apiCachePut,oldGet=apiCacheGet,oldS=storageSet,oldG=storageGet,oldSJ=storageSetJson,oldGJ=storageGetJson,oldRM=storageRemove;
          const mem={};
          storageSet=(k,v)=>{mem[k]=String(v);return true};
          storageGet=(k,f)=>k in mem?mem[k]:f;
          storageSetJson=(k,v)=>{mem[k]=JSON.stringify(v);return true};
          storageGetJson=(k,f)=>k in mem?JSON.parse(mem[k]):f;
          storageRemove=(k)=>{delete mem[k];return true};
          apiCachePut=async()=>false; apiCacheGet=async()=>null;
          await persistRuntimeCacheNow();
          const mirror=readRuntimeLocalMirror('dmercado');
          leagueRosters=[];verifiedLeague=null;sleeperCtx={...sleeperCtx,username:'',rosterId:null,teamName:''};
          const restored=await readRuntimeCacheAsync('dmercado');
          const applied=restored?applyRuntimeCache(restored,'dmercado'):false;
          apiCachePut=oldPut;apiCacheGet=oldGet;storageSet=oldS;storageGet=oldG;storageSetJson=oldSJ;storageGetJson=oldGJ;storageRemove=oldRM;
          return {mirror:!!mirror,applied,rosters:leagueRosters.length,team:sleeperCtx.teamName};
        }''')
        check('local mirror restores when IndexedDB is unavailable',
              local_fallback['mirror'] and local_fallback['applied'] and local_fallback['rosters']==8 and local_fallback['team']=='dmercado',
              str(local_fallback))

        bootstrap_user=await page.evaluate('''()=>{
          const oldG=storageGet,oldGJ=storageGetJson;
          storageGet=(k,f)=>k===KEY+'-sleeper-user'?f:oldG(k,f);
          storageGetJson=(k,f)=>k===RUNTIME_BOOTSTRAP_KEY?{username:'dmercado',savedAt:Date.now()}:oldGJ(k,f);
          document.querySelector('#sleeperUser').value='';
          const candidate=selectedSleeperUserCandidate();
          storageGet=oldG;storageGetJson=oldGJ;
          return candidate;
        }''')
        check('startup team recovers from runtime bootstrap',bootstrap_user=='dmercado',bootstrap_user)

        await page.evaluate("switchTab('home');renderCompanionHome()")
        roster_watch_action=await page.locator('#homeThreatAction').evaluate("e=>({label:e.textContent.trim(),nav:e.dataset.homeNav})")
        check('Live Season Roster Watch action opens My Team',roster_watch_action['label']=='My Team' and roster_watch_action['nav']=='team',str(roster_watch_action))
        await page.evaluate("switchTab('team');renderTeam()")
        pressure_text=await page.locator('#teamRosterPressureGrid').inner_text()
        check('Roster Pressure renders at bottom of My Team',bool(pressure_text.strip()) and await page.locator('#teamView #teamRosterPressureGrid').count()==1,pressure_text)
        check('Season no longer contains Roster Pressure or Roster Health',await page.locator('#seasonView #seasonPressureGrid').count()==0 and await page.locator('#seasonView #seasonRosterWarnings').count()==0)
        check('Season no longer contains Current Sleeper Lineup card',await page.locator('#seasonView #seasonStarters').count()==0 and await page.locator('#seasonView #seasonBench').count()==0 and await page.get_by_text('Current Sleeper Lineup', exact=True).count()==0)
        await page.evaluate("switchTab('settings');renderSettingsView()")
        theme_copy=await page.locator('#settingsView').inner_text()
        check('Color Theme subtitle matches requested copy',"No, we are NOT adding mental health green. Don't ask." in theme_copy,theme_copy[:500])

        # Mobile horizontal containment at representative narrow width.
        await page.set_viewport_size({'width':320,'height':700})
        for tab in ['home','draft','team','season','trade','faw']:
            await page.evaluate('(t)=>{document.querySelectorAll(\'.tab-view\').forEach(v=>v.classList.toggle(\'active\',v.id===t+\'View\'));}',tab)
            dims=await page.evaluate('()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})')
            check(f'320px page containment: {tab}',dims['sw']<=dims['cw']+3,str(dims))

        check('no uncaught runtime errors',not page_errors,'; '.join(page_errors[:4]))
        await browser.close()
    if failures:
        print(f'\n{len(failures)} browser smoke failure(s).')
        return 1
    print('\nBrowser smoke suite passed.')
    return 0

raise SystemExit(asyncio.run(main()))
