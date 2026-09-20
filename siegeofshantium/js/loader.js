'use strict';
(() => {
  const FALLBACK_MODULES=["core/language.js","core/services.js","core/bootstrap-data.js","items/equipment.js","world/regions-security.js","politics/core.js","politics/protection-outcomes.js","politics/campaigns-civic.js","politics/covert-raids.js","politics/retaliation.js","politics/control-incidents.js","politics/faction-social.js","politics/guardian-aligned-politics.js","politics/guardian-emergent-movement.js","politics/guardian-formal-faction.js","politics/guardian-political-competition.js","politics/guardian-government.js","politics/guardian-regional-power.js","social/travelers-contacts.js","social/world-life-chains.js","social/relationship-contracts.js","economy/trade-world-parties.js","contracts/contracts-journal.js","economy/property-investments.js","law/encounter-planning-law.js","world/party-interactions.js","exploration/adventures-dungeons-factionquests.js","openworld/state-captivity.js","events/field-runtime-navigation.js","core/state-party-classes.js","core/town-save-load.js","siege2/combat-adapter.js","siege2/combat-rating.js","core/campaign-menu.js","siege-legacy/state.js","siege-legacy/strategic-forces.js","siege-legacy/combat-adapter.js","siege-legacy/ui.js","siege2/campaign-start-menu.js","openworld/ui-map-actions.js","world/road-travel.js","regions/sengia-redstone.js","regions/spawn-city.js","regions/spawn-services-population.js","regions/spawn-market-commerce.js","regions/spawn-economy-industry.js","regions/spawn-living-megacity.js","regions/spawn-urban-life.js","regions/spawn-law-crime-watch.js","regions/spawn-social-faction-life.js","regions/spawn-contracts-opportunities.js","settlements/people-townlife.js","world/regional-simulation.js","war/foundation.js","war/campaigns.js","war/intelligence-encounters.js","war/battles.js","war/territorial.js","war/logistics.js","war/civilians.js","war/pows.js","war/diplomacy.js","world/integration-foundations.js","settlements/problems-stories.js","hall/core-hospitality.js","hall/stable-mounts.js","hall/staff-correspondence.js","hall/artisan-workmen.js","hall/masterworks-prestige.js","hall/commercial-opportunities.js","hall/business-finance-logistics.js","hall/supply-reserves.js","hall/commercial-logistics.js","hall/security.js","hall/life-visitors-diplomacy.js","hall/homecoming-office-upgrades.js","hall/steward-administration.js","companions/stories-settlement-services.js","world/mounts-foundation.js","world/caravan-master.js","world/mount-breeding.js","exploration/wilderness-artifacts.js","companions/life-road.js","ui/game-town-navigation.js","companions/relationships-party.js","items/inventory-class-gear.js","economy/shops-commissions.js","combat/force-encounters.js","combat/combat.js","siege-legacy/round-events-endings.js","core/settings-help-audio.js","core/music-midi.js","law/custody-iii.js","openworld/healing-rest-recovery.js","siege2/politics-morale-command.js","siege2/long-campaign-progression.js","siege2/integration-polish.js","siege2/bug-balance-pass.js","siege2/playability-ux.js","siege2/regression-edge-cases.js","siege/final-qa.js","regions/far-north-parties-combat.js","exploration/far-north-wilderness.js","regions/far-north-society.js","regions/far-north-integration.js","siege/prisoner-modernization.js","hall/operations-armory.js","hall/guest-quarters.js","hall/dining-audiences.js","hall/integration-safeguards.js","hall/hospitality-ui.js","siege/prisoner-ui.js","siege/prisoner-population.js","siege/prisoner-work-crews.js","hall/crystal-ward.js","war/notifications.js","war/support-coordination.js","war/authorization-land.js","war/barracks-recruitment.js","war/guardian-formations.js","war/guardian-training-equipment.js","war/guardian-deployment-orders.js","war/guardian-field-logistics.js","war/guardian-war-participation.js","war/guardian-command-legacy.js","war/officer-careers.js","ui/keyboard-controls.js","core/campaign-save-router.js","core/campaign-mode-router.js","core/runtime-start.js"];
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
