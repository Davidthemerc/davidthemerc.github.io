import {getAll,put,remove} from './db.js';
import {normalizeIngredient} from './ingredient-normalizer.js';
export async function pantry(){return getAll('pantry');}
export async function savePantryItem(item){const normalized=normalizeIngredient(item.name||item.normalized||item.id);const id=item.id||`pantry-${normalized}-${Date.now()}`;return put('pantry',{id,name:item.name||normalized,normalized,quantity:item.quantity===''?null:Number(item.quantity),unit:item.unit||'',location:item.location||'Pantry',staple:!!item.staple,useBy:item.useBy||'',notes:item.notes||'',opened:!!item.opened});}
export async function deletePantryItem(id){return remove('pantry',id);}
