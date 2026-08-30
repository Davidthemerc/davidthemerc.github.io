'use strict';
(() => {
  const FALLBACK_MODULES = ["core/language.js", "core/services.js", "core/bootstrap-data.js", "items/equipment.js", "world/regions-security.js", "politics/core.js", "politics/protection-outcomes.js", "politics/campaigns-civic.js", "politics/covert-raids.js", "politics/control-incidents.js", "politics/faction-social.js", "social/travelers-contacts.js", "social/world-life-chains.js", "social/relationship-contracts.js", "economy/trade-world-parties.js", "contracts/contracts-journal.js", "economy/property-investments.js", "law/encounter-planning-law.js", "world/party-interactions.js", "exploration/adventures-dungeons-factionquests.js", "openworld/state-captivity.js", "events/field-runtime-navigation.js", "core/state-party-classes.js", "core/town-save-load.js", "siege/campaign-start-menu.js", "openworld/ui-map-actions.js", "world/road-travel.js", "regions/sengia-redstone.js", "settlements/people-townlife.js", "world/regional-simulation.js", "world/integration-foundations.js", "settlements/problems-stories.js", "hall/core-hospitality.js", "hall/staff-correspondence.js", "hall/business-finance-logistics.js", "hall/security.js", "hall/life-visitors-diplomacy.js", "hall/homecoming-office-upgrades.js", "companions/stories-settlement-services.js", "exploration/wilderness-artifacts.js", "companions/life-road.js", "ui/game-town-navigation.js", "companions/relationships-party.js", "items/inventory-class-gear.js", "economy/shops-commissions.js", "siege/prisoners-force-encounters.js", "combat/combat.js", "siege/round-events-endings.js", "core/settings-help-audio.js", "law/custody-iii.js", "openworld/healing-rest-recovery.js", "siege/politics-morale-command.js", "siege/long-campaign-progression.js", "siege/integration-polish.js", "siege/bug-balance-pass.js", "siege/playability-ux.js", "siege/regression-edge-cases.js", "siege/final-qa.js", "regions/far-north-parties-combat.js", "exploration/far-north-wilderness.js", "regions/far-north-society.js", "regions/far-north-integration.js", "siege/prisoner-modernization.js", "hall/operations-armory.js", "hall/guest-quarters.js", "hall/dining-audiences.js", "hall/integration-safeguards.js", "hall/hospitality-ui.js", "siege/prisoner-ui.js", "core/runtime-start.js"];
  const status = document.getElementById('moduleLoadStatus');
  const setStatus = msg => { if (status) status.textContent = msg; };

  function loadScript(path) {
    return new Promise((resolve,reject) => {
      const s=document.createElement('script');
      s.src='js/'+path;
      s.async=false;
      s.onload=resolve;
      s.onerror=()=>reject(new Error('Could not load '+path));
      document.head.appendChild(s);
    });
  }

  async function getModules() {
    try {
      const r=await fetch('js/module-manifest.json',{cache:'no-store'});
      if(!r.ok)throw new Error('manifest '+r.status);
      const data=await r.json();
      if(!Array.isArray(data.modules)||!data.modules.length)throw new Error('invalid manifest');
      return data.modules;
    } catch(err) {
      console.warn('Using embedded Siege module manifest fallback.',err);
      return FALLBACK_MODULES;
    }
  }

  (async()=>{
    try {
      const modules=await getModules();
      for(let i=0;i<modules.length;i++){
        setStatus(`Loading Siege of Shantium… ${i+1}/${modules.length}`);
        await loadScript(modules[i]);
      }
      setStatus('');
      document.documentElement.dataset.sosModulesLoaded='true';
    } catch(err) {
      console.error(err);
      setStatus('Module load failed. Use a static web server or the standalone build.');
      const app=document.getElementById('app');
      if(app)app.innerHTML='<div class="menu-screen"><div class="menu-window"><h1>Siege of Shantium</h1><div class="warning notice"><b>Module Load Failed</b><br>'+String(err.message||err)+'</div></div></div>';
    }
  })();
})();
