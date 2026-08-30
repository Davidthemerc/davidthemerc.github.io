// v1.6.23 — canonical modular startup
window.addEventListener('beforeunload',()=>{if(state&&!state.ended)save()});
renderMenu();
