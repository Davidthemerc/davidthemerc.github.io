import {getAll,get,put} from './db.js';
import {recipes} from './recipe-service.js';
import {scaleIngredient,compatibleUnit,formatQuantity} from './quantity-utils.js';
import {ingredientMatches} from './ingredient-normalizer.js';
import {loadWeek} from './planner-service.js';
export async function generateGrocery(date,newId='current'){
 const plan=await loadWeek(date);const rs=recipes();const items=[];
 for(const e of plan.entries){const r=rs.find(x=>x.id===e.recipeId);if(!r)continue;for(const ing of r.ingredients||[]){if(ing.optional)continue;const s=scaleIngredient(ing,r.servings||1,e.servings||1);items.push({...s,recipeId:r.id,recipeTitle:r.title});}}
 const groups=[];
 for(const item of items){let g=groups.find(x=>x.normalizedIngredient===item.normalizedIngredient&&compatibleUnit(x.unit,item.unit)&&x.quantity!=null&&item.scaledQuantity!=null);if(g){g.quantity+=item.scaledQuantity;g.sources.push({recipeId:item.recipeId,title:item.recipeTitle,quantity:item.scaledQuantity});}else groups.push({id:`g-${item.normalizedIngredient}-${item.unit||'unit'}-${groups.length}`,normalizedIngredient:item.normalizedIngredient,name:item.ingredientName||item.normalizedIngredient,quantity:item.scaledQuantity??item.quantity,unit:item.unit||'',category:item.category||'Other',checked:false,manual:false,sources:[{recipeId:item.recipeId,title:item.recipeTitle,quantity:item.scaledQuantity??item.quantity}],originals:[item.originalText]});}
 const pan=await getAll('pantry');for(const g of groups){const p=pan.find(x=>ingredientMatches(x.normalized,g.normalizedIngredient));if(p){g.onHand=true;if(p.quantity!=null&&g.quantity!=null&&compatibleUnit(p.unit,g.unit)){g.quantity=Math.max(0,g.quantity-p.quantity);g.subtracted=p.quantity;}else g.checkOnHand=true;}}
 const old=await get('grocery',newId);if(old){const oldMap=new Map(old.items.map(i=>[i.normalizedIngredient+'|'+i.unit,i]));groups.forEach(g=>{const o=oldMap.get(g.normalizedIngredient+'|'+g.unit);if(o)g.checked=o.checked;});}
 const list={id:newId,weekStart:plan.start,generatedAt:new Date().toISOString(),items:groups};await put('grocery',list);return list;
}
export async function currentGrocery(){return await get('grocery','current')||{id:'current',items:[]};}
export async function saveGrocery(list){return put('grocery',list);}
export function displayGroceryQuantity(i){if(i.quantity==null)return i.originals?.join(' + ')||'';return `${formatQuantity(i.quantity)}${i.unit?' '+i.unit:''}`.trim();}
