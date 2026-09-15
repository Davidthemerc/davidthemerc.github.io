/* v1.6.66.8.3 — Contextual keyboard navigation */
(function(){
 function editableTarget(t){return !!t?.closest?.('input,textarea,select,[contenteditable="true"]')}
 function visibleEnabledButtons(){if(!modal)return[];return [...modal.querySelectorAll('button')].filter(b=>!b.disabled&&b.offsetParent!==null&&getComputedStyle(b).visibility!=='hidden')}
 function keyboardBackButton(){if(!modal)return null;return visibleEnabledButtons().find(b=>{const id=b.id||'',label=(b.textContent||'').trim();return b.classList.contains('closeModal')||/Back(?:$|[A-Z_])/i.test(id)||/^Back\b/i.test(label)||/^Close\b/i.test(label)})||null}
 function soleOkayButton(){const buttons=visibleEnabledButtons();if(buttons.length!==1)return null;const b=buttons[0],label=(b.textContent||'').trim();return b.id==='resultContinue'||/^(?:OK|Okay|Continue|Done)$/i.test(label)?b:null}
 document.addEventListener('keydown',e=>{
  if(e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey||editableTarget(e.target))return;
  if(e.key==='Escape'&&modal){const b=keyboardBackButton();if(!b)return;e.preventDefault();e.stopPropagation();b.click();return}
  if((e.key==='Enter'||e.key==='Return')&&modal){const b=soleOkayButton();if(!b)return;e.preventDefault();e.stopPropagation();b.click()}
 },true)
})();
