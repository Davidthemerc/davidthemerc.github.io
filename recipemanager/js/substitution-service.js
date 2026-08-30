import {getAll} from './db.js';
import {normalizeIngredient,ingredientMatches} from './ingredient-normalizer.js';
let sourceRules=[];
export async function initSubstitutions(){sourceRules=await (await fetch('./data/substitutions.json')).json();}
export async function allRules(){return [...sourceRules,...await getAll('userSubstitutions')];}
export async function findSubstitute(need,onHand,{strict=true}={}){const rules=await allRules();const n=normalizeIngredient(need);for(const rule of rules){if(strict&&rule.kind!=='source'&&rule.kind!=='user')continue;const from=normalizeIngredient(rule.from);if(!(n===from||n.includes(from)||from.includes(n)))continue;for(const candidate of rule.to||[]){const hit=onHand.find(h=>ingredientMatches(h,candidate));if(hit)return {rule,candidate:hit};}}return null;}
