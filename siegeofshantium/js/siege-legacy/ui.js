'use strict';
function renderLegacySiege(){
 checkLevel();checkAchievements();const g=state.guardian,t=state.town;
 document.getElementById('app').innerHTML=SOSText("ui_game_town_navigation.renderGame.001",esc(state.name),state.level,fmt(state.gold),state.round,state.maxRounds,guardianPanel(),state.roundActions,mapHTML(),townPanel(),esc(townAtmosphere()),state.log.slice(-50).map(x=>`<div class="log-line ${x.type}">${esc(x.msg)}</div>`).join(''));
 document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openLocation(b.dataset.open));document.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>showGroup(b.dataset.group));document.querySelectorAll('[data-field]').forEach(b=>b.onclick=()=>showFieldEncounter(b.dataset.field));
 $('#endRoundBtn').onclick=showEndRoundForecast;$('#menuBtn').onclick=gameMenu;setTimeout(()=>{const l=$('.log');if(l)l.scrollTop=l.scrollHeight},0)
}
