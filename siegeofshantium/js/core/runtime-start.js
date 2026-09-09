// v1.6.55.1 — canonical modular startup
// Performance hooks must be installed only after every module has loaded; several profiled
// screens and Spawn helpers are defined after core/town-save-load.js in the manifest.
if(typeof installSOSPerformanceHooks==='function')installSOSPerformanceHooks();
window.addEventListener('beforeunload',()=>{if(state&&!state.ended)save()});
renderMenu();
