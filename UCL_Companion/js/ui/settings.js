const THEME_KEY=KEY+'-color-theme';
const THEME_NAMES={blue:'UCL Blue',forest:'Forest',purple:'Purple',crimson:'Crimson',orange:'Orange',slate:'Slate',gold:'Gold',iceblue:'Ice Blue'};
function normalizeTheme(value){
  const clean=String(value||'blue').toLowerCase();
  return Object.prototype.hasOwnProperty.call(THEME_NAMES,clean)?clean:'blue';
}
function currentTheme(){return normalizeTheme(storageGet(THEME_KEY,'blue'));}
function applyColorTheme(theme,{persist=false}={}){
  const clean=normalizeTheme(theme);
  document.documentElement.dataset.theme=clean;
  if(document.body)document.body.dataset.theme=clean;
  if(persist)storageSet(THEME_KEY,clean);
  document.querySelectorAll('[data-theme-choice]').forEach(btn=>{
    const selected=btn.dataset.themeChoice===clean;
    btn.classList.toggle('active',selected);
    btn.setAttribute('aria-checked',String(selected));
  });
  return clean;
}
// Apply the stored theme as soon as this module loads, before normal UI rendering.
applyColorTheme(currentTheme());


function renderSettingsView(){
  const condensed=$('#settingsCondensedToggle');
  if(condensed)condensed.checked=document.body.classList.contains('condensed-mode');
  const rec=$('#settingsRecDetail');if(rec)rec.value=recommendationDetailMode();
  const density=$('#settingsBoardDensity');if(density)density.value=boardDensityMode();
  const intelDefault=$('#settingsIntelDefaultToggle');if(intelDefault)intelDefault.checked=storageGet(INTEL_DEFAULT_KEY,'1')!=='0';
  const searchDefault=$('#settingsSearchDefaultToggle');if(searchDefault)searchDefault.checked=storageGet(SEARCH_DEFAULT_KEY,'1')!=='0';
  const team=sleeperCtx.teamName||sleeperCtx.username||'';
  const league=sleeperCtx.leagueName||verifiedLeague?.name||'Unmanaged Chaos League';
  const teamName=$('#settingsTeamName');if(teamName)teamName.textContent=team||'No team selected';
  const conn=$('#settingsConnectionDetail');if(conn)conn.textContent=sleeperCtx.username
    ?`${league} • ${lastDraftPicks.length} draft picks loaded`
    :'Select a Sleeper team above to connect.';
  const dataMode=$('#settingsDataMode');if(dataMode)dataMode.textContent=runtimeDataModeLabel();
  const leagueName=$('#settingsLeagueName');if(leagueName)leagueName.textContent=league;
  const version=`v${APP_VERSION} ${RELEASE_CHANNEL}`;
  const versionHead=$('#settingsVersion');if(versionHead)versionHead.textContent=version;
  const versionInline=$('#settingsVersionInline');if(versionInline)versionInline.textContent=version;
  applyColorTheme(currentTheme());
}

document.addEventListener('click',e=>{
  const choice=e.target.closest('[data-theme-choice]');
  if(!choice)return;
  applyColorTheme(choice.dataset.themeChoice,{persist:true});
});
