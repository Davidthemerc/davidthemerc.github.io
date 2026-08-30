function politicalSuspicionLabel(v){return v>=12?'Openly suspected':v>=8?'High suspicion':v>=4?'Persistent rumors':v>=1?'Some whispers':SOSText("politics_protection_outcomes.politicalSuspicionLabel.001")}
function politicalEvidenceLabel(v){return v>=10?'Strong evidence':v>=6?'Credible evidence':v>=3?'Fragments of evidence':v>=1?'Thin evidence':SOSText("politics_protection_outcomes.politicalEvidenceLabel.001")}
function politicalProtectionState(locId){
 const ps=politicalSettlement(locId);if(!ps.protection||typeof ps.protection!=='object')ps.protection={capital:{},debt:{},cases:[],history:[],lastControl:settlementControl(locId),lastCapitalDay:-99,lastDebtDay:-99};
 const p=ps.protection;if(!p.capital||typeof p.capital!=='object')p.capital={};if(!p.debt||typeof p.debt!=='object')p.debt={};if(!Array.isArray(p.cases))p.cases=[];if(!Array.isArray(p.history))p.history=[];if(!p.lastControl)p.lastControl=settlementControl(locId);if(!Number.isFinite(p.lastCapitalDay))p.lastCapitalDay=-99;if(!Number.isFinite(p.lastDebtDay))p.lastDebtDay=-99;return p
}
function politicalCapital(locId,faction){return politicalProtectionState(locId).capital[faction]||0}
function politicalDebt(locId,faction){return politicalProtectionState(locId).debt[faction]||0}
function adjustPoliticalCapital(locId,faction,delta,reason=''){
 if(!OPEN_WORLD_FACTIONS[faction]||!delta)return 0;const p=politicalProtectionState(locId),before=p.capital[faction]||0;p.capital[faction]=clamp(before+delta,0,100);const actual=p.capital[faction]-before;
 if(actual>0)p.lastCapitalDay=state.world.day;if(reason&&actual)p.history.push({day:state.world.day,type:'capital',faction,delta:actual,text:reason});p.history=p.history.slice(-50);return actual
}
function adjustPoliticalDebt(locId,faction,delta,reason=''){
 if(!OPEN_WORLD_FACTIONS[faction]||!delta)return 0;const p=politicalProtectionState(locId),before=p.debt[faction]||0;p.debt[faction]=clamp(before+delta,0,100);const actual=p.debt[faction]-before;
 if(actual>0)p.lastDebtDay=state.world.day;if(reason&&actual)p.history.push({day:state.world.day,type:'debt',faction,delta:actual,text:reason});p.history=p.history.slice(-50);return actual
}
function politicalProtectionScore(locId,faction){if(settlementControl(locId)!==faction)return 0;const standing=state.world.factionStanding[faction]||0,cap=politicalCapital(locId,faction),p=localPoliticalProfile(locId,faction),debt=politicalDebt(locId,faction);return clamp(Math.round(standing*4+cap*.65+p.organization*.16+p.legitimacy*.12-debt*.10),0,100)}
function politicalProtectionLabel(score){return score>=85?'Exceptional':score>=68?'Strong':score>=48?'Meaningful':score>=28?'Limited':SOSText("politics_protection_outcomes.politicalProtectionLabel.001")}
function politicalProtectionSeverityCost(severity){return severity>=7?24:severity>=5?17:severity>=4?13:severity>=3?9:severity>=2?6:3}
function politicalProtectionCases(locId,status=null){const rows=politicalProtectionState(locId).cases||[];return status?rows.filter(x=>x.status===status):rows}
function recordPoliticalCaseFile(locId,opts={}){
 const P=politicalProtectionState(locId),crimeRow=opts.crimeRow||null,crimeId=crimeRow?.id||opts.crimeId||null;
 if(crimeId){const existing=P.cases.find(c=>c.crimeId===crimeId);if(existing)return existing}
 const c={id:uid(),crimeId,day:state.world.day,locId,kind:opts.kind||crimeRow?.kind||'political_incident',victimFaction:opts.victimFaction||crimeRow?.victimFaction||'Independent',sponsor:opts.sponsor||null,severity:opts.severity||crimeRow?.severity||2,desc:opts.desc||crimeRow?.desc||SOSText("politics_protection_outcomes.recordPoliticalCaseFile.001"),originalFine:crimeRow?.fine||0,status:opts.status||'open',identified:opts.identified!==false,evidence:opts.evidence!==false,evidenceAtCreation:politicalCovertState(locId).evidence||0};
 P.cases.push(c);P.cases=P.cases.slice(-80);P.history.push({day:state.world.day,type:'case_file',caseId:c.id,text:SOSText("politics_protection_outcomes.recordPoliticalCaseFile.002",c.desc)});P.history=P.history.slice(-60);if(crimeRow)crimeRow.politicalCaseId=c.id;return c
}
function politicallyProtectedCrime(kind,locId,victimFaction,sponsor,opts={}){
 const L=lawState(),before={heat:lawHeat(locId),bounty:localBounty(locId),rest:restitutionDue(locId),warrant:hasWarrant(locId)?{...L.warrants[locId]}:null,rep:jurisdictionRep(locId)},row=recordCrimeDetailed(kind,locId,victimFaction,opts);row.politicalSponsor=sponsor||null;
 const severity=row.severity||opts.severity||2,caseFile=row.witnessed&&severity>=2?recordPoliticalCaseFile(locId,{kind,victimFaction,sponsor,severity,desc:row.desc,crimeRow:row,status:'open',identified:true,evidence:true}):null;
 if(!row.witnessed||!sponsor||!OPEN_WORLD_FACTIONS[sponsor]||sponsor===victimFaction)return {row,protected:false,case:caseFile,note:''};
 const control=settlementControl(locId),score=politicalProtectionScore(locId,sponsor),cost=politicalProtectionSeverityCost(severity),eligible=control===sponsor&&(state.world.factionStanding[sponsor]||0)>=3;
 if(!eligible||score<22)return {row,protected:false,case:caseFile,note:control===sponsor?SOSText("politics_protection_outcomes.politicallyProtectedCrime.001",majorFaction(sponsor).short):SOSText("politics_protection_outcomes.politicallyProtectedCrime.002",majorFaction(sponsor).short)};
 const threshold=26+severity*8+(kind==='murder'?10:0),effective=score+rnd(1,100)*.32,level=effective>=threshold+24?'full':effective>=threshold?'partial':'none';
 if(level==='none')return {row,protected:false,case:caseFile,note:SOSText("politics_protection_outcomes.politicallyProtectedCrime.003",majorFaction(sponsor).short)};
 const newHeat=lawHeat(locId),newBounty=localBounty(locId),newRest=restitutionDue(locId),newRep=jurisdictionRep(locId);
 if(level==='full'){L.heat[locId]=before.heat;L.bounties[locId]=before.bounty;L.restitution[locId]=before.rest;if(before.warrant)L.warrants[locId]=before.warrant;else delete L.warrants[locId];L.jurisdictionRep[locId]=before.rep}
 else{L.heat[locId]=Math.round(before.heat+(newHeat-before.heat)*.45);L.bounties[locId]=Math.round(before.bounty+(newBounty-before.bounty)*.45);L.restitution[locId]=Math.round(before.rest+(newRest-before.rest)*.5);L.jurisdictionRep[locId]=Math.round(before.rep+(newRep-before.rep)*.5);if(L.heat[locId]<5&&L.bounties[locId]<70){if(before.warrant)L.warrants[locId]=before.warrant;else delete L.warrants[locId]}}
 const spent=Math.min(politicalCapital(locId,sponsor),cost);adjustPoliticalCapital(locId,sponsor,-spent,SOSText("politics_protection_outcomes.politicallyProtectedCrime.004",row.desc));adjustPoliticalDebt(locId,sponsor,Math.max(1,Math.ceil(cost/3)),SOSText("politics_protection_outcomes.politicallyProtectedCrime.005",row.desc));const fc=localPoliticalFactionState(locId,sponsor);fc.legitimacy=clamp((fc.legitimacy||0)-severity*(level==='full'?.18:.10),-6,12);
 const c=caseFile||recordPoliticalCaseFile(locId,{kind,victimFaction,sponsor,severity,desc:row.desc,crimeRow:row,status:'open',identified:true,evidence:true});c.status='protected';c.protectionLevel=level;c.protectedDay=state.world.day;c.controlAtProtection=control;c.evidenceAtProtection=politicalCovertState(locId).evidence||0;const P=politicalProtectionState(locId);P.history.push({day:state.world.day,type:'cover',faction:sponsor,caseId:c.id,text:SOSText("politics_protection_outcomes.politicallyProtectedCrime.006",majorFaction(sponsor).short,level==='full'?'suppressed':'reduced',row.desc)});P.history=P.history.slice(-60);row.politicalCaseId=c.id;row.protected=true;row.protectionLevel=level;
 return {row,protected:true,level,case:c,note:level==='full'?SOSText("politics_protection_outcomes.politicallyProtectedCrime.007",majorFaction(sponsor).short):SOSText("politics_protection_outcomes.politicallyProtectedCrime.008",majorFaction(sponsor).short)}
}
function reopenProtectedPoliticalCases(locId,oldControl,newControl){const P=politicalProtectionState(locId),rows=P.cases.filter(c=>c.status==='protected'&&c.sponsor===oldControl),notes=[];if(!rows.length){P.lastControl=newControl;return notes}for(const c of rows){const age=state.world.day-c.day,victimBoost=c.victimFaction===newControl?18:0,hostility=Math.max(0,-factionRelation(newControl,c.sponsor)),chanceReopen=clamp(35+c.severity*8+victimBoost+hostility*3-age*.35,15,96);if(rnd(1,100)>chanceReopen)continue;c.status='reopened';c.reopenedDay=state.world.day;c.reopenedBy=newControl;const L=lawState(),rule=jurisdictionRule(locId),fine=Math.round(c.originalFine*(c.protectionLevel==='full'?1:.65));L.heat[locId]=clamp((L.heat[locId]||0)+Math.max(1,Math.ceil(c.severity*.7)),0,25);L.bounties[locId]=(L.bounties[locId]||0)+fine;L.restitution[locId]=(L.restitution[locId]||0)+Math.round(fine*.25);if(L.heat[locId]>=5||L.bounties[locId]>=70)L.warrants[locId]={issuedDay:state.world.day,authority:rule.authority,kind:c.kind,reopenedPoliticalCase:true};adjustJurisdictionRep(locId,-Math.max(1,Math.ceil(c.severity/3)),SOSText("politics_protection_outcomes.reopenProtectedPoliticalCases.001",c.desc));notes.push(SOSText("politics_protection_outcomes.reopenProtectedPoliticalCases.002",c.desc,majorFaction(newControl).short,fine))}if(notes.length){P.history.push({day:state.world.day,type:'regime_review',from:oldControl,to:newControl,text:SOSText("politics_protection_outcomes.reopenProtectedPoliticalCases.003",notes.length,notes.length===1?'':'s')});P.history=P.history.slice(-50);recordWorldNews(SOSText("politics_protection_outcomes.reopenProtectedPoliticalCases.004",worldLocation(locId).name,majorFaction(newControl).short),'bad')}P.lastControl=newControl;return notes}
function showPoliticalProtection(locId=state.world.location){modalRouteEnter(SOSText("politics_protection_outcomes.showPoliticalProtection.001"),Array.from(arguments));const control=settlementControl(locId),score=politicalProtectionScore(locId,control),cap=politicalCapital(locId,control),debt=politicalDebt(locId,control),cases=politicalProtectionCases(locId).slice(-12).reverse();overlay(SOSText("politics_protection_outcomes.showPoliticalProtection.002",esc(worldLocation(locId).name),esc(majorFaction(control).name),esc(politicalProtectionLabel(score)),score,cap.toFixed(1),debt.toFixed(1),cases.map(c=>`<div class="card compact"><b>${esc(c.status==='reopened'?'REOPENED':c.status==='protected'?'PROTECTED':c.status==='suspected'?'SUSPECTED':c.status==='closed'?'CLOSED':'OPEN')} — ${esc(c.kind.toUpperCase())}</b><br>Day ${c.day} • Target: ${esc(majorFaction(c.victimFaction)?.short||c.victimFaction)}<br><small>${esc(c.desc)}${c.protectionLevel?` • ${esc(c.protectionLevel)} cover`:''}${c.reopenedBy?` • reopened by ${esc(majorFaction(c.reopenedBy).short)}`:''}</small></div>`).join('')||'<p class="muted">No politically sensitive case files are recorded here.</p>'),true);$('#politicalProtectionBack').onclick=()=>SOSServices.navigation.back(()=>showSettlementPolitics(locId))}
function politicalOutcomeSnapshot(locId,extraFactions=[]){
 const factions=[...new Set([...localPoliticalFactions(locId),...extraFactions.filter(f=>OPEN_WORLD_FACTIONS[f])])],covert=politicalCovertState(locId),profiles={},standing={},capital={},debt={};
 for(const f of factions){const p=localPoliticalProfile(locId,f);profiles[f]={publicSupport:p.publicSupport,organization:p.organization,legitimacy:p.legitimacy,merchantBacking:p.merchantBacking,securityInfluence:p.securityInfluence,pressure:politicalPressure(locId,f),momentum:politicalCampaignState(locId,f).momentum};standing[f]=state.world.factionStanding[f]||0;capital[f]=politicalCapital(locId,f);debt[f]=politicalDebt(locId,f)}
 return {locId,day:state.world.day,gold:state.gold,rep:localReputation(locId),autonomy:politicalSettlement(locId).autonomy,security:settlementState(locId).security,prosperity:settlementState(locId).prosperity,lawHeat:lawHeat(locId),bounty:localBounty(locId),warrant:hasWarrant(locId),control:settlementControl(locId),suspicion:covert.suspicion,evidence:covert.evidence,profiles,standing,capital,debt}
}
function politicalOutcomeDelta(a,b){const d=(Number(b)||0)-(Number(a)||0);return Math.abs(d)<.01?0:Math.round(d*100)/100}
function politicalOutcomeDeltaText(d,suffix=''){if(!d)return'—';return `${d>0?'+':''}${Number.isInteger(d)?d:d.toFixed(2)}${suffix}`}
function politicalOutcomeRows(before,after){
 const rows=[],factions=[...new Set([...Object.keys(before?.profiles||{}),...Object.keys(after?.profiles||{})])],metrics=[[SOSText("politics_protection_outcomes.politicalOutcomeRows.001"),SOSText("politics_protection_outcomes.politicalOutcomeRows.002")],['organization',SOSText("politics_protection_outcomes.politicalOutcomeRows.003")],['legitimacy',SOSText("politics_protection_outcomes.politicalOutcomeRows.004")],[SOSText("politics_protection_outcomes.politicalOutcomeRows.005"),SOSText("politics_protection_outcomes.politicalOutcomeRows.006")],[SOSText("politics_protection_outcomes.politicalOutcomeRows.007"),SOSText("politics_protection_outcomes.politicalOutcomeRows.008")],['pressure',SOSText("politics_protection_outcomes.politicalOutcomeRows.009")],['momentum',SOSText("politics_protection_outcomes.politicalOutcomeRows.010")]];
 for(const f of factions){for(const [k,label] of metrics){const d=politicalOutcomeDelta(before?.profiles?.[f]?.[k],after?.profiles?.[f]?.[k]);if(d)rows.push({group:majorFaction(f).short,label,delta:d})}const sd=politicalOutcomeDelta(before?.standing?.[f],after?.standing?.[f]);if(sd)rows.push({group:majorFaction(f).short,label:SOSText("politics_protection_outcomes.politicalOutcomeRows.011"),delta:sd});const cd=politicalOutcomeDelta(before?.capital?.[f],after?.capital?.[f]);if(cd)rows.push({group:majorFaction(f).short,label:SOSText("politics_protection_outcomes.politicalOutcomeRows.012"),delta:cd});const dd=politicalOutcomeDelta(before?.debt?.[f],after?.debt?.[f]);if(dd)rows.push({group:majorFaction(f).short,label:SOSText("politics_protection_outcomes.politicalOutcomeRows.013"),delta:dd})}
 const locals=[['rep',SOSText("politics_protection_outcomes.politicalOutcomeRows.014")],['autonomy',SOSText("politics_protection_outcomes.politicalOutcomeRows.015")],['security',SOSText("politics_protection_outcomes.politicalOutcomeRows.016")],['prosperity',SOSText("politics_protection_outcomes.politicalOutcomeRows.017")],[SOSText("politics_protection_outcomes.politicalOutcomeRows.018"),SOSText("politics_protection_outcomes.politicalOutcomeRows.019")],['bounty',SOSText("politics_protection_outcomes.politicalOutcomeRows.020")],['suspicion',SOSText("politics_protection_outcomes.politicalOutcomeRows.021")],['evidence',SOSText("politics_protection_outcomes.politicalOutcomeRows.022")]];for(const [k,label] of locals){const d=politicalOutcomeDelta(before?.[k],after?.[k]);if(d)rows.push({group:SOSText("politics_protection_outcomes.politicalOutcomeRows.023"),label,delta:d,suffix:k==='bounty'?'g':''})}
 return rows
}
function sentenceStart(text){
 const s=String(text??'');const i=s.search(/[A-Za-z]/);return i<0?s:s.slice(0,i)+s.charAt(i).toUpperCase()+s.slice(i+1)
}
function narrativeEntityName(name,sentenceInitial=false){
 const raw=String(name??'');if(sentenceInitial)return sentenceStart(raw);return /^The\s+/.test(raw)?'the '+raw.slice(4):raw
}

function politicalOutcomeMagnitude(delta){
 const a=Math.abs(Number(delta)||0);
 return a>=3?SOSText("politics_protection_outcomes.politicalOutcomeMagnitude.001"):a>=1?SOSText("politics_protection_outcomes.politicalOutcomeMagnitude.002"):SOSText("politics_protection_outcomes.politicalOutcomeMagnitude.003")
}
function politicalOutcomeCheckResult(check){
 if(!check)return null;
 const chance=clamp(Math.round(Number(check.chance)||0),0,100),roll=clamp(Math.round(Number(check.roll)||0),1,100),kind=check.kind||'success',triggered=check.triggered!=null?!!check.triggered:roll<=chance,margin=Math.abs(chance-roll);
 let headline='',detail='',tone='';
 if(kind==='risk'){
  if(triggered){headline=margin<=3?SOSText("politics_protection_outcomes.politicalOutcomeCheckResult.001"):margin<=12?SOSText("politics_protection_outcomes.politicalOutcomeCheckResult.002"):SOSText("politics_protection_outcomes.politicalOutcomeCheckResult.003");tone='bad'}
  else{headline=margin<=3?SOSText("politics_protection_outcomes.politicalOutcomeCheckResult.004"):margin<=15?SOSText("politics_protection_outcomes.politicalOutcomeCheckResult.005"):SOSText("politics_protection_outcomes.politicalOutcomeCheckResult.006");tone='good'}
  detail=SOSText("politics_protection_outcomes.politicalOutcomeCheckResult.007",chance,roll,margin)
 }else{
  if(triggered){headline=margin<=3?SOSText("politics_protection_outcomes.politicalOutcomeCheckResult.008"):margin<=12?SOSText("politics_protection_outcomes.politicalOutcomeCheckResult.009"):SOSText("politics_protection_outcomes.politicalOutcomeCheckResult.010");tone='good'}
  else{headline=margin<=3?SOSText("politics_protection_outcomes.politicalOutcomeCheckResult.011"):margin<=12?SOSText("politics_protection_outcomes.politicalOutcomeCheckResult.012"):SOSText("politics_protection_outcomes.politicalOutcomeCheckResult.013");tone='bad'}
  detail=SOSText("politics_protection_outcomes.politicalOutcomeCheckResult.014",chance,roll,margin)
 }
 return {label:check.label||SOSText("politics_protection_outcomes.politicalOutcomeCheckResult.015"),chance,roll,triggered,margin,headline,detail,tone,kind}
}
function politicalOutcomeChecksHTML(checks=[]){
 const rows=checks.map(politicalOutcomeCheckResult).filter(Boolean);if(!rows.length)return'';
 return `<div class="political-check-grid">${rows.map(c=>`<div class="political-check-card ${c.tone}"><div class="political-check-head"><span>${esc(c.label)}</span><b>${esc(c.headline)}</b></div><div class="political-check-numbers"><strong>${c.chance}%</strong><span>${c.kind==='risk'?SOSText("politics_protection_outcomes.politicalOutcomeChecksHTML.001"):SOSText("politics_protection_outcomes.politicalOutcomeChecksHTML.002")}</span><strong>${c.roll}</strong><span>${SOSText("politics_protection_outcomes.politicalOutcomeChecksHTML.003")}</span></div><div class="political-check-track"><i class="political-check-threshold" style="left:${c.chance}%"></i><i class="political-check-roll" style="left:${c.roll}%"></i></div><small>${esc(c.detail)}</small></div>`).join('')}</div>`
}
function politicalOutcomeImpactSummary(rows){
 if(!rows.length)return SOSText("politics_protection_outcomes.politicalOutcomeImpactSummary.001");
 const top=[...rows].sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)).slice(0,3);
 return top.map((r,i)=>SOSText(i?"politics_protection_outcomes.politicalOutcomeImpactSummary.003":"politics_protection_outcomes.politicalOutcomeImpactSummary.002",r.group,r.label,r.delta<0?SOSText("politics_protection_outcomes.politicalOutcomeImpactSummary.004"):SOSText("politics_protection_outcomes.politicalOutcomeImpactSummary.005"),politicalOutcomeMagnitude(r.delta))).join(' ')
}
function politicalOutcomeAfterscene(opts,rows){
 if(opts.aftermath)return opts.aftermath;
 const outcome=opts.success===false?SOSText("politics_protection_outcomes.politicalOutcomeAfterscene.001"):SOSText("politics_protection_outcomes.politicalOutcomeAfterscene.002");
 if(opts.exposed===true)return `${outcome} ${SOSText("politics_protection_outcomes.politicalOutcomeAfterscene.003")}`;
 if(opts.exposed===false)return `${outcome} ${SOSText("politics_protection_outcomes.politicalOutcomeAfterscene.004")}`;
 return `${outcome} ${politicalOutcomeImpactSummary(rows)}`
}

function politicalOutcomeHTML(before,after,notes=[],opts={}){
 const rows=politicalOutcomeRows(before,after),controlChange=before?.control!==after?.control?SOSText("politics_protection_outcomes.politicalOutcomeHTML.001",esc(before.control),esc(after.control)):'';
 const impact=rows.length?`<div class="political-impact-grid">${rows.map(r=>`<div class="political-impact-row"><span><b>${esc(r.group)}</b><small>${esc(r.label)}</small></span><span class="political-impact-change ${r.delta>0?'up':'down'}"><b>${r.delta>0?'↑':'↓'} ${esc(politicalOutcomeDeltaText(Math.abs(r.delta),r.suffix||''))}</b><small>${esc(politicalOutcomeMagnitude(r.delta))}</small></span></div>`).join('')}</div>`:`<div class="notice compact">${esc(SOSText("politics_protection_outcomes.politicalOutcomeImpactSummary.001"))}</div>`;
 const detailNotes=notes.filter(Boolean).map(n=>`<div class="political-detail-line">${esc(sentenceStart(n))}</div>`).join('');
 return `${controlChange}<section class="political-outcome-section"><h3>${SOSText("politics_protection_outcomes.politicalOutcomeHTML.002")}</h3><p class="political-aftermath">${esc(politicalOutcomeAfterscene(opts,rows))}</p></section><section class="political-outcome-section"><h3>${SOSText("politics_protection_outcomes.politicalOutcomeHTML.003")}</h3>${impact}</section>${detailNotes?`<details class="political-operation-details"><summary>${SOSText("politics_protection_outcomes.politicalOutcomeHTML.004")}</summary>${detailNotes}</details>`:''}`
}
function showPoliticalOutcome(title,narrative,before,after,opts={}){modalRouteEnter(SOSText("politics_protection_outcomes.showPoliticalOutcome.001"),Array.from(arguments));
 const tone=opts.tone||'info',back=opts.back||(()=>showSettlementPolitics(before?.locId||state.world.location)),button=opts.button||SOSText("politics_protection_outcomes.showPoliticalOutcome.002"),notes=opts.notes||[],status=opts.success===false?SOSText("politics_protection_outcomes.showPoliticalOutcome.006"):opts.success===true?opts.exposed===true?SOSText("politics_protection_outcomes.showPoliticalOutcome.007"):SOSText("politics_protection_outcomes.showPoliticalOutcome.008"):tone==='bad'?SOSText("politics_protection_outcomes.showPoliticalOutcome.006"):tone==='good'?SOSText("politics_protection_outcomes.showPoliticalOutcome.009"):SOSText("politics_protection_outcomes.showPoliticalOutcome.010");
 overlay(SOSText("politics_protection_outcomes.showPoliticalOutcome.003",esc(title),tone==='bad'?'warning':tone==='good'?'success':'notice',esc(status),esc(sentenceStart(narrative||SOSText("politics_protection_outcomes.showPoliticalOutcome.011"))),politicalOutcomeChecksHTML(opts.checks||[]),politicalOutcomeHTML(before,after,notes,opts),esc(button)),true);
 $('#politicalOutcomeContinue').onclick=()=>{try{closeOverlay();if(typeof back==='function'){back();return}}catch(e){console.error(SOSText("politics_protection_outcomes.showPoliticalOutcome.004"),e);if(state?.log)state.log.push({t:Date.now(),msg:SOSText("politics_protection_outcomes.showPoliticalOutcome.005",e?.message||e),type:'bad'})}resetTownNavigation();closeOverlay();save();renderGame()};
 $('#politicalOutcomeExit').onclick=()=>{resetTownNavigation();closeOverlay();save();renderGame()}
}

function politicalCampaignState(locId,faction){
 const ps=politicalSettlement(locId);if(!ps.campaigns||typeof ps.campaigns!=='object')ps.campaigns={};
 if(!ps.campaigns[faction]||typeof ps.campaigns[faction]!=='object')ps.campaigns[faction]={momentum:0,successes:0,failures:0,lastCommissionDay:-99,lastResultDay:-99,heat:0,history:[]};
 const c=ps.campaigns[faction];for(const k of ['momentum','successes','failures','heat'])if(!Number.isFinite(c[k]))c[k]=0;if(!Number.isFinite(c.lastCommissionDay))c.lastCommissionDay=-99;if(!Number.isFinite(c.lastResultDay))c.lastResultDay=-99;if(!Array.isArray(c.history))c.history=[];return c
}
