/* v1.6.66.36.1 — Guardian Hall Military Navigation */
const GUARDIAN_MILITARY_NAV_VERSION=1;
function guardianMilitaryHallNavInstall(){
 const dlg=document.querySelector('.dialog');if(!dlg)return;
 const headings=[...dlg.querySelectorAll('h3')];const heading=headings.find(h=>h.textContent.trim()==='Military Affairs');if(!heading)return;
 const section=heading.closest('.hall-menu-section')||heading.parentElement;if(!section)return;
 const grid=section.querySelector('.home-hall-grid')||section;
 const B=typeof guardianBarracksState==='function'?guardianBarracksState():null;
 if(typeof showGuardianArsenal==='function'&&B?.built&&!document.getElementById('homeGuardianArsenal')){
  const b=document.createElement('button');b.id='homeGuardianArsenal';b.innerHTML='<b>Arsenal & Quartermaster\'s Office</b><small>Equipment, armories, production, procurement & strategic logistics</small>';b.onclick=showGuardianArsenal;grid.appendChild(b)
 }
 if(typeof showGuardianIntelligenceOffice==='function'&&B?.built&&!document.getElementById('homeGuardianIntelligence')){
  const O=guardianIntelligenceOffice(),b=document.createElement('button');b.id='homeGuardianIntelligence';b.innerHTML=`<b>Guardian Intelligence Office</b><small>${O.director?`${esc(O.director.name)} • intelligence, agents, networks & covert operations`:'Appoint a Director • intelligence, agents & counterintelligence'}</small>`;b.onclick=showGuardianIntelligenceOffice;grid.appendChild(b)
 }
}
const __showHomeBaseMilitaryNav=showHomeBase;showHomeBase=function(){const r=__showHomeBaseMilitaryNav.apply(this,arguments);guardianMilitaryHallNavInstall();return r};
const __showGuardianArsenalMilitaryNav=showGuardianArsenal;showGuardianArsenal=function(){const r=__showGuardianArsenalMilitaryNav.apply(this,arguments),b=document.getElementById('guardianArsenalBack');if(b){b.textContent='Back to Guardian Hall';b.onclick=showHomeBase}return r};
const __showGuardianIntelligenceOfficeMilitaryNav=showGuardianIntelligenceOffice;showGuardianIntelligenceOffice=function(){const r=__showGuardianIntelligenceOfficeMilitaryNav.apply(this,arguments),b=document.getElementById('intelOfficeBack');if(b){b.textContent='Back to Guardian Hall';b.onclick=showHomeBase}return r};
