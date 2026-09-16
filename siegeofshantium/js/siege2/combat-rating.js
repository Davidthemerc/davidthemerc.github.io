'use strict';
/* Siege II force-rating helpers. These use mode-neutral character/combat primitives only. */
function siegeIIGuardianCombatRating(){
 const hit=combatHitChance(accuracy(),6,20,94)/100,w=weapon(),
 dmg=Math.max(4,(w.damage||6)+boundedStatValue(stat(state,'str'))*.42+2+guardianClassBonus().damage),
 prot=combatProtectionRate(defense()),enemyHit=combatHitChance(76,guardianEvasion(),26,94)/100,
 survive=maxHP()*(1+prot*.9+(1-enemyHit)*.45);
 return survive+dmg*6*hit+maxStamina()*.13
}
function siegeIIAllyCombatRating(m){
 const hit=combatHitChance(allyAccuracy(m),6,24,93)/100,w=allyWeapon(m),
 dmg=Math.max(4,(w.damage||6)+boundedStatValue(allyStat(m,'str'))*.38+2+allyClassBonus(m).damage+companionBonuses(m).damage),
 prot=combatProtectionRate(allyDefense(m)),enemyHit=combatHitChance(76,allyEvasion(m),26,94)/100,
 survive=allyMaxHP(m)*(1+prot*.9+(1-enemyHit)*.45);
 return survive+dmg*6*hit+allyMaxStamina(m)*.13
}
function siegeIICompanyCombatRating(){
 return Math.max(120,siegeIIGuardianCombatRating()+partyMembers(true).reduce((n,m)=>n+siegeIIAllyCombatRating(m),0))
}
function siegeIIEnemyCombatRating(e){
 const hit=combatHitChance(e.acc||60,7,26,94)/100,
 trait={commander:20,elite:18,assassin:16,mage:14,healer:13,shield:12,stone:16,regen:15,brute:12,duelist:16,charger:13,engineer:12}[e.trait]||6,
 evasion=enemyEvasion(e);
 return (e.maxHp||e.hp||20)*(1+Math.min(.16,evasion*.008))+(e.damage||5)*6*hit+(e.init||5)*1.15+trait
}
function siegeIIEnemyGroupRating(members){return members.reduce((n,e)=>n+siegeIIEnemyCombatRating(e),0)}
