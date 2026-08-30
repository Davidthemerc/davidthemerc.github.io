import {getAll,get,put,remove} from './db.js';
let cache=[];
export async function refreshRecipes(){const [src,user,state]=await Promise.all([getAll('sourceRecipes'),getAll('userRecipes'),getAll('recipeState')]);const sm=new Map(state.map(s=>[s.id,s]));cache=[...src.map(r=>({...r,...sm.get(r.id),isSource:true})),...user.map(r=>({...r,...sm.get(r.id),isSource:false}))];return cache;}
export function recipes(){return cache.filter(r=>!r.bad);}
export function allRecipes(){return cache;}
export function badRecipes(){return cache.filter(r=>r.bad);}
export function recipeById(id){return cache.find(r=>r.id===id);}
export async function setRecipeState(id,patch){const old=await get('recipeState',id)||{id};await put('recipeState',{...old,...patch,id});await refreshRecipes();}
export async function toggleFavorite(id){const r=recipeById(id);await setRecipeState(id,{favorite:!r?.favorite});return !r?.favorite;}
export async function markRecipeBad(id,bad=true){await setRecipeState(id,{bad:!!bad,badMarkedAt:bad?new Date().toISOString():null,favorite:bad?false:(recipeById(id)?.favorite||false)});return !!bad;}
export async function saveUserRecipe(r){await put('userRecipes',{...r,isSource:false});await refreshRecipes();}
export async function deleteUserRecipe(id){await remove('userRecipes',id);await remove('recipeState',id);await refreshRecipes();}
export function searchRecipes({q='',meal='',source='',favorites=false,ingredient='',maxCalories='',minProtein='',sort='title'}={}){let a=cache.filter(r=>!r.bad);const term=q.trim().toLowerCase();if(term)a=a.filter(r=>[r.title,r.sourceBook,(r.ingredients||[]).map(i=>i.originalText).join(' '),(r.tags||[]).join(' ')].join(' ').toLowerCase().includes(term));if(meal)a=a.filter(r=>(r.mealTypes||[]).includes(meal));if(source)a=a.filter(r=>source==='__user'?!r.isSource:r.sourceFile===source);if(favorites)a=a.filter(r=>r.favorite);if(ingredient){const x=ingredient.toLowerCase();a=a.filter(r=>(r.ingredients||[]).some(i=>(i.normalizedIngredient||i.originalText).toLowerCase().includes(x)));}if(maxCalories)a=a.filter(r=>r.caloriesPerServing!=null&&r.caloriesPerServing<=Number(maxCalories));if(minProtein)a=a.filter(r=>r.proteinPerServing!=null&&r.proteinPerServing>=Number(minProtein));a.sort((x,y)=>sort==='calories'?(x.caloriesPerServing??9999)-(y.caloriesPerServing??9999):sort==='protein'?(y.proteinPerServing??-1)-(x.proteinPerServing??-1):x.title.localeCompare(y.title));return a;}
