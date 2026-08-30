function homeFinanceState(){ensureHomeBase();return state.world.homeBase.finance}

const ECONOMIC_ADVISER_CANDIDATES=[
 {id:'elias_marr',name:SOSText("hall_business_finance_logistics.homeFinanceState.001"),competence:4,salary:96,strength:SOSText("hall_business_finance_logistics.homeFinanceState.002")},
 {id:'niva_crest',name:SOSText("hall_business_finance_logistics.homeFinanceState.003"),competence:3,salary:75,strength:SOSText("hall_business_finance_logistics.homeFinanceState.004")},
 {id:'joren_pell',name:SOSText("hall_business_finance_logistics.homeFinanceState.005"),competence:4,salary:102,strength:SOSText("hall_business_finance_logistics.homeFinanceState.006")},
 {id:'mara_vesk',name:SOSText("hall_business_finance_logistics.homeFinanceState.007"),competence:3,salary:72,strength:SOSText("hall_business_finance_logistics.homeFinanceState.008")}
];
// v1.6.24 — Guardian Hall Economy & Workforce II
// Profit policies govern Economic Adviser business-cycle profits only. Dedicated Hall
// revenue (prisoner work crews, facility services, transfers, etc.) remains Hall money.
const HALL_BUSINESS_STRATEGIES={
 reserve:{name:SOSText("hall_business_finance_logistics.homeFinanceState.009"),hallShare:1.00,guardianShare:0.00,desc:SOSText("hall_business_finance_logistics.homeFinanceState.010")},
 hall_first:{name:SOSText("hall_business_finance_logistics.homeFinanceState.015"),hallShare:.75,guardianShare:.25,desc:SOSText("hall_business_finance_logistics.homeFinanceState.016")},
 balanced:{name:SOSText("hall_business_finance_logistics.homeFinanceState.011"),hallShare:.50,guardianShare:.50,desc:SOSText("hall_business_finance_logistics.homeFinanceState.012")},
 payout:{name:SOSText("hall_business_finance_logistics.homeFinanceState.013"),hallShare:.25,guardianShare:.75,desc:SOSText("hall_business_finance_logistics.homeFinanceState.014")},
 full_distribution:{name:SOSText("hall_business_finance_logistics.homeFinanceState.017"),hallShare:0.00,guardianShare:1.00,desc:SOSText("hall_business_finance_logistics.homeFinanceState.018")}
};
function homeBusinessDistributeProfit(gross,category='Hall business',text='Guardian Hall commercial profit'){ensureHomeBase();gross=Math.max(0,Math.round(Number(gross)||0));const h=state.world.homeBase,B=h.business,strat=HALL_BUSINESS_STRATEGIES[B.strategy]||HALL_BUSINESS_STRATEGIES.balanced,hall=Math.max(0,Math.min(gross,Math.round(gross*strat.hallShare))),guardian=Math.max(0,gross-hall);if(hall>0)homeFinanceCredit(hall,category,text);if(guardian>0){SOSServices.accounts.credit('guardian',guardian,{category,text,sourceAccount:'hall_business'});B.guardianDistributions=(B.guardianDistributions||0)+guardian}B.lifetimeGross=(B.lifetimeGross||0)+gross;B.lifetimeHall=(B.lifetimeHall||0)+hall;B.lastIncome=gross;return {hall,guardian,gross}}
function homeBusinessReport(text,tone='info'){ensureHomeBase();const B=state.world.homeBase.business;B.reports.push({day:state.world.day,text,tone});B.reports=B.reports.slice(-40)}
function homeBusinessSpareCapacity(){ensureHomeBase();const cap=homeStaffCapacity(),need=homeStaffDemand();return Math.max(0,Math.floor((cap-need)/2))}
function homeBusinessFacilityScore(){const raw=homeUpgradeLevel('workshop')*2+homeUpgradeLevel(SOSText("hall_business_finance_logistics.homeBusinessFacilityScore.001"))+homeUpgradeLevel('archives')+(state.world.homeBase.upgrades.banquetFacilities?2:0)+homeUpgradeLevel(SOSText("hall_business_finance_logistics.homeBusinessFacilityScore.002"));return Math.round(raw*(typeof homeArtisanConditionFactor==='function'?homeArtisanConditionFactor():1))}
function homeBusinessDailyTick(){if(!isOpenWorld())return;ensureHomeBase();const h=state.world.homeBase,B=h.business;if(!B.adviser)return;homeEnsureNamedStaffCareer(B.adviser,'economic');if(state.world.day-(B.lastSalaryDay||state.world.day)>=14){const sal=B.adviser.salary||26;if(h.logistics.budget>=sal){homeFinanceDebit(sal,SOSText("hall_business_finance_logistics.homeBusinessDailyTick.001"),SOSText("hall_business_finance_logistics.homeBusinessDailyTick.002",B.adviser.name));B.lastSalaryDay=state.world.day;homeBusinessReport(SOSText("hall_business_finance_logistics.homeBusinessDailyTick.003",B.adviser.name,sal),'good')}else homeBusinessReport(SOSText("hall_business_finance_logistics.homeBusinessDailyTick.004",B.adviser.name),'bad')}if(state.world.day-(B.lastTradeDay||-99)<2)return;B.lastTradeDay=state.world.day;const prosperity=settlementState('shantium')?.prosperity||50,spare=homeBusinessSpareCapacity(),facility=homeBusinessFacilityScore(),competence=B.adviser.competence||3;const prosperityPremium=prosperity>=85?8:prosperity>=70?4:0;let gross=Math.max(4,Math.round(competence*5+facility*1.55+spare*1.15+prosperity/15+prosperityPremium+rnd(-3,4)));if(homeStaffCoverage()<85)gross=Math.round(gross*.7);const shares=homeBusinessDistributeProfit(gross,SOSText("hall_business_finance_logistics.homeBusinessDailyTick.005"),SOSText("hall_business_finance_logistics.homeBusinessDailyTick.006",B.adviser.name));const work=pick([SOSText("hall_business_finance_logistics.homeBusinessDailyTick.007"),SOSText("hall_business_finance_logistics.homeBusinessDailyTick.008"),SOSText("hall_business_finance_logistics.homeBusinessDailyTick.009"),SOSText("hall_business_finance_logistics.homeBusinessDailyTick.010"),SOSText("hall_business_finance_logistics.homeBusinessDailyTick.011"),SOSText("hall_business_finance_logistics.homeBusinessDailyTick.012")]);homeBusinessReport(SOSText("hall_business_finance_logistics.homeBusinessDailyTick.013",B.adviser.name,gross,work,shares.hall,shares.guardian),'good')}
function showEconomicAdviserCandidates(){modalRouteEnter(SOSText("hall_business_finance_logistics.showEconomicAdviserCandidates.001"),Array.from(arguments));ensureHomeBase();const B=state.world.homeBase.business;overlay(SOSText("hall_business_finance_logistics.showEconomicAdviserCandidates.002",ECONOMIC_ADVISER_CANDIDATES.map(c=>`<div class="card"><b>${esc(c.name)}</b> • competence ${c.competence}/5 • ${c.salary} gold / 14 days<p>${esc(c.strength)}</p><button data-economic="${c.id}" ${B.adviser?.candidateId===c.id?'disabled':''}>${B.adviser?.candidateId===c.id?'Current Economic Adviser':B.adviser?'Replace Adviser':'Hire as Economic Adviser'}</button></div>`).join('')),true);document.querySelectorAll('[data-economic]').forEach(b=>b.onclick=()=>hireEconomicAdviser(b.dataset.economic));$('#economicBack').onclick=()=>guardianHallRouteBack(showHomeBusiness)}
function hireEconomicAdviser(id){ensureHomeBase();const B=state.world.homeBase.business,c=ECONOMIC_ADVISER_CANDIDATES.find(x=>x.id===id);if(!c)return showHomeBusiness();const old=B.adviser?.name||null;B.adviser={...c,candidateId:c.id,hiredDay:state.world.day};B.lastSalaryDay=state.world.day;B.lastTradeDay=state.world.day-1;homeBusinessReport(`${c.name} ${old?`replaces ${old}`:'becomes Economic Adviser'}.`,'good');recordWorldHistory(SOSText("hall_business_finance_logistics.hireEconomicAdviser.001",c.name,old?`replaces ${old} as`:'is appointed'),'good','home');save();showHomeBusiness()}
function setHallBusinessStrategy(id){ensureHomeBase();if(!HALL_BUSINESS_STRATEGIES[id])return showHomeBusiness();state.world.homeBase.business.strategy=id;homeBusinessReport(SOSText("hall_business_finance_logistics.setHallBusinessStrategy.001",HALL_BUSINESS_STRATEGIES[id].name));save();showHomeBusiness()}
function showHomeBusiness(){modalRouteEnter(SOSText("hall_business_finance_logistics.showHomeBusiness.001"),Array.from(arguments));guardianHallRouteEnter('showHomeBusiness',[]);ensureHomeBase();const h=state.world.homeBase,B=h.business,strat=HALL_BUSINESS_STRATEGIES[B.strategy]||HALL_BUSINESS_STRATEGIES.balanced,spare=homeBusinessSpareCapacity(),reports=B.reports.slice(-12).reverse();overlay(SOSText("hall_business_finance_logistics.showHomeBusiness.002",B.adviser?`<div class="card"><h3>${esc(B.adviser.name)} — Economic Adviser</h3><p>${esc(B.adviser.strength)}</p><div class="stat-row"><span>Competence</span><b>${B.adviser.competence}/10</b></div><div class="stat-row"><span>Salary</span><b>${B.adviser.salary} gold / 14 days</b></div><div class="project-action-grid"><button id="businessOpportunities">Commercial Opportunities — ${(typeof homeCommercialState==='function'?homeCommercialState().offers.length:0)} available / ${(typeof homeCommercialState==='function'?homeCommercialState().active.length:0)} active</button><button id="businessDelegation">Delegation Policy — ${(typeof homeCommercialDelegationPolicy==='function'?homeCommercialDelegationPolicy().name:'Guardian Approval')}</button><button id="economicCandidates">Replace Economic Adviser</button></div></div>`:`<div class="warning notice"><b>Economic Adviser position vacant.</b><br><button id="economicCandidates">Review Economic Adviser Candidates</button></div>`,esc(strat.name),spare,homeBusinessFacilityScore(),B.lifetimeGross||0,B.lifetimeHall||0,B.guardianDistributions||0,B.lastIncome||0,h.logistics.budget,Object.entries(HALL_BUSINESS_STRATEGIES).map(([id,s])=>`<button data-businessstrategy="${id}" ${B.strategy===id?'disabled':''}><b>${esc(s.name)}</b><small>${Math.round(s.hallShare*100)}% Hall / ${Math.round(s.guardianShare*100)}% Guardian<br>${esc(s.desc)}</small></button>`).join(''),reports.map(r=>`<div class="card compact"><b>Day ${r.day}</b><br>${esc(r.text)}</div>`).join('')||'<p class="muted">No business activity has been recorded yet.</p>'),true);$('#economicCandidates').onclick=showEconomicAdviserCandidates;if($('#businessOpportunities'))$('#businessOpportunities').onclick=showHomeCommercialOpportunities;if($('#businessDelegation'))$('#businessDelegation').onclick=showHomeCommercialDelegation;document.querySelectorAll('[data-businessstrategy]').forEach(b=>b.onclick=()=>setHallBusinessStrategy(b.dataset.businessstrategy));$('#businessBudget').onclick=showHomeBudget;$('#businessBack').onclick=()=>guardianHallRouteBack(showHomeBase)}

function homeFinanceRecord(type,category,amount,text){const F=homeFinanceState(),n=Math.max(0,Math.round(Number(amount)||0));F.ledger.push({day:state.world.day,type,category,amount:n,text});F.ledger=F.ledger.slice(-180);if(type==='income')F.lifetimeIncome+=n;else if(type==='expense')F.lifetimeExpense+=n;else if(type==='transfer')F.lifetimeTransfers+=n;else if(type==='capital')F.lifetimeCapital=(F.lifetimeCapital||0)+n;else if(type==='capital_return')F.lifetimeCapitalReturns=(F.lifetimeCapitalReturns||0)+n}
function homeFinanceCredit(amount,category,text){ensureHomeBase();amount=Math.max(0,Math.round(Number(amount)||0));if(!amount)return 0;SOSServices.accounts.credit('hall',amount,{category,text,sourceAccount:'external',type:'credit'});homeFinanceRecord('income',category,amount,text);return amount}
function homeFinanceDebit(amount,category,text){ensureHomeBase();amount=Math.max(0,Math.round(Number(amount)||0));if(!SOSServices.accounts.debit('hall',amount,{category,text,toAccount:'external',type:'debit'}))return false;homeFinanceRecord('expense',category,amount,text);return true}
function homeFinanceCapitalDebit(amount,category,text){ensureHomeBase();amount=Math.max(0,Math.round(Number(amount)||0));if(!SOSServices.accounts.debit('hall',amount,{category,text,toAccount:'capital',type:'debit'}))return false;homeFinanceRecord('capital',category,amount,text);return true}
function homeFinanceCapitalCredit(amount,category,text){ensureHomeBase();amount=Math.max(0,Math.round(Number(amount)||0));if(!amount)return 0;SOSServices.accounts.credit('hall',amount,{category,text,sourceAccount:'capital',type:'credit'});homeFinanceRecord('capital_return',category,amount,text);return amount}
function homeFinanceTransfer(amount){ensureHomeBase();amount=Math.max(0,Math.min(Math.round(Number(amount)||0),state.gold));if(!amount)return showHomeBudget();if(!SOSServices.accounts.transfer('guardian','hall',amount,{category:SOSText("hall_business_finance_logistics.homeFinanceTransfer.001"),text:SOSText("hall_business_finance_logistics.homeFinanceTransfer.002",amount)}))return showHomeBudget();homeFinanceRecord('transfer',SOSText("hall_business_finance_logistics.homeFinanceTransfer.001"),amount,SOSText("hall_business_finance_logistics.homeFinanceTransfer.002",amount));homeLogisticsReport(SOSText("hall_business_finance_logistics.homeFinanceTransfer.003",amount));save();showHomeBudget()}
function homePrisonerLaborGroups(){return (state.prisoners||[]).filter(p=>p.world&&p.hallLabor)}
function homePrisonerLaborAssigned(){return homePrisonerLaborGroups().reduce((n,p)=>n+(p.count||0),0)}
function homePrisonerLaborCapacity(){ensureHomeBase();const h=state.world.homeBase;return Math.max(2,(h.security.guards||4)*2+(h.staff?.attendants||0))}
function homePrisonerLaborProsperityBand(pros){
 if(pros>=85)return {rate:9,label:SOSText("hall_business_finance_logistics.homePrisonerLaborDailyIncome.004")};
 if(pros>=70)return {rate:7,label:SOSText("hall_business_finance_logistics.homePrisonerLaborDailyIncome.005")};
 if(pros>=55)return {rate:5,label:SOSText("hall_business_finance_logistics.homePrisonerLaborDailyIncome.006")};
 if(pros>=35)return {rate:4,label:SOSText("hall_business_finance_logistics.homePrisonerLaborDailyIncome.007")};
 return {rate:3,label:SOSText("hall_business_finance_logistics.homePrisonerLaborDailyIncome.008")};
}
function homePrisonerLaborDailyIncome(){ensureHomeBase();const assigned=homePrisonerLaborAssigned();if(!assigned)return 0;const capacity=homePrisonerLaborCapacity(),workers=Math.min(assigned,capacity),pros=Math.max(0,Math.min(100,settlementState('shantium')?.prosperity||50)),market=homePrisonerLaborProsperityBand(pros),income=Math.max(0,workers*market.rate);if(!income)return 0;homeFinanceCredit(income,SOSText("hall_business_finance_logistics.homePrisonerLaborDailyIncome.001"),SOSText("hall_business_finance_logistics.homePrisonerLaborDailyIncome.002",workers,workers===1?'':'s',income,pros,market.label));homeLogisticsReport(SOSText("hall_business_finance_logistics.homePrisonerLaborDailyIncome.009",workers,workers===1?'':'s',market.label,income,Math.max(0,assigned-workers)),'good');if(assigned>workers&&state.world.day%3===0)homeLogisticsReport(SOSText("hall_business_finance_logistics.homePrisonerLaborDailyIncome.003",assigned-workers,assigned-workers===1?' is':'s are'));return income}
function homeFacilityServiceIncomeTick(){
 ensureHomeBase();const h=state.world.homeBase,F=h.finance,last=F.lastServiceIncomeDay,pros=settlementState('shantium')?.prosperity||50,options=[];
 const busy=r=>typeof homeCommercialUsesResource==='function'&&homeCommercialUsesResource(r);
 if(homeUpgradeLevel('workshop')&&!busy('artisan')&&state.world.day-last.workshop>=3)options.push(['workshop',5+homeUpgradeLevel('workshop')*3+Math.floor(pros/15),'artisan',SOSText("hall_business_finance_logistics.homeFacilityServiceIncomeTick.001"),SOSText("hall_business_finance_logistics.homeFacilityServiceIncomeTick.002")]);
 if(homeUpgradeLevel(SOSText("hall_business_finance_logistics.homeFacilityServiceIncomeTick.003"))&&!busy('training')&&state.world.day-last.training>=4)options.push(['training',4+homeUpgradeLevel(SOSText("hall_business_finance_logistics.homeFacilityServiceIncomeTick.004"))*3+Math.floor(pros/20),'training',SOSText("hall_business_finance_logistics.homeFacilityServiceIncomeTick.005"),SOSText("hall_business_finance_logistics.homeFacilityServiceIncomeTick.006")]);
 if(homeUpgradeLevel('archives')&&!busy('archives')&&state.world.day-last.archives>=5)options.push(['archives',3+homeUpgradeLevel('archives')*3+Math.floor(pros/25),'archives',SOSText("hall_business_finance_logistics.homeFacilityServiceIncomeTick.007"),SOSText("hall_business_finance_logistics.homeFacilityServiceIncomeTick.008")]);
 if(h.upgrades.banquetFacilities&&!busy('banquet')&&state.world.day-last.banquet>=7)options.push(['banquet',9+Math.floor(pros/12),'banquet',SOSText("hall_business_finance_logistics.homeFacilityServiceIncomeTick.009"),SOSText("hall_business_finance_logistics.homeFacilityServiceIncomeTick.010")]);
 if(!options.length)return 0;
 const serviceLimit=pros>=90?3:pros>=70?2:1,total=Math.min(serviceLimit,options.length),chosen=[];
 while(chosen.length<total&&options.length)chosen.push(options.splice(rnd(0,options.length-1),1)[0]);
 let earned=0;for(const [id,amount,resource,cat,text] of chosen){last[id]=state.world.day;homeFinanceCredit(amount,cat,text);earned+=amount}
 return earned
}

function homeFinanceDailyTick(){if(!isOpenWorld())return;ensureHomeBase();homePrisonerLaborDailyIncome();homeFacilityServiceIncomeTick();homeCommercialDailyTick();homeBusinessDailyTick()}
function homeFinanceWindow(days=30){const F=homeFinanceState(),from=Math.max(0,state.world.day-days+1),rows=F.ledger.filter(x=>x.day>=from),income=rows.filter(x=>x.type==='income').reduce((n,x)=>n+x.amount,0),expense=rows.filter(x=>x.type==='expense').reduce((n,x)=>n+x.amount,0),capital=rows.filter(x=>x.type==='capital').reduce((n,x)=>n+x.amount,0),capitalReturn=rows.filter(x=>x.type==='capital_return').reduce((n,x)=>n+x.amount,0),transfers=rows.filter(x=>x.type==='transfer').reduce((n,x)=>n+x.amount,0);return {rows,income,expense,capital,capitalReturn,transfers,net:income-expense}}
function homeHallOperatingHealth(days=30){
 const w=homeFinanceWindow(days),pros=Math.max(0,Math.min(100,settlementState('shantium')?.prosperity||50));
 const coverage=w.expense>0?w.income/w.expense:(w.income>0?2:1),netPerDay=Math.round((w.net/Math.max(1,days))*10)/10;
 const label=coverage>=1.35?'Strongly Profitable':coverage>=1.08?'Self-Sustaining':coverage>=.90?'Near Break-Even':'Operating Deficit';
 const tone=coverage>=1.08?'good-text':coverage>=.90?'':'danger-text';
 const target=pros>=85?'A mature Hall in exceptional Shantium should normally cover operations and retain a moderate surplus.':pros>=70?'A developed Hall in prosperous Shantium should generally be capable of paying for itself.':'Lower local prosperity naturally limits the Hall’s commercial ceiling.';
 return {days,...w,coverage,netPerDay,label,tone,prosperity:pros,target}
}
function homeFinanceCategoryBreakdown(rows,type){
 const sums={};for(const x of rows)if(x.type===type){const k=x.category||SOSText("hall_business_finance_logistics.showHomeBudget.017");sums[k]=(sums[k]||0)+(x.amount||0)}
 return Object.entries(sums).sort((a,b)=>b[1]-a[1])
}
function showHomeBudget(){modalRouteEnter(SOSText("hall_business_finance_logistics.showHomeBudget.001"),Array.from(arguments));guardianHallRouteEnter('showHomeBudget',[]);ensureHomeBase();const h=state.world.homeBase,L=h.logistics,F=h.finance,w7=homeFinanceWindow(7),w30=homeFinanceWindow(30),assigned=homePrisonerLaborAssigned(),cap=homePrisonerLaborCapacity(),max=Math.max(0,state.gold),suggest=Math.min(max,Math.max(0,Math.min(500,max))),fmt=n=>`${n>=0?'+':''}${n}g`,recent=F.ledger.slice(-36).reverse();
 const period=(label,w)=>SOSText("hall_business_finance_logistics.showHomeBudget.002",label,w.net>=0?'good-text':'danger-text',fmt(w.net),w.income,w.expense,w.net>=0?'good-text':'danger-text',fmt(w.net),w.capital,w.transfers,w.capitalReturn||0);
 const incomeRows=homeFinanceCategoryBreakdown(w30.rows,'income'),expenseRows=homeFinanceCategoryBreakdown(w30.rows,'expense'),categoryHTML=(rows,empty)=>rows.length?rows.slice(0,6).map(([name,amount])=>`<div class="budget-category-row"><span>${esc(name)}</span><b>${amount}g</b></div>`).join(''):`<p class="muted compact">${esc(empty)}</p>`;
 const health=homeHallOperatingHealth(30),coveragePct=Math.round(health.coverage*100);
 const sourceHTML=`<div class="card compact"><h4>Operating Self-Sufficiency</h4><div class="stat-row"><span>30-day status</span><b class="${health.tone}">${esc(health.label)}</b></div><div class="stat-row"><span>Income coverage</span><b>${coveragePct}% of operating expenses</b></div><div class="stat-row"><span>Operating result / day</span><b class="${health.netPerDay>=0?'good-text':'danger-text'}">${health.netPerDay>=0?'+':''}${health.netPerDay}g</b></div><div class="stat-row"><span>Shantium prosperity</span><b>${health.prosperity}/100</b></div><small>${esc(health.target)}</small></div><div class="stat-row"><span>Prisoner work crews</span><b>${assigned?`${assigned} assigned / ${cap} capacity`:'None assigned'}</b></div><div class="stat-row"><span>Workshop services</span><b>${h.upgrades.workshop?'Active':'Not established'}</b></div><div class="stat-row"><span>Training fees</span><b>${h.upgrades.trainingYard?'Active':'Not established'}</b></div><div class="stat-row"><span>Archive & scribe services</span><b>${h.upgrades.archives?'Active':'Not established'}</b></div><div class="stat-row"><span>Hosted events</span><b>${h.upgrades.banquetFacilities?'Active':'No major facilities'}</b></div><div class="stat-row"><span>Economic Adviser</span><b>${h.business?.adviser?`${esc(h.business.adviser.name)} • active`:'Position vacant'}</b></div>`;
 const breakdownHTML=`<div class="budget-breakdown-grid"><div class="card budget-breakdown-card"><h4>30-Day Income</h4>${categoryHTML(incomeRows,'No Hall income in this period.')}</div><div class="card budget-breakdown-card"><h4>30-Day Operating Expenses</h4>${categoryHTML(expenseRows,'No operating expenses in this period.')}</div></div>`;
 const ledgerHTML=recent.map(x=>`<div class="budget-ledger-row ${esc(x.type)}"><span><b>Day ${x.day}</b><small>${esc(x.category||'Hall account')} • ${esc(x.text||'')}</small></span><b>${x.type==='income'?'+':x.type==='expense'?'-':x.type==='capital'?'◆ ':x.type==='capital_return'?'↩ ':'↔ '}${x.amount}g</b></div>`).join('')||'<p class="muted">No Hall account activity has been recorded yet.</p>';
 overlay(SOSText("hall_business_finance_logistics.showHomeBudget.003",L.budget.toLocaleString(),state.gold.toLocaleString(),(F.lifetimeIncome||0).toLocaleString(),period('Last 7 Days',w7),period('Last 30 Days',w30),max,suggest,suggest,max<=0?'disabled':'',sourceHTML,breakdownHTML,ledgerHTML),true);
 const slider=$('#hallBudgetSlider'),value=$('#hallBudgetSliderValue');if(slider)slider.oninput=()=>{value.textContent=`${slider.value} gold`};
 if($('#hallBudgetTransfer'))$('#hallBudgetTransfer').onclick=()=>SOSServices.hallFinance.transferFromGuardian(Number(slider?.value||0));
 if($('#hallBudgetBusiness'))$('#hallBudgetBusiness').onclick=showHomeBusiness;
 if($('#hallBudgetLogistics'))$('#hallBudgetLogistics').onclick=showHomeLogistics;
 if($('#hallBudgetToggleLedger'))$('#hallBudgetToggleLedger').onclick=()=>{const box=$('#hallBudgetLedger'),btn=$('#hallBudgetToggleLedger');if(!box||!btn)return;const open=box.hidden;box.hidden=!open;btn.textContent=open?SOSText("hall_business_finance_logistics.showHomeBudget.019"):SOSText("hall_business_finance_logistics.showHomeBudget.018")};
 $('#hallBudgetBack').onclick=()=>guardianHallRouteBack(showHomeBase)
}


const LOGISTICS_MASTER_CANDIDATES=[
 {id:'merrin_vale',name:SOSText("hall_business_finance_logistics.showHomeBudget.004"),competence:3,salary:72,strength:SOSText("hall_business_finance_logistics.showHomeBudget.005")},
 {id:'tessa_moor',name:SOSText("hall_business_finance_logistics.showHomeBudget.006"),competence:4,salary:90,strength:SOSText("hall_business_finance_logistics.showHomeBudget.007")},
 {id:'orin_bell',name:SOSText("hall_business_finance_logistics.showHomeBudget.008"),competence:2,salary:54,strength:SOSText("hall_business_finance_logistics.showHomeBudget.009")},
 {id:'nora_reeve',name:SOSText("hall_business_finance_logistics.showHomeBudget.010"),competence:3,salary:75,strength:SOSText("hall_business_finance_logistics.showHomeBudget.011")}
];

const HOME_LOCAL_SUPPLY_LABELS={food:SOSText("hall_business_finance_logistics.showHomeBudget.012"),household:SOSText("hall_business_finance_logistics.showHomeBudget.013"),medical:SOSText("hall_business_finance_logistics.showHomeBudget.014"),guard:SOSText("hall_business_finance_logistics.showHomeBudget.015"),hospitality:SOSText("hall_business_finance_logistics.showHomeBudget.016")};
function homeLocalFoodCrisis(){
 const ss=settlementState('shantium'),p=settlementProblem('shantium');
 return !!((p?.type==='shortage'&&(ss.prosperity||0)<45)||(ss.prosperity||0)<=18)
}
function homeHallEmployeeCrisisFoodUse(){
 if(!homeLocalFoodCrisis())return 0;ensureHomeBase();const h=state.world.homeBase,employees=homeStaffTotal()+(h.security.guards||0)+(h.logistics.master?1:0)+(h.security.headGuard?1:0)+(h.business?.adviser?1:0);
 return Math.max(1,Math.ceil(employees/20))
}
function homeEmergencyProcurementEligibleStaff(){
 ensureHomeBase();const T=state.world.homeBase.staff;
 return Math.max(0,(T.attendants||0)+(T.messengers||0)+Math.floor((T.cooks||0)/2))
}
function homeEmergencyProcurementStaffAvailable(){
 ensureHomeBase();const h=state.world.homeBase;
 if(h.logistics.lastEmergencyLocalDay===state.world.day)return 0;
 const eligible=homeEmergencyProcurementEligibleStaff(),spare=Math.max(0,homeStaffBaseCapacity()-homeStaffDemand());
 return Math.max(0,Math.min(12,eligible,Math.floor(spare/2)))
}
function homeEmergencyLocalMarketFactor(){
 const ss=settlementState('shantium'),p=settlementProblem('shantium'),pros=ss.prosperity||0;
 let amount=pros>=75?1:pros>=50?.85:pros>=30?.65:.45,cost=pros>=75?1:pros>=50?1.15:pros>=30?1.35:1.65;
 if(p?.type==='shortage'){amount*=.7;cost*=1.25}
 if(p?.type==='trade_slump'){amount*=.85;cost*=1.12}
 return {amount:clamp(amount,.3,1),cost:Math.max(1,cost),prosperity:pros,problem:p}
}
function homeEmergencyLocalQuote(kind){
 ensureHomeBase();const L=state.world.homeBase.logistics,staff=homeEmergencyProcurementStaffAvailable(),market=homeEmergencyLocalMarketFactor(),current=L.supplies[kind]||0,office=homeUpgradeLevel(SOSText("hall_business_finance_logistics.homeEmergencyLocalQuote.001"));
 const raw=8+staff*3+office*2,amount=Math.max(0,Math.min(100-current,Math.floor(raw*market.amount))),unit={food:3,household:2.5,medical:4,guard:3.5,hospitality:3}[kind]||3;
 const cost=amount?Math.max(25,Math.round((20+amount*unit)*market.cost)):0;
 return {kind,label:HOME_LOCAL_SUPPLY_LABELS[kind]||kind,staff,amount,cost,current,market}
}
function homeEmergencyLocalPurchase(kind){
 ensureHomeBase();const h=state.world.homeBase,L=h.logistics,q=homeEmergencyLocalQuote(kind);
 if(!L.master)return actionResult(SOSText("hall_business_finance_logistics.homeEmergencyLocalPurchase.001"),SOSText("hall_business_finance_logistics.homeEmergencyLocalPurchase.002"),'info',showHomeLogistics);
 if(L.lastEmergencyLocalDay===state.world.day)return actionResult(SOSText("hall_business_finance_logistics.homeEmergencyLocalPurchase.003"),SOSText("hall_business_finance_logistics.homeEmergencyLocalPurchase.004"),'info',showHomeLogistics);
 if(q.staff<=0)return actionResult(SOSText("hall_business_finance_logistics.homeEmergencyLocalPurchase.005"),SOSText("hall_business_finance_logistics.homeEmergencyLocalPurchase.006"),'info',showHomeLogistics);
 if(q.amount<=0)return actionResult(SOSText("hall_business_finance_logistics.homeEmergencyLocalPurchase.007"),SOSText("hall_business_finance_logistics.homeEmergencyLocalPurchase.008",q.label),'info',showHomeLogistics);
 if(L.budget<q.cost)return actionResult(SOSText("hall_business_finance_logistics.homeEmergencyLocalPurchase.009"),SOSText("hall_business_finance_logistics.homeEmergencyLocalPurchase.010",q.label.toLowerCase(),q.cost),'bad',showHomeEmergencyProcurement);
 homeFinanceDebit(q.cost,SOSText("hall_business_finance_logistics.homeEmergencyLocalPurchase.011"),SOSText("hall_business_finance_logistics.homeEmergencyLocalPurchase.012",q.label,q.staff));
 L.supplies[kind]=Math.min(100,(L.supplies[kind]||0)+q.amount);L.lastEmergencyLocalDay=state.world.day;L.emergencyStaffAssigned=q.staff;
 L.status=SOSText("hall_business_finance_logistics.homeEmergencyLocalPurchase.013",L.master.name,q.staff);
 homeLogisticsReport(SOSText("hall_business_finance_logistics.homeEmergencyLocalPurchase.014",L.master.name,q.staff,q.amount,q.label.toLowerCase(),q.cost),'good');
 recordWorldHistory(SOSText("hall_business_finance_logistics.homeEmergencyLocalPurchase.015",q.label.toLowerCase()),'info','home');
 save();actionResult(SOSText("hall_business_finance_logistics.homeEmergencyLocalPurchase.016"),SOSText("hall_business_finance_logistics.homeEmergencyLocalPurchase.017",q.staff,q.label,q.amount,q.cost),'good',showHomeLogistics)
}
function showHomeEmergencyProcurement(){modalRouteEnter(SOSText("hall_business_finance_logistics.showHomeEmergencyProcurement.001"),Array.from(arguments));
 guardianHallRouteEnter('showHomeEmergencyProcurement',[]);ensureHomeBase();const h=state.world.homeBase,L=h.logistics,staff=homeEmergencyProcurementStaffAvailable(),market=homeEmergencyLocalMarketFactor(),used=L.lastEmergencyLocalDay===state.world.day,eligible=homeEmergencyProcurementEligibleStaff();
 const rows=Object.keys(HOME_LOCAL_SUPPLY_LABELS).map(k=>{const q=homeEmergencyLocalQuote(k);return SOSText("hall_business_finance_logistics.showHomeEmergencyProcurement.002",esc(q.label),q.current,q.amount,q.cost||0,k,used||staff<=0||q.amount<=0||L.budget<q.cost?'disabled':'',q.amount)}).join('');
 overlay(SOSText("hall_business_finance_logistics.showHomeEmergencyProcurement.003",staff,eligible,market.prosperity,market.problem?esc(market.problem.title):'No active supply crisis',L.budget,used?`<div class="notice compact"><b>Emergency purchasing already assigned today.</b><br>${L.emergencyStaffAssigned||0} staff are away from their normal Hall duties until tomorrow.</div>`:`<div class="notice compact"><b>${staff} staff can be reassigned today.</b><br>The larger the available team, the more of one supply category can be secured. Weak local conditions reduce supply and increase price.</div>`,rows),true);
 document.querySelectorAll('[data-emergencybuy]').forEach(b=>b.onclick=()=>homeEmergencyLocalPurchase(b.dataset.emergencybuy));$('#emergencyProcureBack').onclick=()=>guardianHallRouteBack(showHomeLogistics)
}

const HOME_LOGISTICS_POLICIES={
 lean:{name:SOSText("hall_business_finance_logistics.showHomeEmergencyProcurement.004"),target:48,cost:38,interval:8,desc:SOSText("hall_business_finance_logistics.showHomeEmergencyProcurement.005")},
 balanced:{name:SOSText("hall_business_finance_logistics.showHomeEmergencyProcurement.006"),target:68,cost:55,interval:7,desc:SOSText("hall_business_finance_logistics.showHomeEmergencyProcurement.007")},
 comfortable:{name:SOSText("hall_business_finance_logistics.showHomeEmergencyProcurement.008"),target:86,cost:78,interval:6,desc:SOSText("hall_business_finance_logistics.showHomeEmergencyProcurement.009")}
};
function homeLogisticsPolicy(){ensureHomeBase();return HOME_LOGISTICS_POLICIES[state.world.homeBase.logistics.policy]||HOME_LOGISTICS_POLICIES.balanced}
function homeLogisticsReport(text,tone='info'){const L=state.world.homeBase.logistics;L.reports.push({day:state.world.day,text,tone});L.reports=L.reports.slice(-24)}
function homeSupplyAverage(){const s=state.world.homeBase.logistics.supplies;return Math.round(Object.values(s).reduce((a,b)=>a+b,0)/5)}
function homeSupplyLabel(v){return v>=80?'Well stocked':v>=60?'Adequate':v>=40?'Tight':v>=20?'Low':SOSText("hall_business_finance_logistics.homeSupplyLabel.001")}
function homeSupplyNeed(){const L=state.world.homeBase.logistics,p=homeLogisticsPolicy(),vals=Object.values(L.supplies);return Math.min(...vals)<p.target-12||homeSupplyAverage()<p.target-8}
function homeApplySupplyDelivery(amount=24){const L=state.world.homeBase.logistics,p=homeLogisticsPolicy();for(const k of Object.keys(L.supplies))L.supplies[k]=Math.min(100,L.supplies[k]+amount);state.world.homeBase.hospitality.refreshments=Math.min(18,(state.world.homeBase.hospitality.refreshments||0)+Math.max(3,Math.round(amount/5)));L.lastSupplyDay=state.world.day;L.nextOrderDay=state.world.day+p.interval;L.status=SOSText("hall_business_finance_logistics.homeApplySupplyDelivery.001")}
function homeCreateSupplyShipment(cost,reason=SOSText("hall_business_finance_logistics.homeCreateSupplyShipment.001")){
 const h=state.world.homeBase,L=h.logistics;if(L.shipmentId)return null;const origins=['river','stonebridge','northgate'].filter(id=>id!=='shantium'),origin=pick(origins),p=spawnWorldParty('merchant','shantium');
 p.name=SOSText("hall_business_finance_logistics.homeCreateSupplyShipment.002");p.origin=origin;p.location=origin;p.destination='shantium';p.region='shantium';p.travelTotal=p.travelLeft=Math.max(1,worldTravelDays(origin,'shantium'));p.logisticsShipment=true;p.guardianCaravan=true;p.guardianAffiliation=SOSText("hall_business_finance_logistics.homeCreateSupplyShipment.003");p.lawfulCargo=true;p.logisticsReason=reason;p.attitude='friendly';ensureGuardianHallPartyRecognition(p);L.shipmentId=p.id;L.status=SOSText("hall_business_finance_logistics.homeCreateSupplyShipment.004",worldLocation(origin).name);homeLogisticsReport(SOSText("hall_business_finance_logistics.homeCreateSupplyShipment.005",p.name,worldLocation(origin).name,p.travelLeft,p.travelLeft===1?'':'s'));return p
}
function completeHomeLogisticsShipment(p){if(!p?.logisticsShipment||!state.world?.homeBase)return;ensureHomeBase();const L=state.world.homeBase.logistics;if(L.shipmentId!==p.id)return;homeApplySupplyDelivery(28+homeUpgradeLevel(SOSText("hall_business_finance_logistics.completeHomeLogisticsShipment.001"))*6);L.shipmentId=null;L.disruption=null;p.logisticsShipment=false;homeLogisticsReport(SOSText("hall_business_finance_logistics.completeHomeLogisticsShipment.002",p.name),'good');recordWorldHistory(SOSText("hall_business_finance_logistics.completeHomeLogisticsShipment.003"),'good','home')}
function homeSetLogisticsPolicy(policy){ensureHomeBase();if(!HOME_LOGISTICS_POLICIES[policy])return showHomeLogistics();const L=state.world.homeBase.logistics;L.policy=policy;L.nextOrderDay=Math.min(L.nextOrderDay||state.world.day,state.world.day+2);homeLogisticsReport(SOSText("hall_business_finance_logistics.homeSetLogisticsPolicy.001",L.master?.name||'Hall staff',HOME_LOGISTICS_POLICIES[policy].name));save();showHomeLogistics()}
function homeToggleAutoProcure(){ensureHomeBase();const L=state.world.homeBase.logistics;L.autoProcure=!L.autoProcure;L.standingOrder=L.autoProcure;homeLogisticsReport(SOSText("hall_business_finance_logistics.homeToggleAutoProcure.001",L.autoProcure?'enabled':'paused'));save();showHomeLogistics()}
function showLogisticsHireCandidates(){modalRouteEnter(SOSText("hall_business_finance_logistics.showLogisticsHireCandidates.001"),Array.from(arguments));ensureHomeBase();const L=state.world.homeBase.logistics,current=L.master;overlay(SOSText("hall_business_finance_logistics.showLogisticsHireCandidates.002",current?'Replace Logistics Master':'Hire a Logistics Master',current?`Current Logistics Master: <b>${esc(current.name)}</b>. Choose another candidate only if the Guardian wants to replace them.`:'Choose a named senior employee to manage Hall supplies, contracts, and routine procurement.',LOGISTICS_MASTER_CANDIDATES.map(c=>{const same=current&&(current.candidateId===c.id||current.name===c.name);return `<div class="card"><h3>${esc(c.name)}</h3><div class="stat-row"><span>Competence</span><b>${c.competence}/10</b></div><div class="stat-row"><span>Salary</span><b>${c.salary} gold / 14 days</b></div><p>${esc(c.strength)}</p><button data-hirelogistics="${c.id}" ${same?'disabled':''}>${same?'Current Logistics Master':current?'Replace With This Candidate':'Hire'}</button></div>`}).join('')),true);document.querySelectorAll('[data-hirelogistics]').forEach(b=>b.onclick=()=>current?confirmReplaceLogisticsMaster(b.dataset.hirelogistics):hireLogisticsMaster(b.dataset.hirelogistics));$('#hireLogisticsBack').onclick=()=>guardianHallRouteBack(showHomeLogistics)}
function confirmReplaceLogisticsMaster(candidateId){ensureHomeBase();const L=state.world.homeBase.logistics,c=LOGISTICS_MASTER_CANDIDATES.find(x=>x.id===candidateId);if(!c)return showHomeLogistics();overlay(SOSText("hall_business_finance_logistics.confirmReplaceLogisticsMaster.001",esc(L.master?.name||'the current Logistics Master'),esc(c.name)),true);$('#confirmLogisticsReplace').onclick=()=>replaceLogisticsMaster(candidateId);$('#cancelLogisticsReplace').onclick=showLogisticsHireCandidates}
function replaceLogisticsMaster(candidateId){ensureHomeBase();const h=state.world.homeBase,L=h.logistics,c=LOGISTICS_MASTER_CANDIDATES.find(x=>x.id===candidateId);if(!c)return showHomeLogistics();const old=L.master?.name||SOSText("hall_business_finance_logistics.replaceLogisticsMaster.001");L.master={id:'staff_'+uid(),candidateId:c.id,name:c.name,competence:c.competence,salary:c.salary,strength:c.strength,hiredDay:state.world.day};L.lastSalaryDay=state.world.day;L.status=SOSText("hall_business_finance_logistics.replaceLogisticsMaster.002",c.name);homeLogisticsReport(SOSText("hall_business_finance_logistics.replaceLogisticsMaster.003",c.name,old),'info');recordWorldHistory(SOSText("hall_business_finance_logistics.replaceLogisticsMaster.004",c.name,old),'info','home');save();showHomeLogistics()}
function showHomeLogisticsReports(){modalRouteEnter(SOSText("hall_business_finance_logistics.showHomeLogisticsReports.001"),Array.from(arguments));guardianHallRouteEnter('showHomeLogisticsReports',[]);ensureHomeBase();const r=state.world.homeBase.logistics.reports.slice().reverse();overlay(SOSText("hall_business_finance_logistics.showHomeLogisticsReports.002",r.map(x=>`<div class="card compact"><b>Day ${x.day}</b><br>${esc(x.text)}</div>`).join('')||'<p class="muted">No logistics reports have been filed yet.</p>'),true);$('#logisticsReportsBack').onclick=()=>guardianHallRouteBack(showHomeLogistics)}
function resolveHomeLogisticsDisruption(action){ensureHomeBase();const h=state.world.homeBase,L=h.logistics,d=L.disruption;if(!d)return showHomeLogistics();if(action==='local'){const cost=65;if(L.budget<cost)return actionResult(SOSText("hall_business_finance_logistics.resolveHomeLogisticsDisruption.001"),SOSText("hall_business_finance_logistics.resolveHomeLogisticsDisruption.002",cost),'bad',showHomeLogistics);homeFinanceDebit(cost,SOSText("hall_business_finance_logistics.resolveHomeLogisticsDisruption.003"),SOSText("hall_business_finance_logistics.resolveHomeLogisticsDisruption.004"));homeApplySupplyDelivery(22);L.disruption=null;L.shipmentId=null;L.status=SOSText("hall_business_finance_logistics.resolveHomeLogisticsDisruption.005");homeLogisticsReport(SOSText("hall_business_finance_logistics.resolveHomeLogisticsDisruption.006",L.master.name),'good')}
 if(action==='replacement'){const cost=50;if(L.budget<cost)return actionResult(SOSText("hall_business_finance_logistics.resolveHomeLogisticsDisruption.007"),SOSText("hall_business_finance_logistics.resolveHomeLogisticsDisruption.008",cost),'bad',showHomeLogistics);homeFinanceDebit(cost,SOSText("hall_business_finance_logistics.resolveHomeLogisticsDisruption.009"),SOSText("hall_business_finance_logistics.resolveHomeLogisticsDisruption.010"));L.shipmentId=null;homeCreateSupplyShipment(cost,SOSText("hall_business_finance_logistics.resolveHomeLogisticsDisruption.011"));L.disruption=null;homeLogisticsReport(SOSText("hall_business_finance_logistics.resolveHomeLogisticsDisruption.012"),'info')}
 if(action==='reduce'){L.disruption=null;L.shipmentId=null;L.nextOrderDay=state.world.day+3;L.status=SOSText("hall_business_finance_logistics.resolveHomeLogisticsDisruption.013");for(const k of Object.keys(L.supplies))L.supplies[k]=Math.min(100,L.supplies[k]+5);homeLogisticsReport(SOSText("hall_business_finance_logistics.resolveHomeLogisticsDisruption.014"),'info')}
 save();showHomeLogistics()}
function hireLogisticsMaster(candidateId){ensureHomeBase();const h=state.world.homeBase;if(h.logistics.master)return showLogisticsHireCandidates();const c=LOGISTICS_MASTER_CANDIDATES.find(x=>x.id===candidateId)||LOGISTICS_MASTER_CANDIDATES[0];h.logistics.master={id:'staff_'+uid(),candidateId:c.id,name:c.name,competence:c.competence,salary:c.salary,strength:c.strength,hiredDay:state.world.day};h.logistics.budget=Math.max(h.logistics.budget,180);h.logistics.lastSalaryDay=state.world.day;h.logistics.status=SOSText("hall_business_finance_logistics.hireLogisticsMaster.001");homeLogisticsReport(SOSText("hall_business_finance_logistics.hireLogisticsMaster.002",c.name,h.logistics.budget),'good');recordWorldHistory(SOSText("hall_business_finance_logistics.hireLogisticsMaster.003",c.name),'good','home');save();showHomeLogistics()}
function fundHomeLogistics(amount){homeFinanceTransfer(amount)}
const HOME_TRADE_PROCUREMENT_PRIORITIES={
 economy:{name:'Economy',rank:0,hire:35,priceTolerance:1.00,desc:'Wait for economical sourcing when possible. Lowest queue priority.'},
 normal:{name:'Normal',rank:1,hire:55,priceTolerance:1.12,desc:'Routine Hall procurement with balanced price and timing.'},
 high:{name:'High',rank:2,hire:85,priceTolerance:1.30,desc:'Move ahead of routine work and accept higher sourcing costs.'},
 ultra:{name:'Ultra',rank:3,hire:125,priceTolerance:1.60,desc:'First available caravan. Cost efficiency is secondary to getting the goods moving.'},
 // Legacy aliases retained for old saves/orders.
 balanced:{name:'Normal',rank:1,hire:55,priceTolerance:1.12,desc:'Routine Hall procurement with balanced price and timing.'},
 security:{name:'High',rank:2,hire:85,priceTolerance:1.30,desc:'Legacy high-priority procurement.'}
};
const HOME_TRADE_PROCUREMENT_SECURITY={
 auto:{name:"Logistics Master's Judgment",guard:0,costBase:0,risk:1,desc:'Security is selected from priority, route length, regional danger, and recent conditions.'},
 standard:{name:'Standard',guard:0,costBase:20,risk:1.00,desc:'Normal caravan guards for routine procurement.'},
 reinforced:{name:'Reinforced',guard:2,costBase:55,risk:.78,desc:'Additional guards for valuable cargo or uncertain roads.'},
 high:{name:'High Security',guard:5,costBase:110,risk:.52,desc:'A strong professional escort for dangerous or important shipments.'},
 maximum:{name:'Maximum Security',guard:8,costBase:190,risk:.30,desc:'The Hall commits its strongest practical escort to a critical shipment.'}
};
const HOME_TRADE_GOOD_GROUPS=[
 ['Essential & Manufactured',['food','medicine','cloth','tools']],
 ['Raw Materials',['timber','iron','stone','hides']],
 ['Regional Goods',['salt','dye','livestock']],
 ['High-Value Goods',['luxury','spirits']]
];
function homeNormalizeProcPriority(id){return id==='balanced'?'normal':id==='security'?'high':(HOME_TRADE_PROCUREMENT_PRIORITIES[id]?id:'normal')}
function homeTradeProcurementOrders(){ensureHomeBase();const L=state.world.homeBase.logistics;if(!Array.isArray(L.tradeProcurementOrders))L.tradeProcurementOrders=[];return L.tradeProcurementOrders}
function homeTradeStandingOrders(){ensureHomeBase();const L=state.world.homeBase.logistics;if(!Array.isArray(L.tradeStandingOrders))L.tradeStandingOrders=[];return L.tradeStandingOrders}
function homeTradeProcurementCapacity(){ensureHomeBase();const c=state.world.homeBase.logistics.master?.competence||0;return c>=9?5:c>=7?4:c>=5?3:c>=3?2:1}
function homeTradeSupervisedCaravanUsed(){const procurement=homeTradeProcurementActive().length,commercial=(typeof homeCommercialCaravanActive==='function'?homeCommercialCaravanActive().length:0);return procurement+commercial}
function homeTradeSupervisedCaravanFree(){return Math.max(0,homeTradeProcurementCapacity()-homeTradeSupervisedCaravanUsed())}
function homeTradeStandingCapacity(){ensureHomeBase();const c=state.world.homeBase.logistics.master?.competence||0;return Math.max(3,Math.min(8,3+Math.floor(c/2)))}
function homeTradeProcurementActive(){return homeTradeProcurementOrders().filter(o=>['outbound','sourcing','returning','returning_partial','awaiting_storage'].includes(o.status))}
function homeProcurementLines(order){
 if(Array.isArray(order?.lines)&&order.lines.length)return order.lines;
 if(order?.goodId)return [{goodId:order.goodId,qty:order.qty||0,acquired:order.acquired||0,standingOrderId:order.standingOrderId||null}];
 return []
}
function homeProcurementLineTotal(order,key='qty'){return homeProcurementLines(order).reduce((n,x)=>n+(Number(x[key])||0),0)}
function homeTradeProcurementSources(goodId){
 const unlocked=state.world.unlockedRegions||['shantium'],good=worldGood(goodId);if(!good)return[];
 return unlocked.flatMap(r=>regionalSettlements(r)).filter(l=>l.id!=='shantium'&&!l.hidden).map(l=>({id:l.id,stock:tradeStock(l.id,goodId),price:tradePrice(l.id,goodId),role:tradeGoodRole(l.id,goodId),days:tradeRouteDistanceDays('shantium',l.id)})).filter(x=>x.stock>0).sort((a,b)=>(b.role==='source')-(a.role==='source')||a.price-b.price||a.days-b.days)
}
function homeProcurementRegionalDanger(sourceId){
 const region=locationRegion(sourceId);const hostile=(state.world.parties||[]).filter(p=>p.region===region&&['hostile','enemy'].includes(String(p.attitude||p.disposition||'').toLowerCase())).length;
 return Math.min(3,Math.floor(hostile/3))
}
function homeAutoProcurementSecurity(priority,sourceId){
 priority=homeNormalizeProcPriority(priority);const days=Math.max(1,tradeRouteDistanceDays('shantium',sourceId)),danger=homeProcurementRegionalDanger(sourceId);
 if(priority==='ultra')return (days>=8||danger>=2)?'maximum':'high';
 if(priority==='high')return (days>=8||danger>=2)?'high':'reinforced';
 if(priority==='normal')return (days>=10||danger>=2)?'reinforced':'standard';
 return danger>=2?'reinforced':'standard'
}
function homeTradeProcurementQuote(goodId,qty,priority='normal',security='standard',sourceId=null){
 priority=homeNormalizeProcPriority(priority);const pr=HOME_TRADE_PROCUREMENT_PRIORITIES[priority]||HOME_TRADE_PROCUREMENT_PRIORITIES.normal,sources=homeTradeProcurementSources(goodId),q=Math.max(1,Math.min(30,Math.round(Number(qty)||1))),best=(sourceId&&sources.find(x=>x.id===sourceId))||sources[0],unit=best?.price||worldGood(goodId)?.base||30,days=best?.days||4;
 const secId=security==='auto'?homeAutoProcurementSecurity(priority,best?.id||'shantium'):security,sec=HOME_TRADE_PROCUREMENT_SECURITY[secId]||HOME_TRADE_PROCUREMENT_SECURITY.standard;
 const securityCost=Math.round(sec.costBase+days*(8+sec.guard*2)),cost=Math.max(30,Math.round(unit*q+pr.hire+days*4+securityCost));
 return {qty:q,priority,security:secId,source:best,cost,unit,days,securityCost}
}
function homeProcurementRouteEfficiency(){
 ensureHomeBase();const c=Math.max(0,Math.min(10,state.world.homeBase.logistics.master?.competence||0));
 return Math.min(.15,c*.015)
}
function homeProcurementSetRoute(p,dest){
 p.origin=p.location;p.destination=dest;p.region=locationRegion(p.location);p.crossRegion=locationRegion(p.location)!==locationRegion(dest);p.tradeRoute=p.crossRegion?connectionRouteName(p.location,dest):null;
 const base=Math.max(1,tradeRouteDistanceDays(p.location,dest)),eff=p?.tradeProcurementCaravan?homeProcurementRouteEfficiency():0;
 p.procurementBaseTravelDays=base;p.procurementRouteEfficiency=eff;
 p.travelTotal=p.travelLeft=Math.max(1,Math.ceil(base*(1-eff)))
}
function homeProcurementOrderPrimaryGood(order){return homeProcurementLines(order)[0]?.goodId||order.goodId}
function homeProcurementOrderLabel(order){const lines=homeProcurementLines(order);if(lines.length<=1)return worldGood(lines[0]?.goodId)?.name||'Trade Goods';return `${worldGood(lines[0].goodId)?.name||'Goods'} +${lines.length-1} more`}
function homeDispatchProcurementLines(lines,priority='normal',security='standard',sourceId=null,standing=false){
 ensureHomeBase();const L=state.world.homeBase.logistics;if(!L.master||!lines?.length)return null;
 if(homeTradeSupervisedCaravanUsed()>=homeTradeProcurementCapacity())return null;
 priority=homeNormalizeProcPriority(priority);const valid=lines.map(x=>({goodId:x.goodId,qty:Math.max(1,Math.min(30,Math.round(Number(x.qty)||1))),acquired:0,standingOrderId:x.standingOrderId||null})).filter(x=>worldGood(x.goodId));
 if(!valid.length)return null;
 const primary=valid[0],sources=homeTradeProcurementSources(primary.goodId);const source=(sourceId&&sources.find(x=>x.id===sourceId))||sources[0];if(!source)return null;
 let selectedSecurity=security==='auto'?homeAutoProcurementSecurity(priority,source.id):security;if(!HOME_TRADE_PROCUREMENT_SECURITY[selectedSecurity])selectedSecurity='standard';
 const pr=HOME_TRADE_PROCUREMENT_PRIORITIES[priority],sec=HOME_TRADE_PROCUREMENT_SECURITY[selectedSecurity],marketEstimate=valid.reduce((n,l)=>n+(tradePrice(source.id,l.goodId)||worldGood(l.goodId)?.base||30)*l.qty,0),days=tradeRouteDistanceDays('shantium',source.id),securityCost=Math.round(sec.costBase+days*(8+sec.guard*2)),cost=Math.max(30,Math.round(marketEstimate+pr.hire+days*4+securityCost));
 if(L.budget<cost)return null;
 if(!homeFinanceDebit(cost,'Trade goods procurement',`${L.master.name} charters a ${pr.name.toLowerCase()} procurement caravan (${sec.name}) for ${valid.map(l=>`${l.qty} ${worldGood(l.goodId).name}`).join(', ')}.`))return null;
 const order={id:'proc_'+uid(),lines:valid,goodId:primary.goodId,qty:primary.qty,acquired:0,status:'outbound',priority,security:selectedSecurity,createdDay:state.world.day,cost,visited:[],sourcePlan:[source.id],partyId:null,lastReportDay:state.world.day,standing:!!standing};
 const caravan=spawnWorldParty('merchant','shantium');caravan.name=`Guardian Hall Procurement Caravan — ${homeProcurementOrderLabel(order)}`;caravan.location='shantium';caravan.origin='shantium';caravan.procurementCaravan=true;caravan.tradeProcurementCaravan=true;caravan.procurementOrderId=order.id;caravan.guardianCaravan=true;caravan.guardianAffiliation='Guardian Hall procurement';caravan.lawfulCargo=true;caravan.attitude='friendly';caravan.manifest={};caravan.cargo=0;caravan.procurementPriority=priority;caravan.procurementSecurity=selectedSecurity;caravan.procurementSecurityRisk=sec.risk;caravan.combatLevel=Math.max(caravan.combatLevel||1,state.level-1+sec.guard);caravan.escortStrength=(caravan.escortStrength||0)+sec.guard;ensureGuardianHallPartyRecognition(caravan);syncTravelerRecord(caravan);homeProcurementSetRoute(caravan,source.id);order.partyId=caravan.id;L.tradeProcurementOrders.push(order);L.tradeProcurementOrders=L.tradeProcurementOrders.slice(-40);
 for(const l of valid){const so=homeTradeStandingOrders().find(x=>x.id===l.standingOrderId);if(so)so.lastDispatchDay=state.world.day}
 homeLogisticsReport(`${L.master.name} dispatches ${caravan.name} toward ${worldLocation(source.id).name}. Priority: ${pr.name}. Security: ${sec.name}.`,'info');recordWorldHistory(`${caravan.name} departs Guardian Hall on a trade procurement mission.`,'info','home');save();return {order,caravan}
}
function startHomeTradeProcurement(goodId,qty,priority='normal',security='standard',sourceId=null){
 const g=worldGood(goodId);if(!g)return showHomeTradeProcurement();
 const result=homeDispatchProcurementLines([{goodId,qty}],priority,security,sourceId,false);
 if(!result){const L=state.world.homeBase.logistics;if(homeTradeSupervisedCaravanUsed()>=homeTradeProcurementCapacity())return actionResult('Procurement Capacity Reached',`${L.master?.name||'The Logistics Master'} is already supervising all ${homeTradeProcurementCapacity()} caravan slots across Hall procurement and commercial ventures.`,'info',()=>showHomeTradeProcurement('active'));return actionResult('Procurement Could Not Be Dispatched','No acceptable source, caravan capacity, or Hall budget is currently available for this order.','bad',()=>showHomeTradeProcurement('goods'))}
 actionResult('Procurement Caravan Dispatched',`${result.caravan.name} is heading to ${worldLocation(result.caravan.destination).name}. Priority: ${HOME_TRADE_PROCUREMENT_PRIORITIES[result.order.priority].name}. Security: ${HOME_TRADE_PROCUREMENT_SECURITY[result.order.security].name}.`,'good',()=>showHomeTradeProcurement('active'))
}
function homeTradeProcurementNextSource(order){
 const lines=homeProcurementLines(order).filter(l=>(l.acquired||0)<(l.qty||0));
 const candidates=[];for(const l of lines)for(const s of homeTradeProcurementSources(l.goodId))if(!order.visited.includes(s.id))candidates.push(s);
 candidates.sort((a,b)=>(b.role==='source')-(a.role==='source')||a.days-b.days||a.price-b.price);return candidates[0]?.id||null
}
function resolveHomeTradeProcurementArrival(p){
 if(!p?.tradeProcurementCaravan)return false;ensureHomeBase();const L=state.world.homeBase.logistics,order=homeTradeProcurementOrders().find(o=>o.id===p.procurementOrderId);if(!order){p.tradeProcurementCaravan=false;p.procurementCaravan=false;return false}
 const lines=homeProcurementLines(order);
 if(p.location==='shantium'&&['returning','returning_partial','awaiting_storage'].includes(order.status)){
   const total=homeProcurementLineTotal(order,'acquired');if(total<=0){order.status='failed';order.completedDay=state.world.day;order.partyId=null;p.tradeProcurementCaravan=false;p.procurementCaravan=false;removeWorldParty(p.id);L.procurementAlert=`${p.name} returned without securing any requested trade goods.`;homeLogisticsReport(L.procurementAlert,'bad');return true}
   for(const line of lines){const qty=line.acquired||0;if(!qty)continue;if(!homeStoreTradeGood(line.goodId,qty)){order.status='awaiting_storage';p.travelLeft=0;p.destination='shantium';L.procurementAlert=`${p.name} is waiting at Guardian Hall because Stores have no free stack for ${worldGood(line.goodId)?.name||line.goodId}.`;homeLogisticsReport(L.procurementAlert,'bad');return true}}
   const complete=lines.every(l=>(l.acquired||0)>=(l.qty||0));order.status=complete?'complete':'partial';order.completedDay=state.world.day;order.partyId=null;p.tradeProcurementCaravan=false;p.procurementCaravan=false;removeWorldParty(p.id);L.procurementAlert=null;
   for(const line of lines){const so=homeTradeStandingOrders().find(x=>x.id===line.standingOrderId);if(so){so.totalAcquired=(so.totalAcquired||0)+(line.acquired||0);so.lastCompletedDay=state.world.day}}
   homeLogisticsReport(`${p.name} returns with ${lines.filter(l=>l.acquired).map(l=>`${l.acquired} ${worldGood(l.goodId)?.name||l.goodId}`).join(', ')}; cargo is placed in Hall Stores.`,complete?'good':'info');recordWorldHistory(`${p.name} returns to Guardian Hall with procured trade goods.`,'good','home');return true
 }
 order.status='sourcing';if(!order.visited.includes(p.location))order.visited.push(p.location);const competence=L.master?.competence||3,cargoCap=Math.max(18,22+competence*2),room=Math.max(0,cargoCap-homeProcurementLineTotal(order,'acquired'));
 let remainingRoom=room;for(const line of lines){if(remainingRoom<=0)break;const need=Math.max(0,(line.qty||0)-(line.acquired||0)),stock=tradeStock(p.location,line.goodId);if(!need||!stock)continue;const take=Math.min(need,stock,remainingRoom,Math.max(3,4+competence));if(take>0){changeTradeStock(p.location,line.goodId,-take);line.acquired=(line.acquired||0)+take;if(order.goodId===line.goodId)order.acquired=line.acquired;p.manifest[line.goodId]=(p.manifest[line.goodId]||0)+take;p.cargo=manifestLots(p.manifest);remainingRoom-=take;homeLogisticsReport(`${p.name} secures ${take} ${worldGood(line.goodId)?.name||line.goodId} at ${worldLocation(p.location).name}.`,'good')}}
 if(lines.every(l=>(l.acquired||0)>=(l.qty||0))||homeProcurementLineTotal(order,'acquired')>=cargoCap){order.status=lines.every(l=>(l.acquired||0)>=(l.qty||0))?'returning':'returning_partial';homeProcurementSetRoute(p,'shantium');return true}
 const next=homeTradeProcurementNextSource(order);if(next){homeProcurementSetRoute(p,next);homeLogisticsReport(`${p.name} continues to ${worldLocation(next).name} seeking remaining goods.`,'info');return true}
 order.status='returning_partial';homeProcurementSetRoute(p,'shantium');homeLogisticsReport(`${p.name} exhausted known sources and is returning with a partial load.`,'info');return true
}
function homeTradeProcurementLost(p,reason='The caravan was lost on the road.'){
 if(!p?.tradeProcurementCaravan)return;ensureHomeBase();const L=state.world.homeBase.logistics,order=homeTradeProcurementOrders().find(o=>o.id===p.procurementOrderId);if(!order)return;order.status='lost';order.completedDay=state.world.day;order.partyId=null;order.lossReason=reason;L.procurementAlert=`${p.name} was lost: ${reason}`;homeLogisticsReport(L.procurementAlert,'bad');recordWorldHistory(L.procurementAlert,'bad','home')
}
function homeTradeInboundQty(goodId){
 return homeTradeProcurementActive().reduce((n,o)=>n+homeProcurementLines(o).filter(l=>l.goodId===goodId).reduce((a,l)=>a+Math.max(0,(l.qty||0)-(l.acquired||0))+(l.acquired||0),0),0)
}
function homeStandingOrderNeed(o){
 if(!o||o.paused)return 0;const hall=state.world.homeBase.tradeGoods[o.goodId]||0,inbound=homeTradeInboundQty(o.goodId),projected=hall+inbound,src=homeTradeProcurementSources(o.goodId)[0];
 if(o.mode==='maintain'){if(projected>=o.minimum)return 0;return Math.max(0,(o.target||o.minimum)-projected)}
 if(o.mode==='regular'){if(state.world.day<(o.lastDispatchDay||o.createdDay||0)+(o.interval||14))return 0;return Math.max(1,o.qty||10)}
 if(o.mode==='opportunistic'){if(!src||src.price>(o.maxUnitPrice||9999)||inbound>0)return 0;return Math.max(1,o.qty||10)}
 if(o.mode==='limited'){const remain=Math.max(0,(o.totalTarget||0)-(o.totalAcquired||0)-inbound);return Math.min(remain,Math.max(1,o.qty||10))}
 return 0
}
function homeStandingOrderStatus(o){
 if(o.paused)return 'PAUSED';const need=homeStandingOrderNeed(o),inbound=homeTradeInboundQty(o.goodId),src=homeTradeProcurementSources(o.goodId)[0];
 if(inbound>0&&!need)return 'COVERED BY INBOUND SHIPMENT';if(!need)return o.mode==='opportunistic'&&src&&src.price>(o.maxUnitPrice||9999)?'WAITING — PRICE ABOVE LIMIT':'SATISFIED';
 if(homeTradeSupervisedCaravanUsed()>=homeTradeProcurementCapacity())return 'WAITING — CARAVAN CAPACITY';if(!src)return 'WAITING — NO VIABLE SOURCE';
 const sec=o.security==='auto'?homeAutoProcurementSecurity(o.priority,src.id):o.security,q=homeTradeProcurementQuote(o.goodId,need,o.priority,sec,src.id);if(state.world.homeBase.logistics.budget<Math.min(q.cost,o.maxContract||999999))return 'WAITING — HALL BUDGET';
 if(q.cost>(o.maxContract||999999)||q.unit>(o.maxUnitPrice||999999))return 'WAITING — SPENDING LIMIT';
 return 'READY FOR DISPATCH'
}

function homeTradeProcurementPlans(){
 ensureHomeBase();const L=state.world.homeBase.logistics;if(!Array.isArray(L.tradeProcurementPlans))L.tradeProcurementPlans=[];return L.tradeProcurementPlans
}
function homeTradeProcurementPlanActive(){return homeTradeProcurementPlans().filter(p=>['queued','dispatching'].includes(p.status))}
function homePlanRemainingLines(plan){
 return (plan?.lines||[]).map(l=>({...l,remaining:Math.max(0,(l.qty||0)-(l.dispatched||0))})).filter(l=>l.remaining>0)
}
function homePlanSourceCandidates(goodId,competence){
 const sources=homeTradeProcurementSources(goodId),depth=competence>=8?6:competence>=5?4:competence>=3?2:1;
 return sources.slice(0,depth)
}
function homePlanSourceScore(source,line,allLines,competence){
 const good=worldGood(line.goodId),base=Math.max(1,good?.base||30),priceRatio=(source.price||base)/base,days=source.days||10;
 let score=priceRatio*12+days*.7-(source.role==='source'?3:0);
 if(competence>=4){
   let shared=0;
   for(const other of allLines){
     if(other.goodId===line.goodId)continue;
     const s=homeTradeProcurementSources(other.goodId).find(x=>x.id===source.id&&x.stock>0);
     if(s)shared++
   }
   score-=shared*(competence>=8?3.8:competence>=6?2.8:1.7)
 }
 return score
}
function homePlanAssignSources(plan){
 ensureHomeBase();const c=Math.max(0,Math.min(10,state.world.homeBase.logistics.master?.competence||0)),remaining=homePlanRemainingLines(plan),assignments=[];
 for(const line of remaining){
   const candidates=homePlanSourceCandidates(line.goodId,c);
   if(!candidates.length){assignments.push({...line,sourceId:null});continue}
   let best=candidates[0],bestScore=Infinity;
   for(const s of candidates){const score=homePlanSourceScore(s,line,remaining,c);if(score<bestScore){bestScore=score;best=s}}
   assignments.push({...line,sourceId:best.id})
 }
 return assignments
}
function homePlanBuildCaravanGroups(plan){
 ensureHomeBase();const c=Math.max(0,Math.min(10,state.world.homeBase.logistics.master?.competence||0)),assigned=homePlanAssignSources(plan),groups=new Map();
 for(const line of assigned){
   if(!line.sourceId)continue;
   if(!groups.has(line.sourceId))groups.set(line.sourceId,[]);
   groups.get(line.sourceId).push(line)
 }
 // Higher competence can move a line to a shared source if that saves a caravan and stays reasonably viable.
 if(c>=6&&groups.size>1){
   const sourceIds=[...groups.keys()];
   for(const fromId of [...sourceIds]){
     const from=groups.get(fromId);if(!from?.length)continue;
     for(const line of [...from]){
       let bestTarget=null,bestPenalty=999;
       const own=homeTradeProcurementSources(line.goodId).find(x=>x.id===fromId);
       for(const targetId of sourceIds){
         if(targetId===fromId)continue;
         const alt=homeTradeProcurementSources(line.goodId).find(x=>x.id===targetId&&x.stock>0);
         if(!alt)continue;
         const penalty=(alt.price-(own?.price||alt.price))+(alt.days-(own?.days||alt.days))*2;
         const tolerance=c>=9?18:c>=8?13:8;
         if(penalty<=tolerance&&penalty<bestPenalty){bestPenalty=penalty;bestTarget=targetId}
       }
       if(bestTarget&&from.length===1){
         groups.get(bestTarget).push(line);groups.set(fromId,[]);
       }
     }
   }
 }
 return [...groups.entries()].filter(([,lines])=>lines.length).map(([sourceId,lines])=>({sourceId,lines}))
}
function homeCreateMixedProcurementPlan(lines,priority='normal',security='auto'){
 ensureHomeBase();const L=state.world.homeBase.logistics;
 const clean=(lines||[]).map(x=>({goodId:x.goodId,qty:Math.max(1,Math.min(90,Math.round(Number(x.qty)||0))),dispatched:0,acquired:0})).filter(x=>worldGood(x.goodId)&&x.qty>0);
 if(clean.length<2)return actionResult('Choose Several Goods','Select at least two trade goods for a mixed procurement plan.','info',showHomeMixedProcurementPlanner);
 const plan={id:'mixproc_'+uid(),createdDay:state.world.day,status:'queued',priority:homeNormalizeProcPriority(priority),security:security||'auto',lines:clean,lastDispatchDay:null,completedDay:null};
 L.tradeProcurementPlans.push(plan);L.tradeProcurementPlans=L.tradeProcurementPlans.slice(-20);
 homeLogisticsReport(`${L.master.name} receives a mixed procurement plan for ${clean.map(l=>`${l.qty} ${worldGood(l.goodId).name}`).join(', ')}.`,'info');
 homeProcessMixedProcurementPlans(true);save();
 actionResult('Procurement Plan Delegated',`${L.master.name} will divide the requested goods among available caravans and routes. Any portion that cannot be dispatched immediately remains queued for later capacity.`,'good',()=>showHomeTradeProcurement('active'))
}
function homeProcessMixedProcurementPlans(force=false){
 if(!isOpenWorld())return;ensureHomeBase();const L=state.world.homeBase.logistics;if(!L.master)return;
 if(!force&&L.lastTradePlanTickDay===state.world.day)return;L.lastTradePlanTickDay=state.world.day;
 let slots=homeTradeProcurementCapacity()-homeTradeProcurementActive().length;if(slots<=0)return;
 const plans=homeTradeProcurementPlans().filter(p=>['queued','dispatching'].includes(p.status)).sort((a,b)=>(HOME_TRADE_PROCUREMENT_PRIORITIES[homeNormalizeProcPriority(b.priority)].rank-HOME_TRADE_PROCUREMENT_PRIORITIES[homeNormalizeProcPriority(a.priority)].rank)||a.createdDay-b.createdDay);
 for(const plan of plans){
   if(slots<=0)break;
   const groups=homePlanBuildCaravanGroups(plan);
   if(!groups.length){plan.status='waiting_source';continue}
   plan.status='dispatching';
   for(const group of groups){
     if(slots<=0)break;
     const capacity=30,lines=[];let room=capacity;
     const ordered=[...group.lines].sort((a,b)=>b.remaining-a.remaining);
     for(const line of ordered){
       if(room<=0)break;const qty=Math.min(room,line.remaining);if(qty<=0)continue;
       lines.push({goodId:line.goodId,qty,planId:plan.id});room-=qty
     }
     if(!lines.length)continue;
     const result=homeDispatchProcurementLines(lines,plan.priority,plan.security||'auto',group.sourceId,false);
     if(!result)continue;
     result.order.mixedPlanId=plan.id;result.order.mixedPlan=true;
     for(const shipped of lines){
       const row=plan.lines.find(x=>x.goodId===shipped.goodId);if(row)row.dispatched=(row.dispatched||0)+shipped.qty
     }
     slots--;plan.lastDispatchDay=state.world.day;
     homeLogisticsReport(`${L.master.name} assigns ${result.caravan.name} to part of the mixed procurement plan via ${worldLocation(group.sourceId).name}.`,'info')
   }
   if(homePlanRemainingLines(plan).length===0)plan.status='in_flight';else plan.status='queued'
 }
}
function homeReconcileMixedProcurementPlans(){
 for(const plan of homeTradeProcurementPlans()){
   if(['complete','cancelled'].includes(plan.status))continue;
   for(const order of homeTradeProcurementOrders().filter(o=>o.mixedPlanId===plan.id&&['complete','partial','failed','lost'].includes(o.status)&&!o.mixedPlanReconciled)){
     for(const line of homeProcurementLines(order)){
       const row=plan.lines.find(x=>x.goodId===line.goodId);if(!row)continue;
       row.acquired=(row.acquired||0)+(line.acquired||0);
       if((line.acquired||0)<(line.qty||0))row.dispatched=Math.max(0,(row.dispatched||0)-((line.qty||0)-(line.acquired||0)))
     }
     order.mixedPlanReconciled=true
   }
   const allDone=plan.lines.every(l=>(l.acquired||0)>=(l.qty||0));
   if(allDone){plan.status='complete';plan.completedDay=state.world.day}
   else if(homePlanRemainingLines(plan).length)plan.status='queued';
   else if(homeTradeProcurementActive().some(o=>o.mixedPlanId===plan.id))plan.status='in_flight'
 }
}
function showHomeMixedProcurementPlanner(){
 guardianHallRouteEnter('showHomeMixedProcurementPlanner',[]);ensureHomeBase();const L=state.world.homeBase.logistics;if(!L.master)return showHomeTradeProcurement('goods');
 const rows=TRADE_GOODS.map(g=>{const src=homeTradeProcurementSources(g.id)[0];return `<label class="mixed-proc-row"><input type="checkbox" data-mixedgood="${g.id}" ${src?'':'disabled'}><span><b>${esc(g.name)}</b><small>Hall ${state.world.homeBase.tradeGoods[g.id]||0}${src?` • ${esc(worldLocation(src.id).name)} • ${src.price}g • ~${src.days}d`:' • no viable source'}</small></span><input type="number" data-mixedqty="${g.id}" min="1" max="90" value="10" ${src?'':'disabled'}></label>`}).join('');
 overlay(`<h2>Mixed Procurement Plan</h2><p>Select several goods and target quantities. ${esc(L.master.name)} will decide how to split them among the Hall's ${homeTradeProcurementCapacity()} procurement caravans and will combine compatible routes when practical.</p><div class="notice compact"><b>Competence ${L.master.competence}/10</b><br>Current planning efficiency: about ${Math.round(homeProcurementRouteEfficiency()*100)}% faster procurement travel, plus ${L.master.competence>=8?'advanced':L.master.competence>=5?'improved':'basic'} route consolidation.</div><div class="mixed-proc-list">${rows}</div><h3>Priority</h3><div class="proc-choice-grid">${['economy','normal','high','ultra'].map(id=>`<button data-mixpriority="${id}" class="${id==='normal'?'active':''}">${HOME_TRADE_PROCUREMENT_PRIORITIES[id].name}</button>`).join('')}</div><h3>Security</h3><div class="proc-choice-grid">${['auto','standard','reinforced','high','maximum'].map(id=>`<button data-mixsecurity="${id}" class="${id==='auto'?'active':''}"><b>${HOME_TRADE_PROCUREMENT_SECURITY[id].name}</b></button>`).join('')}</div><div class="notice compact" id="mixedPlanPreview">Select at least two goods.</div><div class="dialog-footer"><button id="delegateMixedPlan">Delegate Procurement Plan</button><button id="mixedPlanCancel">Cancel</button></div>`,true);
 let priority='normal',security='auto';
 const preview=()=>{const selected=[...document.querySelectorAll('[data-mixedgood]:checked')].map(cb=>({goodId:cb.dataset.mixedgood,qty:Number(document.querySelector(`[data-mixedqty="${cb.dataset.mixedgood}"]`)?.value)||10}));if(selected.length<2){$('#mixedPlanPreview').textContent='Select at least two goods.';return}const fake={lines:selected.map(x=>({...x,dispatched:0,acquired:0}))},groups=homePlanBuildCaravanGroups(fake),total=selected.reduce((n,x)=>n+x.qty,0);$('#mixedPlanPreview').innerHTML=`<b>${selected.length} goods • ${total} total units</b><br>Current Logistics Master estimate: ${groups.length} route group${groups.length===1?'':'s'} before cargo-capacity splitting. Up to ${homeTradeProcurementCapacity()} supervised Hall caravans can be active at once across procurement and commercial ventures; excess work will remain queued.`};
 document.querySelectorAll('[data-mixedgood],[data-mixedqty]').forEach(x=>x.onchange=preview);document.querySelectorAll('[data-mixedqty]').forEach(x=>x.oninput=preview);
 document.querySelectorAll('[data-mixpriority]').forEach(b=>b.onclick=()=>{priority=b.dataset.mixpriority;document.querySelectorAll('[data-mixpriority]').forEach(x=>x.classList.toggle('active',x===b))});
 document.querySelectorAll('[data-mixsecurity]').forEach(b=>b.onclick=()=>{security=b.dataset.mixsecurity;document.querySelectorAll('[data-mixsecurity]').forEach(x=>x.classList.toggle('active',x===b))});
 $('#delegateMixedPlan').onclick=()=>{const selected=[...document.querySelectorAll('[data-mixedgood]:checked')].map(cb=>({goodId:cb.dataset.mixedgood,qty:Number(document.querySelector(`[data-mixedqty="${cb.dataset.mixedgood}"]`)?.value)||10}));homeCreateMixedProcurementPlan(selected,priority,security)};$('#mixedPlanCancel').onclick=()=>showHomeTradeProcurement('goods');preview()
}
function homeStandingProcurementDailyTick(){
 if(!isOpenWorld())return;ensureHomeBase();const L=state.world.homeBase.logistics;if(!L.master||L.tradeStandingPaused||L.lastTradeStandingTickDay===state.world.day)return;L.lastTradeStandingTickDay=state.world.day;
 let slots=homeTradeProcurementCapacity()-homeTradeProcurementActive().length;if(slots<=0)return;
 const needs=homeTradeStandingOrders().filter(o=>!o.paused).map(o=>({o,qty:homeStandingOrderNeed(o),src:homeTradeProcurementSources(o.goodId)[0]})).filter(x=>x.qty>0&&x.src).sort((a,b)=>(HOME_TRADE_PROCUREMENT_PRIORITIES[homeNormalizeProcPriority(b.o.priority)].rank-HOME_TRADE_PROCUREMENT_PRIORITIES[homeNormalizeProcPriority(a.o.priority)].rank)||a.o.createdDay-b.o.createdDay);
 const used=new Set();
 for(const seed of needs){if(slots<=0)break;if(used.has(seed.o.id))continue;const sourceId=seed.src.id,priority=homeNormalizeProcPriority(seed.o.priority),security=seed.o.security||'auto',lines=[];let cap=30;
   const compatible=needs.filter(x=>!used.has(x.o.id)&&x.src.id===sourceId).sort((a,b)=>HOME_TRADE_PROCUREMENT_PRIORITIES[homeNormalizeProcPriority(b.o.priority)].rank-HOME_TRADE_PROCUREMENT_PRIORITIES[homeNormalizeProcPriority(a.o.priority)].rank);
   for(const x of compatible){if(cap<=0)break;const qty=Math.min(cap,x.qty);const sec=x.o.security==='auto'?homeAutoProcurementSecurity(x.o.priority,sourceId):x.o.security,q=homeTradeProcurementQuote(x.o.goodId,qty,x.o.priority,sec,sourceId);if(q.cost>(x.o.maxContract||999999)||q.unit>(x.o.maxUnitPrice||999999))continue;lines.push({goodId:x.o.goodId,qty,standingOrderId:x.o.id});cap-=qty;used.add(x.o.id)}
   if(!lines.length)continue;const result=homeDispatchProcurementLines(lines,priority,security,sourceId,true);if(result){slots--;homeLogisticsReport(`${L.master.name} combines ${lines.length} standing procurement need${lines.length===1?'':'s'} into ${result.caravan.name}.`,'info')}else for(const l of lines)used.delete(l.standingOrderId)
 }
}
function homeTradeGoodGroupName(goodId){for(const [name,ids] of HOME_TRADE_GOOD_GROUPS)if(ids.includes(goodId))return name;return 'Other Trade Goods'}
function homeTradeSourceQuality(src){
 if(!src)return 'UNAVAILABLE';if(src.role==='source'&&src.stock>=30)return 'EXCELLENT SOURCE';if(src.stock>=15&&src.days<=8)return 'GOOD SOURCE';if(src.days>=10)return 'DISTANT SOURCE';return 'LIMITED SOURCE'
}
function homeTradeOrderStatusLabel(o){return String(o.status||'unknown').replaceAll('_',' ').toUpperCase()}
function showHomeTradeProcurement(tab='goods'){
 for(const o of homeTradeProcurementOrders().filter(x=>x.status==='awaiting_storage')){const p=o.partyId?state.world.parties.find(q=>q.id===o.partyId):null;if(p)resolveHomeTradeProcurementArrival(p)}
 modalRouteEnter('showHomeTradeProcurement',Array.from(arguments));guardianHallRouteEnter('showHomeTradeProcurement',[tab]);ensureHomeBase();const L=state.world.homeBase.logistics;if(!L.master)return actionResult('Logistics Master Required','Hire a Logistics Master before managing trade procurement.','info',showHomeLogistics);
 const active=homeTradeProcurementActive(),cap=homeTradeProcurementCapacity(),standing=homeTradeStandingOrders(),standCap=homeTradeStandingCapacity();
 const nav=`<div class="trade-proc-tabs"><button data-proctab="goods" class="${tab==='goods'?'active':''}">Procure Goods</button><button data-proctab="standing" class="${tab==='standing'?'active':''}">Standing Orders</button><button data-proctab="active" class="${tab==='active'?'active':''}">Active Caravans</button></div>`;
 let body='';
 if(tab==='goods'){
   body=`<div class="mixed-proc-launch"><button id="openMixedProcurement"><b>Plan Mixed Procurement</b><small>Select several goods and let the Logistics Master arrange the caravans and routes.</small></button></div>`+HOME_TRADE_GOOD_GROUPS.map(([group,ids])=>{const rows=ids.map(id=>worldGood(id)).filter(Boolean).map(g=>{const src=homeTradeProcurementSources(g.id)[0],quality=homeTradeSourceQuality(src);return `<div class="trade-proc-good"><div class="trade-proc-good-head"><b>${esc(g.name)}</b><span class="trade-source-quality ${quality.toLowerCase().replaceAll(' ','-')}">${quality}</span></div><div class="trade-proc-facts"><span><small>Hall Stores</small><b>${state.world.homeBase.tradeGoods[g.id]||0}</b></span><span><small>Best Source</small><b>${esc(src?worldLocation(src.id).name:'—')}</b></span><span><small>Available</small><b>${src?.stock??'—'}</b></span><span><small>Est. Unit</small><b>${src?src.price+'g':'—'}</b></span><span><small>Travel</small><b>${src?(src.days+'d'):'—'}</b></span></div><button data-procgood="${g.id}" ${active.length>=cap||!src?'disabled':''}>Procure</button></div>`}).join('');return rows?`<h3>${group}</h3><div class="trade-proc-grid">${rows}</div>`:''}).join('')
 }else if(tab==='standing'){
   const rows=standing.map(o=>{const g=worldGood(o.goodId),status=homeStandingOrderStatus(o),hall=state.world.homeBase.tradeGoods[o.goodId]||0,inbound=homeTradeInboundQty(o.goodId),mode=o.mode==='maintain'?`Maintain ${o.minimum} → ${o.target}`:o.mode==='regular'?`${o.qty} every ${o.interval} days`:o.mode==='opportunistic'?`Buy ${o.qty} at ≤ ${o.maxUnitPrice}g`: `Limited run to ${o.totalTarget}`;return `<div class="standing-proc-card ${o.paused?'paused':''}"><div><b>${esc(g?.name||o.goodId)}</b><span>${esc(status)}</span></div><small>${esc(mode)} • ${HOME_TRADE_PROCUREMENT_PRIORITIES[homeNormalizeProcPriority(o.priority)].name} priority • ${HOME_TRADE_PROCUREMENT_SECURITY[o.security||'auto'].name}</small><div class="standing-proc-stock"><span>Hall <b>${hall}</b></span><span>Inbound <b>${inbound}</b></span><span>Projected <b>${hall+inbound}</b></span></div><div class="standing-proc-actions"><button data-editstanding="${o.id}">Edit</button><button data-pausestanding="${o.id}">${o.paused?'Resume':'Pause'}</button><button data-deletestanding="${o.id}">Delete</button></div></div>`}).join('')||'<p class="muted">No standing procurement orders are configured.</p>';
   const add=TRADE_GOODS.filter(g=>!standing.some(o=>o.goodId===g.id)).map(g=>`<button data-newstanding="${g.id}">${esc(g.name)}</button>`).join('');
   body=`<div class="notice compact"><b>${standing.filter(o=>!o.paused).length}/${standCap} standing orders configured</b><br>Standing orders are instructions, not caravans. ${L.master.name} schedules them across the same ${cap} procurement caravans and combines compatible needs when practical.</div><button id="toggleStandingProcurement">${L.tradeStandingPaused?'Resume':'Pause'} Automatic Standing Procurement</button>${rows}${standing.length<standCap?`<h3>Add Standing Order</h3><div class="standing-good-picker">${add}</div>`:''}`
 }else{
   homeReconcileMixedProcurementPlans();
   const plans=homeTradeProcurementPlans().slice(-8).reverse().map(p=>{const lines=p.lines.map(l=>`${worldGood(l.goodId)?.name||l.goodId} ${l.acquired||0}/${l.qty}`).join(' • '),remaining=homePlanRemainingLines(p).reduce((n,l)=>n+l.remaining,0);return `<div class="proc-plan-card"><div><b>Mixed Procurement Plan</b><span>${String(p.status||'queued').replaceAll('_',' ').toUpperCase()}</span></div><small>${esc(lines)}<br>${HOME_TRADE_PROCUREMENT_PRIORITIES[homeNormalizeProcPriority(p.priority)].name} priority • ${HOME_TRADE_PROCUREMENT_SECURITY[p.security||'auto'].name}${remaining?` • ${remaining} units still awaiting dispatch/acquisition`:''}</small></div>`}).join('');
   const rows=plans+homeTradeProcurementOrders().slice(-16).reverse().map(o=>{const p=o.partyId?state.world.parties.find(x=>x.id===o.partyId):null,lines=homeProcurementLines(o),manifest=lines.map(l=>`${worldGood(l.goodId)?.name||l.goodId} ${l.acquired||0}/${l.qty}`).join(' • ');return `<div class="proc-caravan-card"><div><b>${esc(homeProcurementOrderLabel(o))}</b><span>${homeTradeOrderStatusLabel(o)}</span></div><small>${esc(manifest)}<br>${HOME_TRADE_PROCUREMENT_PRIORITIES[homeNormalizeProcPriority(o.priority)].name} priority • ${HOME_TRADE_PROCUREMENT_SECURITY[o.security||'standard']?.name||'Standard'} • contract ${o.cost}g${p?`<br>${esc(worldLocation(p.location).name)} → ${esc(worldLocation(p.destination).name)} • ~${p.travelLeft}d`:''}</small>${p?`<button data-trackproc="${p.id}">Track Caravan</button>`:''}</div>`}).join('')||'<p class="muted">No procurement caravans have been dispatched yet.</p>';body=rows
 }
 overlay(`<h2>Guardian Hall — Trade Goods Procurement</h2><div class="trade-proc-dashboard"><div><small>Logistics Master</small><b>${esc(L.master.name)}</b><span>Competence ${L.master.competence}/10</span></div><div><small>Hall Budget</small><b>${L.budget}g</b><span>Operating allowance</span></div><div><small>Caravans</small><b>${active.length}/${cap}</b><span>${Math.max(0,cap-active.length)} available</span></div><div><small>Standing Orders</small><b>${standing.filter(o=>!o.paused).length}/${standCap}</b><span>${L.tradeStandingPaused?'Paused':'Automatic'}</span></div></div>${nav}${L.procurementAlert?`<div class="warning notice">${esc(L.procurementAlert)}</div>`:''}${body}<div class="dialog-footer"><button id="tradeProcBack">Back to Logistics Office</button></div>`,true);
 document.querySelectorAll('[data-proctab]').forEach(b=>b.onclick=()=>showHomeTradeProcurement(b.dataset.proctab));if($('#openMixedProcurement'))$('#openMixedProcurement').onclick=showHomeMixedProcurementPlanner;document.querySelectorAll('[data-procgood]').forEach(b=>b.onclick=()=>showHomeTradeProcurementOrder(b.dataset.procgood));document.querySelectorAll('[data-trackproc]').forEach(b=>b.onclick=()=>{state.world.trackedPartyId=b.dataset.trackproc;save();closeOverlay();renderOpenWorld()});
 document.querySelectorAll('[data-newstanding]').forEach(b=>b.onclick=()=>showHomeStandingProcurementEditor(b.dataset.newstanding));document.querySelectorAll('[data-editstanding]').forEach(b=>b.onclick=()=>{const o=homeTradeStandingOrders().find(x=>x.id===b.dataset.editstanding);if(o)showHomeStandingProcurementEditor(o.goodId,o.id)});document.querySelectorAll('[data-pausestanding]').forEach(b=>b.onclick=()=>{const o=homeTradeStandingOrders().find(x=>x.id===b.dataset.pausestanding);if(o){o.paused=!o.paused;save()}showHomeTradeProcurement('standing')});document.querySelectorAll('[data-deletestanding]').forEach(b=>b.onclick=()=>{L.tradeStandingOrders=L.tradeStandingOrders.filter(x=>x.id!==b.dataset.deletestanding);save();showHomeTradeProcurement('standing')});
 if($('#toggleStandingProcurement'))$('#toggleStandingProcurement').onclick=()=>{L.tradeStandingPaused=!L.tradeStandingPaused;save();showHomeTradeProcurement('standing')};$('#tradeProcBack').onclick=()=>guardianHallRouteBack(showHomeLogistics)
}
function showHomeTradeProcurementOrder(goodId){
 guardianHallRouteEnter('showHomeTradeProcurementOrder',[goodId]);const g=worldGood(goodId);if(!g)return guardianHallRouteBack(()=>showHomeTradeProcurement('goods'));const sources=homeTradeProcurementSources(goodId),src=sources[0];let priority='normal',security='standard',sourceId=src?.id||null;
 const sourceRows=sources.slice(0,8).map((s,i)=>`<button data-procsource="${s.id}" class="${i===0?'active':''}"><b>${esc(worldLocation(s.id).name)}</b><small>${s.stock} available • ${s.price}g each • ~${s.days}d one way${s.role==='source'?' • producing source':''}</small></button>`).join('');
 overlay(`<h2>Procure ${esc(g.name)}</h2><div class="proc-order-source"><b>Recommended Source</b><span>${esc(src?worldLocation(src.id).name:'No viable source')}</span>${src?`<small>${src.stock} available • ${src.price}g each • ~${src.days}d one way</small>`:''}</div><h3>Quantity</h3><div class="proc-qty-presets"><button data-procqty="5">5 Small</button><button data-procqty="10" class="active">10 Standard</button><button data-procqty="20">20 Large</button><label>Custom <input id="tradeProcQty" type="number" min="1" max="30" value="10"></label></div><h3>Priority</h3><div class="proc-choice-grid">${['economy','normal','high','ultra'].map(id=>{const x=HOME_TRADE_PROCUREMENT_PRIORITIES[id];return `<button data-procpriority="${id}" class="${id==='normal'?'active':''}"><b>${x.name}</b><small>${x.desc}</small></button>`}).join('')}</div><h3>Caravan Security</h3><div class="proc-choice-grid">${['standard','reinforced','high','maximum'].map(id=>{const x=HOME_TRADE_PROCUREMENT_SECURITY[id];return `<button data-procsecurity="${id}" class="${id==='standard'?'active':''}"><b>${x.name}</b><small>${x.desc}</small></button>`}).join('')}</div><details class="proc-source-picker"><summary>Choose Different Source</summary><div class="choice-list">${sourceRows||'<p>No viable source.</p>'}</div></details><div class="notice compact" id="tradeProcQuote"></div><div class="dialog-footer"><button id="tradeProcProceed">Contract Caravan</button><button id="tradeProcCancel">Cancel</button></div>`,true);
 const refresh=()=>{const q=homeTradeProcurementQuote(goodId,$('#tradeProcQty').value,priority,security,sourceId);$('#tradeProcQuote').innerHTML=q.source?`<b>Contract Summary</b><br>${q.qty} ${esc(g.name)} • ${esc(worldLocation(q.source.id).name)} • ${q.unit}g estimated unit price<br>Priority: ${HOME_TRADE_PROCUREMENT_PRIORITIES[q.priority].name} • Security: ${HOME_TRADE_PROCUREMENT_SECURITY[q.security].name}<br>Estimated contract: <b>${q.cost} Hall gold</b> • roughly ${q.days*2} days round trip`:'No viable source is currently known.'};
 document.querySelectorAll('[data-procqty]').forEach(b=>b.onclick=()=>{$('#tradeProcQty').value=b.dataset.procqty;document.querySelectorAll('[data-procqty]').forEach(x=>x.classList.toggle('active',x===b));refresh()});document.querySelectorAll('[data-procpriority]').forEach(b=>b.onclick=()=>{priority=b.dataset.procpriority;document.querySelectorAll('[data-procpriority]').forEach(x=>x.classList.toggle('active',x===b));refresh()});document.querySelectorAll('[data-procsecurity]').forEach(b=>b.onclick=()=>{security=b.dataset.procsecurity;document.querySelectorAll('[data-procsecurity]').forEach(x=>x.classList.toggle('active',x===b));refresh()});document.querySelectorAll('[data-procsource]').forEach(b=>b.onclick=()=>{sourceId=b.dataset.procsource;document.querySelectorAll('[data-procsource]').forEach(x=>x.classList.toggle('active',x===b));refresh()});$('#tradeProcQty').oninput=refresh;refresh();$('#tradeProcProceed').onclick=()=>startHomeTradeProcurement(goodId,$('#tradeProcQty').value,priority,security,sourceId);$('#tradeProcCancel').onclick=()=>guardianHallRouteBack(()=>showHomeTradeProcurement('goods'))
}
function showHomeStandingProcurementEditor(goodId,orderId=null){
 guardianHallRouteEnter('showHomeStandingProcurementEditor',[goodId,orderId]);ensureHomeBase();const L=state.world.homeBase.logistics,g=worldGood(goodId),existing=orderId?homeTradeStandingOrders().find(x=>x.id===orderId):null;if(!g)return showHomeTradeProcurement('standing');
 const o=existing||{mode:'maintain',minimum:10,target:20,qty:10,interval:14,maxUnitPrice:9999,maxContract:900,totalTarget:50,priority:'normal',security:'auto'};
 overlay(`<h2>${existing?'Edit':'Standing Order'} — ${esc(g.name)}</h2><p>The Logistics Master will queue this instruction against the Hall's existing ${homeTradeProcurementCapacity()} procurement caravans. Compatible needs may be combined on one trip.</p><h3>Order Type</h3><div class="proc-choice-grid"><button data-standingmode="maintain" class="${o.mode==='maintain'?'active':''}">Maintain Stock</button><button data-standingmode="regular" class="${o.mode==='regular'?'active':''}">Regular Shipment</button><button data-standingmode="opportunistic" class="${o.mode==='opportunistic'?'active':''}">Opportunistic Buy</button><button data-standingmode="limited" class="${o.mode==='limited'?'active':''}">Limited Run</button></div><div class="standing-editor-grid"><label>Minimum stock<input id="standingMinimum" type="number" min="0" max="999" value="${o.minimum||10}"></label><label>Refill target<input id="standingTarget" type="number" min="1" max="999" value="${o.target||20}"></label><label>Shipment quantity<input id="standingQty" type="number" min="1" max="30" value="${o.qty||10}"></label><label>Interval (days)<input id="standingInterval" type="number" min="1" max="90" value="${o.interval||14}"></label><label>Limited-run total<input id="standingTotalTarget" type="number" min="1" max="999" value="${o.totalTarget||50}"></label><label>Max unit price<input id="standingMaxUnit" type="number" min="1" max="9999" value="${o.maxUnitPrice>=9999?'':o.maxUnitPrice||''}" placeholder="No limit"></label><label>Max contract cost<input id="standingMaxContract" type="number" min="30" max="99999" value="${o.maxContract||900}"></label></div><h3>Priority</h3><div class="proc-choice-grid">${['economy','normal','high','ultra'].map(id=>`<button data-standingpriority="${id}" class="${homeNormalizeProcPriority(o.priority)===id?'active':''}">${HOME_TRADE_PROCUREMENT_PRIORITIES[id].name}</button>`).join('')}</div><h3>Security</h3><div class="proc-choice-grid">${['auto','standard','reinforced','high','maximum'].map(id=>`<button data-standingsecurity="${id}" class="${(o.security||'auto')===id?'active':''}"><b>${HOME_TRADE_PROCUREMENT_SECURITY[id].name}</b><small>${HOME_TRADE_PROCUREMENT_SECURITY[id].desc}</small></button>`).join('')}</div><div class="notice compact"><b>Current evaluation:</b> <span id="standingEval"></span></div><div class="dialog-footer"><button id="saveStandingOrder">${existing?'Save Changes':'Activate Standing Order'}</button><button id="cancelStandingOrder">Cancel</button></div>`,true);
 let mode=o.mode,priority=homeNormalizeProcPriority(o.priority),security=o.security||'auto';const evalText=()=>{const fake={...o,mode,priority,security,minimum:Number($('#standingMinimum').value)||0,target:Number($('#standingTarget').value)||1,qty:Number($('#standingQty').value)||10,interval:Number($('#standingInterval').value)||14,totalTarget:Number($('#standingTotalTarget').value)||50,maxUnitPrice:Number($('#standingMaxUnit').value)||9999,maxContract:Number($('#standingMaxContract').value)||900};$('#standingEval').textContent=homeStandingOrderStatus(fake)};
 document.querySelectorAll('[data-standingmode]').forEach(b=>b.onclick=()=>{mode=b.dataset.standingmode;document.querySelectorAll('[data-standingmode]').forEach(x=>x.classList.toggle('active',x===b));evalText()});document.querySelectorAll('[data-standingpriority]').forEach(b=>b.onclick=()=>{priority=b.dataset.standingpriority;document.querySelectorAll('[data-standingpriority]').forEach(x=>x.classList.toggle('active',x===b));evalText()});document.querySelectorAll('[data-standingsecurity]').forEach(b=>b.onclick=()=>{security=b.dataset.standingsecurity;document.querySelectorAll('[data-standingsecurity]').forEach(x=>x.classList.toggle('active',x===b));evalText()});document.querySelectorAll('.standing-editor-grid input').forEach(x=>x.oninput=evalText);evalText();
 $('#saveStandingOrder').onclick=()=>{const row=existing||{id:'standproc_'+uid(),goodId,createdDay:state.world.day,totalAcquired:0,paused:false};Object.assign(row,{mode,priority,security,minimum:Math.max(0,Number($('#standingMinimum').value)||0),target:Math.max(1,Number($('#standingTarget').value)||1),qty:Math.max(1,Math.min(30,Number($('#standingQty').value)||10)),interval:Math.max(1,Number($('#standingInterval').value)||14),totalTarget:Math.max(1,Number($('#standingTotalTarget').value)||50),maxUnitPrice:Math.max(1,Number($('#standingMaxUnit').value)||9999),maxContract:Math.max(30,Number($('#standingMaxContract').value)||900)});if(!existing)L.tradeStandingOrders.push(row);L.tradeStandingOrders=L.tradeStandingOrders.slice(-homeTradeStandingCapacity());save();showHomeTradeProcurement('standing')};$('#cancelStandingOrder').onclick=()=>showHomeTradeProcurement('standing')
}
function homeLogisticsOrder(){ensureHomeBase();const h=state.world.homeBase,L=h.logistics;if(!L.master)return actionResult(SOSText("hall_business_finance_logistics.homeLogisticsOrder.001"),SOSText("hall_business_finance_logistics.homeLogisticsOrder.002"),'info',showHomeLogistics);if(L.shipmentId)return actionResult(SOSText("hall_business_finance_logistics.homeLogisticsOrder.003"),SOSText("hall_business_finance_logistics.homeLogisticsOrder.004"),'info',showHomeLogistics);const p=homeLogisticsPolicy(),cost=p.cost;if(L.budget<cost)return actionResult(SOSText("hall_business_finance_logistics.homeLogisticsOrder.005"),SOSText("hall_business_finance_logistics.homeLogisticsOrder.006",p.name.toLowerCase(),cost),'info',showHomeLogistics);homeFinanceDebit(cost,SOSText("hall_business_finance_logistics.homeLogisticsOrder.007"),SOSText("hall_business_finance_logistics.homeLogisticsOrder.008",p.name));const regional=L.policy==='comfortable'||homeSupplyAverage()<45||chance(.42);if(regional){const shp=homeCreateSupplyShipment(cost,SOSText("hall_business_finance_logistics.homeLogisticsOrder.009"));recordWorldHistory(SOSText("hall_business_finance_logistics.homeLogisticsOrder.010",L.master.name),'info','home');save();return actionResult(SOSText("hall_business_finance_logistics.homeLogisticsOrder.011"),SOSText("hall_business_finance_logistics.homeLogisticsOrder.012",shp.name,worldLocation(shp.origin).name),'good',showHomeLogistics)}homeApplySupplyDelivery(24+homeUpgradeLevel(SOSText("hall_business_finance_logistics.homeLogisticsOrder.013"))*6);homeLogisticsReport(SOSText("hall_business_finance_logistics.homeLogisticsOrder.014",L.master.name),'good');recordWorldHistory(SOSText("hall_business_finance_logistics.homeLogisticsOrder.015",L.master.name),'good','home');save();actionResult(SOSText("hall_business_finance_logistics.homeLogisticsOrder.016"),SOSText("hall_business_finance_logistics.homeLogisticsOrder.017"),'good',showHomeLogistics)}
function showHomeLogistics(){modalRouteEnter(SOSText("hall_business_finance_logistics.showHomeLogistics.001"),Array.from(arguments));guardianHallRouteEnter('showHomeLogistics',[]);ensureHomeBase();const h=state.world.homeBase,L=h.logistics,p=homeLogisticsPolicy(),shipment=L.shipmentId?state.world.parties.find(x=>x.id===L.shipmentId):null,low=Object.entries(L.supplies).filter(([,v])=>v<40),emergencyStaff=homeEmergencyProcurementStaffAvailable(),crisis=homeLocalFoodCrisis();overlay(SOSText("hall_business_finance_logistics.showHomeLogistics.002",L.master?`<div class="card"><h3>${esc(L.master.name)} — Logistics Master</h3><p>${esc(L.master.strength||'General Hall logistics')}</p><div class="stat-row"><span>Competence</span><b>${L.master.competence}/10</b></div><div class="stat-row"><span>Salary</span><b>${L.master.salary} gold / 14 days</b></div><div class="stat-row"><span>Hall operating allowance</span><b>${L.budget} gold</b></div><div class="stat-row"><span>Current policy</span><b>${esc(p.name)}</b></div><p>${esc(L.status)}</p><button id="replaceLogistics">Replace Logistics Master</button></div><h3>Routine Supply Reserves</h3>${Object.entries(L.supplies).map(([k,v])=>`<div class="stat-row"><span>${k[0].toUpperCase()+k.slice(1)}</span><b>${v}% • ${homeSupplyLabel(v)}</b></div>`).join('')}<div class="notice compact"><b>Average reserve:</b> ${homeSupplyAverage()}%${low.length?`<br><span class="danger-text">Low: ${low.map(([k])=>k).join(', ')}</span>`:''}<br><small>Hall employees buy ordinary meals through normal wages and household purchasing. Strategic food reserve feeds employees only during a major Shantium food crisis${crisis?' — this rule is currently ACTIVE.':'.'}</small></div>${shipment?`<div class="success notice"><b>Inbound supply caravan:</b> ${esc(shipment.name)}<br>${esc(worldLocation(shipment.location).name)} → Shantium • about ${shipment.travelLeft} day${shipment.travelLeft===1?'':'s'} remaining<br><button id="logisticsTrackShipment">Track on Map</button></div>`:''}${L.disruption?`<div class="warning notice"><b>Supply disruption:</b> ${esc(L.disruption.text)}<div class="choice-list compact"><button id="logisticsLocalReplace">Buy Emergency Local Replacement — 65 Hall gold</button><button id="logisticsReplacement">Contract Replacement Caravan — 50 Hall gold</button><button id="logisticsReduce">Temporarily Reduce Consumption</button></div></div>`:''}<h3>Purchasing & Delegation</h3><div class="choice-list"><button id="logisticsEmergencyLocal" ${L.lastEmergencyLocalDay===state.world.day||emergencyStaff<=0?'disabled':''}><b>${L.lastEmergencyLocalDay===state.world.day?'Emergency Purchase Team Deployed Today':'Emergency Local Purchase'}</b><small>${L.lastEmergencyLocalDay===state.world.day?`${L.emergencyStaffAssigned||0} staff currently reassigned`:`${emergencyStaff} staff available for premium same-day purchasing in Shantium`}</small></button><button id="logisticsOrder" ${L.shipmentId?'disabled':''}>Arrange Supply Order — ${p.cost} Hall gold</button><button id="logisticsTradeProcurement"><b>Trade Goods Procurement</b><small>${homeTradeSupervisedCaravanUsed()}/${homeTradeProcurementCapacity()} supervised slots active (${homeTradeProcurementActive().length} procurement${typeof homeCommercialCaravanActive==='function'?`, ${homeCommercialCaravanActive().length} commercial`:''}) • ${homeTradeStandingOrders().filter(o=>!o.paused).length} standing • ${homeTradeProcurementPlanActive().length} mixed plan${homeTradeProcurementPlanActive().length===1?'':'s'}</small></button><button id="logisticsAuto">Automatic Routine Procurement: ${L.autoProcure?'ON':'OFF'}</button><button id="logisticsPolicy">Change Provisioning Policy</button><button id="logisticsReports">Review Logistics Reports (${L.reports.length})</button><button id="logisticsBudget">Hall Budget & Accounts</button></div>`:`<div class="notice"><b>Logistics Master position vacant.</b><br>Without a Logistics Master, automatic procurement and emergency local purchasing are unavailable.</div><button id="hireLogistics">Review Logistics Master Candidates</button>`),true);if($('#hireLogistics'))$('#hireLogistics').onclick=showLogisticsHireCandidates;if($('#replaceLogistics'))$('#replaceLogistics').onclick=showLogisticsHireCandidates;if($('#logisticsEmergencyLocal'))$('#logisticsEmergencyLocal').onclick=showHomeEmergencyProcurement;if($('#logisticsOrder'))$('#logisticsOrder').onclick=homeLogisticsOrder;if($('#logisticsTradeProcurement'))$('#logisticsTradeProcurement').onclick=showHomeTradeProcurement;if($('#logisticsAuto'))$('#logisticsAuto').onclick=homeToggleAutoProcure;if($('#logisticsReports'))$('#logisticsReports').onclick=showHomeLogisticsReports;if($('#logisticsBudget'))$('#logisticsBudget').onclick=showHomeBudget;if($('#logisticsTrackShipment'))$('#logisticsTrackShipment').onclick=()=>{state.world.trackedPartyId=L.shipmentId;save();closeOverlay();renderOpenWorld()};if($('#logisticsLocalReplace'))$('#logisticsLocalReplace').onclick=()=>resolveHomeLogisticsDisruption('local');if($('#logisticsReplacement'))$('#logisticsReplacement').onclick=()=>resolveHomeLogisticsDisruption('replacement');if($('#logisticsReduce'))$('#logisticsReduce').onclick=()=>resolveHomeLogisticsDisruption('reduce');$('#logisticsBack').onclick=()=>guardianHallRouteBack(showHomeBase);if($('#logisticsPolicy')){$('#logisticsPolicy').onclick=()=>{overlay(SOSText("hall_business_finance_logistics.showHomeLogistics.003",Object.entries(HOME_LOGISTICS_POLICIES).map(([id,x])=>`<div class="card"><b>${esc(x.name)}</b> • ${x.cost} gold/order • about every ${x.interval} days<p>${esc(x.desc)}</p><button data-logpolicy="${id}" ${L.policy===id?'disabled':''}>${L.policy===id?'Current Policy':'Adopt Policy'}</button></div>`).join('')),true);document.querySelectorAll('[data-logpolicy]').forEach(b=>b.onclick=()=>homeSetLogisticsPolicy(b.dataset.logpolicy));$('#logPolicyBack').onclick=()=>guardianHallRouteBack(showHomeLogistics)}}}
const HOME_SECURITY_POSTURES={
 welcoming:{name:SOSText("hall_business_finance_logistics.showHomeLogistics.004"),risk:.025,readiness:1,desc:SOSText("hall_business_finance_logistics.showHomeLogistics.005")},
 standard:{name:SOSText("hall_business_finance_logistics.showHomeLogistics.006"),risk:0,readiness:0,desc:SOSText("hall_business_finance_logistics.showHomeLogistics.007")},
 hardened:{name:SOSText("hall_business_finance_logistics.showHomeLogistics.008"),risk:-.03,readiness:-1,desc:SOSText("hall_business_finance_logistics.showHomeLogistics.009")}
};

const HEAD_GUARD_CANDIDATES=[
 {id:'dalen_voss',name:SOSText("hall_business_finance_logistics.showHomeLogistics.010"),competence:4,salary:90,strength:SOSText("hall_business_finance_logistics.showHomeLogistics.011")},
 {id:'mira_cade',name:SOSText("hall_business_finance_logistics.showHomeLogistics.012"),competence:3,salary:72,strength:SOSText("hall_business_finance_logistics.showHomeLogistics.013")},
 {id:'torren_hale',name:SOSText("hall_business_finance_logistics.showHomeLogistics.014"),competence:3,salary:66,strength:SOSText("hall_business_finance_logistics.showHomeLogistics.015")},
 {id:'sera_wynn',name:SOSText("hall_business_finance_logistics.showHomeLogistics.016"),competence:4,salary:96,strength:SOSText("hall_business_finance_logistics.showHomeLogistics.017")}
];

function homeHeadGuardReport(text,tone='info'){ensureHomeBase();const S=state.world.homeBase.security;S.headGuardReports=S.headGuardReports||[];S.headGuardReports.push({day:state.world.day,text,tone});S.headGuardReports=S.headGuardReports.slice(-30)}
