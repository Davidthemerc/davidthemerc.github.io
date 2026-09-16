/* v1.6.66.9.10 — Mount Breeding, Lineage & Genetics */
const MOUNT_BREEDING_GESTATION_DAYS=18;
const MOUNT_BREEDING_MATURITY_DAYS=24;
function ensureMountBreeding(){const M=ensureMountState();if(!M.breeding)M.breeding={version:1,pregnancies:[],history:[]};if(!Array.isArray(M.breeding.pregnancies))M.breeding.pregnancies=[];if(!Array.isArray(M.breeding.history))M.breeding.history=[];return M.breeding}
function mountBreedingSex(m){return /mare|female/i.test(m.sex||'')?'female':'male'}
function mountBreedingAdult(m){return !m.bornDay||state.world.day-m.bornDay>=MOUNT_BREEDING_MATURITY_DAYS}
function mountBreedingEligible(m){return m&&m.status==='owned'&&m.assignment==='hall_stable'&&m.species!=='mule'&&mountBreedingAdult(m)&&!m.breedingCooldownUntil}
function mountBreedingPairValid(a,b){
 if(!a||!b||a.id===b.id||mountBreedingSex(a)===mountBreedingSex(b))return false;
 if(a.species==='mule'||b.species==='mule')return false;
 return (a.species===b.species)||(new Set([a.species,b.species]).has('horse')&&new Set([a.species,b.species]).has('donkey'))
}
function mountGeneticPotential(m,k){return Number(m.stats?.[k]||mountBaseFor(m)?.[k]||5)}
function mountFoalSpecies(a,b){return a.species===b.species?a.species:'mule'}
function mountFoalBreed(a,b,species){if(species!=='horse')return null;if(a.breedId===b.breedId)return a.breedId;const faster=(a.stats.speed||0)>=(b.stats.speed||0)?a:b;return faster.breedId||a.breedId||b.breedId}
function mountFoalStats(a,b,species,seed){
 const base=species==='horse'?(MOUNT_BREEDS[mountFoalBreed(a,b,species)]?.base||a.stats):MOUNT_SPECIES[species].base,stats={},master=hallStableMaster(),skill=master?.competence||0;
 for(const k of MOUNT_STAT_KEYS){
   const inherited=(mountGeneticPotential(a,k)+mountGeneticPotential(b,k))/2;
   let mutation=mountRand(seed+':'+k)<.18?(mountRand(seed+':mut:'+k)<.5?-1:1):0;
   if(skill>=8&&mountRand(seed+':master:'+k)<.12)mutation+=1;
   const pull=(inherited*0.82+(base[k]||5)*0.18);
   stats[k]=mountClampStat(Math.round(pull+mutation))
 }
 return stats
}
function mountBreedingValue(m){const b=mountBaseFor(m)||m.stats;return MOUNT_STAT_KEYS.reduce((n,k)=>n+(m.stats[k]-b[k]),0)}
function mountStartBreeding(aId,bId){
 if(typeof homeStableEmergency==='function'&&homeStableEmergency())return actionResult('Stable Supplies Critical','Breeding is suspended while the Stable Master is occupied securing enough feed, bedding, and care to keep every animal healthy.','info',showMountBreeding);
 const B=ensureMountBreeding(),a=ensureMountState().owned.find(m=>m.id===aId),b=ensureMountState().owned.find(m=>m.id===bId),master=hallStableMaster();
 if(!hallStableLevel()||!master)return actionResult('Stable Master Required','A staffed Guardian Hall Stable is required to manage breeding safely.','info',showHallStable);
 if(!mountBreedingEligible(a)||!mountBreedingEligible(b)||!mountBreedingPairValid(a,b))return actionResult('Pair Cannot Be Bred','Select two eligible adult Hall-stabled animals of opposite sex. Mules are sterile.','info',showMountBreeding);
 const female=mountBreedingSex(a)==='female'?a:b,male=female===a?b:a;if(B.pregnancies.some(p=>p.motherId===female.id))return actionResult('Already Bred',`${female.name} is already expecting.`,'info',showMountBreeding);
 const cost=120+hallStableLevel()*30;if(state.gold<cost)return actionResult('Breeding Cost',`Feed, veterinary care, and breeding arrangements require ${cost}g.`,'bad',showMountBreeding);
 state.gold-=cost;const due=state.world.day+MOUNT_BREEDING_GESTATION_DAYS;B.pregnancies.push({motherId:female.id,fatherId:male.id,startDay:state.world.day,dueDay:due,cost});female.breedingCooldownUntil=due+10;male.breedingCooldownUntil=state.world.day+7;B.history.push({day:state.world.day,text:`${female.name} bred with ${male.name}; expected foaling Day ${due}.`});save();showMountBreeding()
}
function mountCreateFoal(p){
 const M=ensureMountState(),a=M.owned.find(m=>m.id===p.motherId),b=M.owned.find(m=>m.id===p.fatherId);if(!a||!b)return null;
 const species=mountFoalSpecies(a,b),breedId=mountFoalBreed(a,b,species),seed=`foal:${a.id}:${b.id}:${p.startDay}`,stats=mountFoalStats(a,b,species,seed),breedName=species==='horse'?(MOUNT_BREEDS[breedId]?.name||'Horse'):MOUNT_SPECIES[species].name;
 const foal={id:`mount_${M.nextId++}`,species,breedId,breedName,name:mountGeneratedName(seed),stats,price:0,sex:mountRand(seed+':sex')<.5?(species==='horse'?'mare':'female'):(species==='horse'?'stallion':'male'),age:0,origin:'guardian_hall',marketLoc:null,generatedDay:state.world.day,ownedDay:state.world.day,purchasePrice:0,purchaseLocation:'shantium',status:'owned',assignment:'hall_stable',parents:[a.id,b.id],offspring:[],bornDay:state.world.day,breedingCooldownUntil:state.world.day+MOUNT_BREEDING_MATURITY_DAYS,condition:'fresh',fatigue:0};
 M.owned.push(foal);a.offspring=a.offspring||[];b.offspring=b.offspring||[];a.offspring.push(foal.id);b.offspring.push(foal.id);M.history.push({day:state.world.day,type:'birth',mountId:foal.id,name:foal.name,parents:[a.id,b.id]});return foal
}
function mountBreedingDailyTick(){
 const B=ensureMountBreeding();for(const m of ensureMountState().owned)if(m.breedingCooldownUntil&&m.breedingCooldownUntil<=state.world.day)delete m.breedingCooldownUntil;
 const due=B.pregnancies.filter(p=>p.dueDay<=state.world.day);for(const p of due){const f=mountCreateFoal(p);if(f){B.history.push({day:state.world.day,text:`${f.name}, a ${f.breedName}, was born at Guardian Hall.`});log(`${f.name}, a ${f.breedName}, was born at Guardian Hall.`,'good')}}
 B.pregnancies=B.pregnancies.filter(p=>p.dueDay>state.world.day);B.history=B.history.slice(-100)
}
function mountLineageHTML(m){
 const M=ensureMountState(),parents=(m.parents||[]).map(id=>M.owned.find(x=>x.id===id)?.name||id),kids=(m.offspring||[]).map(id=>M.owned.find(x=>x.id===id)?.name||id);
 return `<small>${parents.length?`Parents: ${esc(parents.join(' × '))}`:'Foundation stock'}${kids.length?` • Offspring: ${esc(kids.join(', '))}`:''}</small>`
}
function showMountBreeding(){
 guardianHallRouteEnter('showMountBreeding',[]);const B=ensureMountBreeding(),master=hallStableMaster(),eligible=hallStableMounts().filter(m=>mountBreedingEligible(m)),preg=B.pregnancies.map(p=>{const M=ensureMountState(),a=M.owned.find(x=>x.id===p.motherId),b=M.owned.find(x=>x.id===p.fatherId);return `<div class="notice compact"><b>${esc(a?.name||'Unknown')}</b> × ${esc(b?.name||'Unknown')} • expected Day ${p.dueDay}</div>`}).join('');
 const cards=eligible.map(m=>`<button class="mount-breeding-choice" data-breedpick="${m.id}"><b>${esc(m.name)}</b><small>${esc(m.breedName)} • ${esc(m.sex)} • genetic deviation ${mountBreedingValue(m)>=0?'+':''}${mountBreedingValue(m)}</small><div class="mount-stat-grid">${mountDeviationHTML(m)}</div></button>`).join('');
 overlay(`<h2>Guardian Hall — Breeding Book</h2><p>Choose breeding stock by individual statistics, not merely breed. Offspring inherit strongly from both parents with a smaller pull toward their breed standard and occasional variation. Horse × donkey produces a mule; mules cannot breed.</p>${master?`<div class="notice compact"><b>${esc(master.name)}</b> manages the breeding book • competence ${master.competence}/10${master.competence>=8?' • exceptional eye for promising pairings':''}</div>`:'<div class="warning notice">Hire a Stable Master before breeding animals.</div>'}${preg?`<h3>Expected Foals</h3>${preg}`:''}<h3>Eligible Hall Stock</h3><div id="breedingSelection" class="notice compact">Select the first parent.</div>${cards||'<p class="muted">No eligible adult breeding stock is currently boarded here.</p>'}<div class="dialog-footer"><button id="breedingBack">Back to Stable</button></div>`,true);
 let first=null;document.querySelectorAll('[data-breedpick]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.breedpick,m=ensureMountState().owned.find(x=>x.id===id);if(!first){first=id;$('#breedingSelection').innerHTML=`First parent: <b>${esc(m.name)}</b>. Select the second parent.`;return}const a=ensureMountState().owned.find(x=>x.id===first);if(!mountBreedingPairValid(a,m)){$('#breedingSelection').innerHTML=`<b>${esc(a.name)}</b> and <b>${esc(m.name)}</b> are not a valid breeding pair. Choose again.`;first=null;return}mountStartBreeding(first,id)});$('#breedingBack').onclick=showHallStable
}
