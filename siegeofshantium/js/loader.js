(function(){
'use strict';

const APP=document.getElementById('app');

function showLoadError(message){
  console.error(message);
  if(APP){
    APP.innerHTML='<div style="max-width:760px;margin:40px auto;padding:20px;border:1px solid #8b5d52;background:#f5ece8;font-family:system-ui,sans-serif">'
      +'<h2 style="margin-top:0">Siege of Shantium could not start</h2>'
      +'<p>'+String(message).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))+'</p>'
      +'<p>Check that the complete <b>js/</b> folder was uploaded with index.html.</p></div>';
  }
}

async function loadGame(){
  const manifestResponse=await fetch('./js/module-manifest.json',{cache:'no-cache'});
  if(!manifestResponse.ok)throw new Error(`Module manifest could not be loaded (${manifestResponse.status}).`);
  const manifest=await manifestResponse.json();
  if(!Array.isArray(manifest.modules)||!manifest.modules.length)throw new Error('Module manifest contains no game modules.');

  const requests=manifest.modules.map(async mod=>{
    const path='./js/'+mod.file;
    const response=await fetch(path,{cache:'no-cache'});
    if(!response.ok)throw new Error(`${path} could not be loaded (${response.status}).`);
    return await response.text();
  });

  // Promise.all preserves manifest order while allowing the static files to download in parallel.
  const chunks=await Promise.all(requests);
  const source="\n(function(){\n'use strict';\n"+chunks.join('')+"\n})();\n";
  const blob=new Blob([source],{type:'text/javascript'});
  const url=URL.createObjectURL(blob);
  const script=document.createElement('script');
  script.src=url;
  script.onload=()=>URL.revokeObjectURL(url);
  script.onerror=()=>{
    URL.revokeObjectURL(url);
    showLoadError('The game modules downloaded, but the assembled game script could not execute.');
  };
  document.body.appendChild(script);
}

loadGame().catch(err=>showLoadError(err&&err.message?err.message:err));
})();