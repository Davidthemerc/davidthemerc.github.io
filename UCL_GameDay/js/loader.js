(()=>{
'use strict';

async function loadUclGameDay(){
  const response=await fetch('module-manifest.json',{cache:'no-store'});
  if(!response.ok)throw new Error(`Unable to load module-manifest.json (${response.status})`);
  const manifest=await response.json();

  for(const href of (manifest.css||[])){
    if(document.querySelector(`link[data-ucl-css="${href}"]`))continue;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=href;
    link.dataset.uclCss=href;
    document.head.appendChild(link);
  }

  const chunks=[];
  for(const src of (manifest.js||[])){
    const r=await fetch(src,{cache:'no-store'});
    if(!r.ok)throw new Error(`Unable to load ${src} (${r.status})`);
    let text=await r.text();
    // Build-fragment headers are documentation only. Strip them before assembly
    // so a boundary that follows an `async` token remains syntactically identical
    // to the validated standalone bundle.
    if(text.startsWith('/* UCL GameDay')){
      const end=text.indexOf('*/\n');
      if(end>=0)text=text.slice(end+3);
    }
    chunks.push(text);
  }

  // The source fragments intentionally form one shared lexical scope.
  // Execute only after every fragment has been loaded in manifest order.
  const source=chunks.join('');
  (0,eval)(source);
}

function showBootError(error){
  console.error(error);
  const box=document.getElementById('errorBox');
  if(box){
    box.textContent=`UCL GameDay failed to start: ${error?.message||error}`;
    box.classList.add('show');
  }
}

loadUclGameDay().catch(showBootError);
})();
