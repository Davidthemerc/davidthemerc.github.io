const DB_NAME='recipe-manager';
const DB_VERSION=1;
const STORES=['sourceRecipes','userRecipes','recipeState','pantry','mealPlans','grocery','collections','settings','userSubstitutions'];
let dbPromise;
export function openDB(){
  if(dbPromise) return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      for(const s of STORES){if(!db.objectStoreNames.contains(s)) db.createObjectStore(s,{keyPath:'id'});}
    };
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
  return dbPromise;
}
export async function getAll(store){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(store,'readonly').objectStore(store).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error);});}
export async function get(store,id){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(store,'readonly').objectStore(store).get(id);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
export async function put(store,value){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value);tx.oncomplete=()=>res(value);tx.onerror=()=>rej(tx.error);});}
export async function bulkPut(store,values){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(store,'readwrite');const os=tx.objectStore(store);values.forEach(v=>os.put(v));tx.oncomplete=()=>res(values.length);tx.onerror=()=>rej(tx.error);});}
export async function remove(store,id){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});}
export async function clearStore(store){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).clear();tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});}
export async function setting(id,fallback=null){return (await get('settings',id))?.value ?? fallback;}
export async function setSetting(id,value){return put('settings',{id,value});}
export async function seedSourceRecipes(recipes,seedVersion){
  const current=await setting('seedVersion');
  if(current===seedVersion && (await getAll('sourceRecipes')).length) return false;
  await clearStore('sourceRecipes'); await bulkPut('sourceRecipes',recipes); await setSetting('seedVersion',seedVersion); return true;
}
export async function exportStores(){const data={};for(const s of STORES.filter(s=>s!=='sourceRecipes')) data[s]=await getAll(s);return data;}
export async function importStores(data,{replace=false}={}){for(const [s,rows] of Object.entries(data||{})){if(!STORES.includes(s)||s==='sourceRecipes'||!Array.isArray(rows)) continue;if(replace) await clearStore(s);await bulkPut(s,rows);} }
