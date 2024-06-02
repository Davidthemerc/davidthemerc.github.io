async function hiscores(playerName, player) {
  // Do nothing if both names aren't filled out
  const proxyUrl = 'https://e8gsqorhc2.execute-api.us-east-2.amazonaws.com/';

  const url = `hiscores?player=${playerName}`;

  try {
    const response = await fetch(proxyUrl + url, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    const data = await response.text();
    const lines = data.split('\n');

    // OSRS API usually lists skills in a specific order: Attack, Defence, Strength, etc.
    const attack = lines[1].split(',')[1]; // Attack is typically on the first line
    const defence = lines[2].split(',')[1]; // Defence is typically on the second line
    const strength = lines[3].split(',')[1]; // Strength is typically on the third line
    const hitpoints = lines[4].split(',')[1]; // Fourth line?

    if (player === 1) {
      p1atk.value = attack;
      p1def.value = defence;
      p1str.value = strength;
      p1hp.value = hitpoints;
      playerLevels[0][0] = parseInt(attack);
      playerLevels[0][1] = parseInt(strength);
      playerLevels[0][2] = parseInt(defence);
      playerLevels[0][3] = parseInt(hitpoints);
      activeBoosts[0][3].bonus = parseInt(attack);
      activeBoosts[0][4].bonus = parseInt(strength);
      activeBoosts[0][5].bonus = parseInt(defence);
    } else {
      p2atk.value = attack;
      p2def.value = defence;
      p2str.value = strength;
      p2hp.value = hitpoints;
      playerLevels[1][0] = parseInt(attack);
      playerLevels[1][1] = parseInt(strength);
      playerLevels[1][2] = parseInt(defence);
      playerLevels[1][3] = parseInt(hitpoints);
      activeBoosts[1][3].bonus = parseInt(attack);
      activeBoosts[1][4].bonus = parseInt(strength);
      activeBoosts[1][5].bonus = parseInt(defence);
    }

    if (p1atk.value !== '' && p2atk.value !== '') {
      // Now that we have both players' initial stats, calculate their initial DPS values
      calcPlayerDPS();

      // Display HP differentials
      hpDifferentials();

      // By default, pick the first item in the list for equipment and combat style for both players. This will populate the data values in the UI.
      equipWeapon(0, 0);
      changeCombatStyle(0, 1);
      changeCombatSkillStyle(0, 0);
      equipWeapon(1, 0);
      changeCombatStyle(1, 1);
      changeCombatSkillStyle(1, 0);
    }

    return { attack, defence, strength };
  } catch (error) {
    console.error('Error fetching player stats:', error);
  }
}

const calcPlayerDPS = () => {
  // Since it's possible that any modifier given to one competitor could increase their defence, thus affecting the other competitor's DPS, I decided to have both of their DPS values updated at the same time

  // First, we'll do Competitor One's DPS
  // These calculation steps were obtained from the OSRS Wiki: https://oldschool.runescape.wiki/w/Damage_per_second/Melee

  // Step One: Calculate the effective strength level. Easy
  let p1EffectiveStrength = Math.floor(
    Math.floor(
      // Formula = (p1str + p1strlvlboost) * p1strprayboost
      activeBoosts[0][4].bonus * activeBoosts[0][1].bonus
    ) +
      // The 3 can be 1 if using controlled instead of aggressive. I think anything other than aggressive would be 1 instead of 3.
      activeBoosts[0][8].bonus +
      8
  );
  console.log(`P1 Effective Strength:${p1EffectiveStrength}`);

  // Step Two: Calculate the maximum hit.
  // Effective Strength * (0 + 64, Boxing Gloves have 0 Str Bonus, other equipment will have more) + 320 / 640 , Round Down,
  // * Target Specific Gear Bonus (Should always be 1 in pvp or boxing fights)
  // Round Down to nearest integer
  // Player 1's equipment is represented in: playerEquipment[0][0] The first [0] targets the first array inside the playerEquipment array, which is player 1's equipment.
  // The second [0] targets the first value in that array, which per vars.js is Melee Strength
  // Player 2 would be playerEquipment[1][0]

  let p1MaximumHit = Math.floor(
    Math.floor(
      (p1EffectiveStrength * (playerEquipment[0][0] + 64) + 320) / 640
      // The Multiplied Value following here is the Target's Specific Gear Bonus, which for these fights is always 1
    ) * 1
  );
  console.log(`Max Hit:${p1MaximumHit}`);

  // Step Three: Calculate the effective attack level
  // (Attack level + Attack Level boost) * prayer bonus
  // Round down to nearest integer
  // +3 if using accurate attack style - should be mandated/mandatory for matches
  // I guess we could say that accuracy should be favored in these matches?
  // More constant hits do make for more entertaining fights
  // +8 (Constant)
  // Round Down

  let p1EffectiveAttack = Math.floor(
    Math.floor(activeBoosts[0][3].bonus * activeBoosts[0][0].bonus) +
      activeBoosts[0][8].bonus +
      8
  );

  console.log(`Effective Attack Level: ${p1EffectiveAttack}`);

  // Step Four: Calculate the Attack roll
  // Effective Attack Level * (Equipment Attack Bonus + 64)
  // Equipment Attack Bonus will be selected by menus on the GUI
  // Round down to [the] nearest integer
  // The equipment values themselves are stored in an array, which are selected as above
  // When the calculator operator selects a weapon and a style, the correct bonus
  // is transmitted to the variable here, specifically, activeBoost[0][7].bonus
  // By default, for boxing gloves, activeBoost[0][7].bonus will be 0.

  let p1AttackRoll = Math.floor(
    p1EffectiveAttack * (activeBoosts[0][7].bonus + 64)
  );

  // Step Five: Calculate the other player's Defence roll
  // If the target is a player, use the formula
  // Def roll = Effective Defence * (Target Style Defence Bonus + 64)
  //
  // Wheras Effective Defence = (Defence Level + Defence Level Boost) * Prayer Bonus
  // Round down to nearest integer
  // +8 (Constant)
  // Round Down

  let p2effectiveDefence = Math.floor(
    Math.floor(
      activeBoosts[1][5].bonus * activeBoosts[1][2].bonus +
        activeBoosts[1][9].bonus +
        +8
    )
  );

  console.log(`P2 Effective Defence: ${p2effectiveDefence}`);

  let p2DefenceRoll = p2effectiveDefence * (1 + 64);

  console.log(`P2 Defence Roll: ${p2DefenceRoll}`);

  // Step Six: Calculate the Hit Chance
  // If Attack Roll > Defence Roll
  let p1HitChance;

  if (p1AttackRoll > p2DefenceRoll) {
    p1HitChance = 1 - (p2DefenceRoll + 2) / (2 * (p1AttackRoll + 1));
  } else {
    p1HitChance = p1AttackRoll / (2 * (p2DefenceRoll + 1));
  }
  console.log(`P1 Hit Chance: ${p1HitChance}`);

  // Step Seven: Calculate the melee damage output
  // Average damage per attack = Maximum Hit Chance * Hit Chance / 2
  // The Last Value in the Formula (Originally 2.4) is the weapon speed
  // That will need to be changed to account for different weapons
  // For player one, the weapon speed value is stored in playerEquipment[0][4]
  p1calculatedDPS = (p1MaximumHit * p1HitChance) / 2 / playerEquipment[0][4];

  p1calculatedDPS = Math.round(p1calculatedDPS * 1000000) / 1000000;

  console.log(`P1 Calculated DPS = ${p1calculatedDPS}`);

  p1dps.value = p1calculatedDPS;

  // Now on to Player Two...or Competitor Two...or whatever we're calling them now

  // Step One: Calculate the effective strength level. Easy
  let p2EffectiveStrength = Math.floor(
    Math.floor(
      // Formula = (p1str + p1strlvlboost) * p1strprayboost
      activeBoosts[1][4].bonus * activeBoosts[1][1].bonus
    ) +
      // The 3 can be 1 if using controlled instead of aggressive. I think anything other than aggressive would be 1 instead of 3.
      activeBoosts[1][8].bonus +
      8
  );
  console.log(`P2 Effective Strength:${p2EffectiveStrength}`);

  // Step Two: Calculate the maximum hit.
  // Effective Strength * (0 + 64, Boxing Gloves have 0 Str Bonus) + 320 / 640 , Round Down,
  // * Target Specific Gear Bonus (Should be 1, Boxing Gloves have 1 Slash Defence)
  // Round Down to nearest integer

  let p2MaximumHit = Math.floor(
    Math.floor(
      (p2EffectiveStrength * (playerEquipment[1][0] + 64) + 320) / 640
    ) * 1
  );
  console.log(`P2 Max Hit:${p2MaximumHit}`);

  // Step Three: Calculate the effective attack level
  // (Attack level + Attack Level boost) * prayer bonus
  // Round down to nearest integer
  // +3 if using accurate attack style - should be mandated
  // +8 (Constant)
  // Round Down

  let p2EffectiveAttack = Math.floor(
    Math.floor(activeBoosts[1][3].bonus * activeBoosts[1][0].bonus) +
      activeBoosts[1][8].bonus +
      8
  );

  console.log(`Effective Attack Level: ${p2EffectiveAttack}`);

  // Step Four: Calculate the Attack roll
  // Effective Attak Level * (Equipment Attack Bonus + 64)
  // Round down to [the] nearest integer

  let p2AttackRoll = Math.floor(
    p2EffectiveAttack * (activeBoosts[1][7].bonus + 64)
  );

  // Step Five: Calculate the other player's Defence roll
  // If the target is a player, use the formula
  // Def roll = Effective Defence * (Target Style Defence Bonus + 64)
  //
  // Wheras Effective Defence = (Defence Level + Defence Level Boost) * Prayer Bonus
  // Round down to nearest integer
  // +8 (Constant)
  // Round Down

  let p1effectiveDefence = Math.floor(
    Math.floor(
      activeBoosts[0][5].bonus * activeBoosts[0][2].bonus +
        activeBoosts[0][9].bonus +
        8
    )
  );

  console.log(`P1 Effective Defence: ${p1effectiveDefence}`);

  let p1DefenceRoll = p1effectiveDefence * (1 + 64);

  console.log(`P1 Defence Roll: ${p1DefenceRoll}`);

  // Step Six: Calculate the Hit Chance
  // If Attack Roll > Defence Roll
  let p2HitChance;

  if (p2AttackRoll > p1DefenceRoll) {
    p2HitChance = 1 - (p1DefenceRoll + 2) / (2 * (p2AttackRoll + 1));
  } else {
    p2HitChance = p2AttackRoll / (2 * (p1DefenceRoll + 1));
  }
  console.log(`P2 Hit Chance: ${p2HitChance}`);

  // Step Seven: Calculate the melee damage output
  // Average damage per attack = Maximum Hit Chance * Hit Chance / 2
  p2calculatedDPS = (p2MaximumHit * p2HitChance) / 2 / playerEquipment[1][4];

  p2calculatedDPS = Math.round(p2calculatedDPS * 1000000) / 1000000;

  console.log(`P2 Calculated DPS = ${p2calculatedDPS}`);

  p2dps.value = p2calculatedDPS;

  // Display DPS differentials
  dpsDifferentials();
};

const applyBoost = (id, player) => {
  console.log(`This boost is in group # ${boostElements[id].group}`);
  console.log(`The BoostID is ${id}. The PlayerID is ${player}`);
  // First, what group is the boost contained in? We need to know this to know where to apply the boost, to potion/prayer attack, strength, or defence
  // Next, what boost value actually needs to be applied?

  // Create local variables for manipulation
  localPlayer = player;
  localGroup = boostElements[id].group;

  // Subtract 1 from player and group to use in array
  localPlayer -= 1;
  localGroup -= 1;

  // If LocalGroup = 7 (Group 8 pre-conversion, meaning a Zamorak brew, then we need to apply the potion effects to all three skills)
  if (localGroup === 7) {
    if (localPlayer === 0) {
      //Player 1
      activeBoosts[localPlayer][3].bonus =
        parseInt(p1atk.value) +
        parseInt(p1atk.value) * definedBoosts[id].atkBoost +
        definedBoosts[id].atkInc;
      activeBoosts[localPlayer][4].bonus =
        parseInt(p1str.value) +
        parseInt(p1str.value) * definedBoosts[id].strBoost +
        definedBoosts[id].strInc;
      activeBoosts[localPlayer][5].bonus =
        parseInt(p1def.value) +
        parseInt(p1def.value) * definedBoosts[id].defBoost +
        definedBoosts[id].defInc;
      console.log(activeBoosts[localPlayer]);
    } else {
      //Player 2
      activeBoosts[localPlayer][3].bonus =
        parseInt(p2atk.value) +
        parseInt(p2atk.value) * definedBoosts[id].atkBoost +
        definedBoosts[id].atkInc;
      activeBoosts[localPlayer][4].bonus =
        parseInt(p2str.value) +
        parseInt(p2str.value) * definedBoosts[id].strBoost +
        definedBoosts[id].strInc;
      activeBoosts[localPlayer][5].bonus =
        parseInt(p2def.value) +
        parseInt(p2def.value) * definedBoosts[id].defBoost +
        definedBoosts[id].defInc;
      console.log(activeBoosts[localPlayer]);
    }

    // If  localGroup = 6 (Group 7 pre-conversion, meaning Chivalry or Piety), then we need to do something different, namely apply the three boosts from these prayers
  } else if (localGroup === 6) {
    activeBoosts[localPlayer][0].bonus = definedBoosts[id].atkBoost;
    activeBoosts[localPlayer][1].bonus = definedBoosts[id].strBoost;
    activeBoosts[localPlayer][2].bonus = definedBoosts[id].defBoost;
    console.log(activeBoosts[localPlayer]);
    // Else, just apply a solo boost from the regular Atk/Str/Def prayers
  } else if (localGroup === 3) {
    // Attack potion
    if (localPlayer === 0) {
      //Player 1
      activeBoosts[localPlayer][3].bonus =
        parseInt(p1atk.value) +
        parseInt(p1atk.value) * definedBoosts[id].boost +
        definedBoosts[id].inc;
      console.log(activeBoosts[localPlayer]);
    } else {
      //Player 2
      activeBoosts[localPlayer][3].bonus =
        parseInt(p2atk.value) +
        parseInt(p2atk.value) * definedBoosts[id].boost +
        definedBoosts[id].inc;
      console.log(activeBoosts[localPlayer]);
    }
  } else if (localGroup === 4) {
    // Strength potion
    if (localPlayer === 0) {
      //Player 1
      activeBoosts[localPlayer][4].bonus =
        parseInt(p1str.value) +
        parseInt(p1str.value) * definedBoosts[id].boost +
        definedBoosts[id].inc;
      console.log(activeBoosts[localPlayer]);
    } else {
      //Player 2
      activeBoosts[localPlayer][4].bonus =
        parseInt(p2str.value) +
        parseInt(p2str.value) * definedBoosts[id].boost +
        definedBoosts[id].inc;
      console.log(activeBoosts[localPlayer]);
    }
  } else if (localGroup === 5) {
    // Defence potion
    if (localPlayer === 0) {
      //Player 1
      activeBoosts[localPlayer][5].bonus =
        parseInt(p1def.value) +
        parseInt(p1def.value) * definedBoosts[id].boost +
        definedBoosts[id].inc;
      console.log(activeBoosts[localPlayer]);
    } else {
      //Player 2
      activeBoosts[localPlayer][5].bonus =
        parseInt(p2def.value) +
        parseInt(p2def.value) * definedBoosts[id].boost +
        definedBoosts[id].inc;
      console.log(activeBoosts[localPlayer]);
    }
  } else {
    activeBoosts[localPlayer][localGroup].bonus = definedBoosts[id].boost;
    console.log(activeBoosts[localPlayer]);
  }

  // Calculate player DPS once boosts are applied
  calcPlayerDPS();
};

const boostHighlight = (num, player) => {
  clearGroup(boostElements[num].group, player);

  // If the boost is group # 1,2, or 3, which are the Atk/Str/Def prayers, turn off the group # 7 Chivalry and Piety prayers
  if (
    boostElements[num].group === 1 ||
    boostElements[num].group === 2 ||
    boostElements[num].group === 3
  ) {
    clearGroup(7, player);
  }

  // If the boost is group # 1,2, or 3, which are the Atk/Str/Def prayers, turn off the group # 8 Zamorak Brew
  if (
    boostElements[num].group === 4 ||
    boostElements[num].group === 5 ||
    boostElements[num].group === 6
  ) {
    clearGroup(8, player);
  }
  // If the boost is group # 7, which is the Chivalry and Piety prayers, all other related prayer boosts will be "turned off"
  if (boostElements[num].group === 7) {
    for (let i = 1; i <= 3; i++) {
      clearGroup(i, player);
    }
    clearGroup(7, player);
  }
  // If the boost is group # 8, which is the Zamorak Brew, all other related potion boosts will be "turned off"
  if (boostElements[num].group === 8) {
    for (let i = 4; i <= 6; i++) {
      clearGroup(i, player);
    }
    clearGroup(8, player);
  }
};

const resetStats = (player) => {
  if (p1atk.value !== '' && p2atk.value !== '') {
    // Function only if the players' hiscores are already filled in/looked up
    for (let i = 1; i <= 8; i++) {
      clearGroup(i, player);
      resetBoost(i, player);
    }
    if (player === 1) {
      p1hp.value = playerLevels[0][3];
      activeBoosts[0][6] = playerLevels[0][3];
      equipWeapon(0, 0);
      p1weapon.selectedIndex = 0;
      p1cbstyle.selectedIndex = 0;
      p1skillstyle.selectedIndex = 0;
    } else {
      p2hp.value = playerLevels[1][3];
      activeBoosts[1][6] = playerLevels[1][3];
      equipWeapon(1, 0);
      p2weapon.selectedIndex = 0;
      p2cbstyle.selectedIndex = 0;
      p2skillstyle.selectedIndex = 0;
    }

    // Recalculate DPS
    calcPlayerDPS();
    // Recalculate HP differentials
    hpDifferentials();
  }
};

const colorize = (element, set) => {
  value = Math.abs(element.value);

  // If less than or equal to lower bound
  if (value <= differentialValues[set][0]) {
    // Green
    element.style.color = '#00994C';
    element.style.fontWeight = 'bold';
    // If greater than lower bound but less than or equal to middle bound
  } else if (
    value > differentialValues[set][0] &&
    value <= differentialValues[set][1]
  ) {
    // Yellow
    element.style.color = '#FFFF33';
    element.style.fontWeight = 'bold';
    // If greater than middle bound but less than upper bound
  } else if (
    value > differentialValues[set][1] &&
    value < differentialValues[set][2]
  ) {
    // Orange
    element.style.color = '#FFC300';
    element.style.fontWeight = 'bold';
    // If greater than or equal to upper bound
  } else if (value >= differentialValues[set][2]) {
    // Red
    element.style.color = '#FF0000';
    element.style.fontWeight = 'bold';
  }
};

const assignEventListeners = () => {
  boostElements.forEach((elem, index) => {
    const element = document.getElementById(elem.name);
    element.addEventListener('click', () => {
      // Do nothing if the hiscores names aren't looked up (specifically, if the attack values aren't filled in yet)
      if (p1atk.value === '' || p2atk.value === '') {
        return;
      }

      if (elem.status === 0) {
        boostHighlight(elem.boostID, elem.player);
        elem.status = 1;
        element.style.border = '1px red solid';
        applyBoost(elem.boostID, elem.player);

        // Play the appropriate sound
        playAudio(elem.audioID);
      } else {
        elem.status = 0;
        clearGroup(elem.group, elem.player);
        resetBoost(elem.group, elem.player);

        // If this is a prayer, play the prayer off sound
        if (elem.type === 'prayer') {
          playAudio(11);
        }
      }
    });
  });
  //});
};

const resetBoost = (group, player) => {
  let localPlayer = player - 1;
  let localGroup = group - 1;
  let style = group;
  if (group > 3 && group < 7) {
    // Modifiying the value to allow potions (which use higher values)
    // to access the correct style from the array
    style = localGroup - 3;
  }
  // Single potion clears
  if (group > 3 && group < 7) {
    activeBoosts[localPlayer][localGroup].bonus =
      playerLevels[localPlayer][style];
  }
  // Single prayer clears
  if (group > 0 && group < 4) {
    activeBoosts[localPlayer][localGroup].bonus = 1;
  }
  // Multi prayer clears
  if (group === 7) {
    activeBoosts[localPlayer][0].bonus = 1;
    activeBoosts[localPlayer][1].bonus = 1;
    activeBoosts[localPlayer][2].bonus = 1;
  }
  // Zammy Brew clear
  if (group === 8) {
    activeBoosts[localPlayer][3].bonus = playerLevels[localPlayer][0];
    activeBoosts[localPlayer][4].bonus = playerLevels[localPlayer][1];
    activeBoosts[localPlayer][5].bonus = playerLevels[localPlayer][2];
  }

  // Calculate player DPS once boosts are reset
  calcPlayerDPS();

  // Show active boosts in console
  //console.log(activeBoosts[localPlayer]);
};

const clearGroup = (num, player) => {
  const groupElements = boostElements.filter(
    (element) => element.group === num
  );

  groupElements.forEach((elem) => {
    if (elem.player === player) {
      elem.status = 0;
      const element = document.getElementById(elem.name);
      element.style.border = '0px transparent';
    }
  });
};

const assignNewEventListeners = () => {
  // In HP Boosts, the Guthix Rest is # 0. Newer boosts will have higher numbers.
  p1guthixrest.addEventListener('click', () => {
    if (hpBoosts[0].p1status === 0) {
      hpBoosts[0].p1status = 1;
      allBoostElementsArray[18].style.border = '1px red solid';
      applyHitpointBoost(hpBoosts[0], 0);
    } else {
      hpBoosts[0].p1status = 0;
      allBoostElementsArray[18].style.border = '0px transparent';
      resetHitpoints(0);
    }
  });
  p2guthixrest.addEventListener('click', () => {
    if (hpBoosts[0].p2status === 0) {
      hpBoosts[0].p2status = 1;
      allBoostElementsArray[38].style.border = '1px red solid';
      applyHitpointBoost(hpBoosts[0], 1);
    } else {
      hpBoosts[0].p2status = 0;
      allBoostElementsArray[38].style.border = '0px transparent';
      resetHitpoints(1);
    }
  });
  p1bloodybracer.addEventListener('click', () => {
    if (hpBoosts[1].p1status === 0) {
      hpBoosts[1].p1status = 1;
      allBoostElementsArray[19].style.border = '1px red solid';
      applyHitpointBoost(hpBoosts[1], 0);
    } else {
      hpBoosts[1].p1status = 0;
      allBoostElementsArray[19].style.border = '0px transparent';
      resetHitpoints(0);
    }
  });
  p2bloodybracer.addEventListener('click', () => {
    if (hpBoosts[1].p2status === 0) {
      hpBoosts[1].p2status = 1;
      allBoostElementsArray[39].style.border = '1px red solid';
      applyHitpointBoost(hpBoosts[1], 1);
    } else {
      hpBoosts[1].p2status = 0;
      allBoostElementsArray[39].style.border = '0px transparent';
      resetHitpoints(1);
    }
  });
  allBoostElementsArray.forEach((allBoostEl, index) => {
    allBoostEl.addEventListener('click', () => {
      // if (index > 18) {
      //   index -= 19;
      // }
    });
  });
};

const applyHitpointBoost = (hpBoost, player) => {
  playAudio(hpBoost.audioID);
  activeBoosts[player][6] = playerLevels[player][3] + hpBoost.boost;
  if (player === 0) {
    p1hp.value = activeBoosts[player][6];
    hpDifferentials();
  } else {
    p2hp.value = activeBoosts[player][6];
    hpDifferentials();
  }
};

const resetHitpoints = (player) => {
  activeBoosts[player][6] = playerLevels[player][3];
  if (player === 0) {
    p1hp.value = activeBoosts[player][6];
    hpDifferentials();
  } else {
    p2hp.value = activeBoosts[player][6];
    hpDifferentials();
  }
};

const hpDifferentials = () => {
  p1hpdiff.value = parseInt(p1hp.value) - parseInt(p2hp.value);
  p2hpdiff.value = parseInt(p2hp.value) - parseInt(p1hp.value);

  colorize(p1hpdiff, 1);
  colorize(p2hpdiff, 1);

  if (p1hpdiff.value > 0) {
    p1hpdiff.value = `+${p1hpdiff.value}`;
  }

  if (p2hpdiff.value > 0) {
    p2hpdiff.value = `+${p2hpdiff.value}`;
  }
};

const dpsDifferentials = () => {
  p1dpsdiff.value =
    Math.round((p1calculatedDPS - p2calculatedDPS) * 1000) / 1000;

  p2dpsdiff.value =
    Math.round((p2calculatedDPS - p1calculatedDPS) * 1000) / 1000;

  colorize(p1dpsdiff, 0);
  colorize(p2dpsdiff, 0);

  if (p1dpsdiff.value > 0) {
    p1dpsdiff.value = `+${p1dpsdiff.value}`;
  }

  if (p2dpsdiff.value > 0) {
    p2dpsdiff.value = `+${p2dpsdiff.value}`;
  }
};

const playAudio = (audioIndex) => {
  if (p1atk.value !== '' && p2atk.value !== '') {
    // Now that we have both players' initial stats, calculate their initial DPS values
    audioList[audioIndex].play();
  }
};

const equipWeapon = (player, weaponID) => {
  // Melee Strength
  playerEquipment[player][0] = definedWeapons[weaponID].meleeStr;
  // Stab
  playerEquipment[player][1] = definedWeapons[weaponID].stab;
  // Slash
  playerEquipment[player][2] = definedWeapons[weaponID].slash;
  // Crush
  playerEquipment[player][3] = definedWeapons[weaponID].crush;
  // Speed
  playerEquipment[player][4] = definedWeapons[weaponID].speed;

  console.log(
    `Active Weapon: ${definedWeapons[weaponID].name}, Melee Str:${definedWeapons[weaponID].meleeStr}`
  );
  // By default, pick the default combat style for the selected weapon. A DDS would for example use Stab.
  changeCombatStyle(player, definedWeapons[weaponID].defaultCBStyle);

  if (player === 0) {
    // Melee Strength
    p1melstr.value = definedWeapons[weaponID].meleeStr;
    // Stab
    p1stab.value = definedWeapons[weaponID].stab;
    // Slash
    p1slash.value = definedWeapons[weaponID].slash;
    // Crush
    p1crush.value = definedWeapons[weaponID].crush;
    // Set Style Selector to Selected Style
    p1cbstyle.selectedIndex = definedWeapons[weaponID].defaultCBStyle + 1;
    // Set Skill Style Selector to Default Weapon Style
    p1skillstyle.selectedIndex = definedWeapons[weaponID].defaultSkillStyle;
  } else {
    // Melee Strength
    p2melstr.value = definedWeapons[weaponID].meleeStr;
    // Stab
    p2stab.value = definedWeapons[weaponID].stab;
    // Slash
    p2slash.value = definedWeapons[weaponID].slash;
    // Crush
    p2crush.value = definedWeapons[weaponID].crush;
    // Set Style Selector to Default Weapon Style
    p2cbstyle.selectedIndex = definedWeapons[weaponID].defaultCBStyle + 1;
    // Set Skill Style Selector to Default Weapon Style
    p2skillstyle.selectedIndex = definedWeapons[weaponID].defaultSkillStyle;
  }
};

const changeCombatStyle = (player, styleID) => {
  // Set the player's combat style to the selected one
  // Use the stored values in the array to give the correct value
  activeBoosts[player][7].bonus = playerEquipment[player][styleID];
  console.log(`Now using combat style ${definedStyles[styleID]}`);
  console.log(`Active Weapon Style Bonus: ${activeBoosts[player][7].bonus}`);
  calcPlayerDPS();

  if (player === 0) {
    // Style
    p1activestyle.value = definedStyles[styleID];
  } else {
    // Style
    p2activestyle.value = definedStyles[styleID];
  }
};

const changeCombatSkillStyle = (player, styleID) => {
  // This changes the player's "Skill Style", e.g.
  // Accurate, Aggressive, or Defensive
  // This is important because it has an effect on DPS
  // It was not originally being accounted for! Oops!

  activeBoosts[player][8].bonus = definedSkillStyleValues[styleID];

  // Apply the defense bonus if using defensive
  if (styleID == '3') {
    activeBoosts[player][9].bonus = 3;
  } else {
    activeBoosts[player][9].bonus = 0;
  }
  console.log(`Now using skill style ${definedSkillStyles[styleID]}`);
  calcPlayerDPS();

  if (player === 0) {
    // Style
    p1activeskillstyle.value = definedSkillStyles[styleID];
  } else {
    // Style
    p2activeskillstyle.value = definedSkillStyles[styleID];
  }
};
