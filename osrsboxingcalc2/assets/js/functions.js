async function hiscores(playerName, player) {
  // Do nothing if both names aren't filled out

  // Using a CORS proxy
  const proxyUrl = 'https://corsproxy.io/?';

  const url = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player=${playerName}`;

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
      activeBoosts[1][3].bonus = parseInt(attack);
      activeBoosts[1][4].bonus = parseInt(strength);
      activeBoosts[1][5].bonus = parseInt(defence);
    }

    if (p1atk.value !== '' && p2atk.value !== '') {
      // Now that we have both players' initial stats, calculate their initial DPS values
      calcPlayerDPS();
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
    // Formula = (p1str + p1strlvlboost) * p1strprayboost
    activeBoosts[0][4].bonus * activeBoosts[0][1].bonus
  );
  console.log(`P1 Effective Strength:${p1EffectiveStrength}`);

  // Step Two: Calculate the maximum hit.
  // Effective Strength * (0 + 64, Boxing Gloves have 0 Str Bonus) + 320 / 640 , Round Down,
  // * Target Specific Gear Bonus (Should be 1, Boxing Gloves have 1 Slash Defence)
  // Round Down to nearest integer

  let p1MaximumHit = Math.floor(
    Math.floor((p1EffectiveStrength * (0 + 64) + 320) / 640) * 1
  );
  console.log(`Max Hit:${p1MaximumHit}`);

  // Step Three: Calculate the effective attack level
  // (Attack level + Attack Level boost) * prayer bonus
  // Round down to nearest integer
  // +3 if using accurate attack style - should be mandated
  // +8 (Constant)
  // Round Down

  let p1EffectiveAttack = Math.floor(
    Math.floor(activeBoosts[0][3].bonus * activeBoosts[0][0].bonus) + 3 + 8
  );

  console.log(`Effective Attack Level: ${p1EffectiveAttack}`);

  // Step Four: Calculate the Attack roll
  // Effective Attak Level * (Equipment Attack Bonus + 64)
  // Round down to [the] nearest integer

  let p1AttackRoll = Math.floor(p1EffectiveAttack * (0 + 64));

  // Step Five: Calculate the other player's Defence roll
  // If the target is a player, use the formula
  // Def roll = Effective Defence * (Target Style Defence Bonus + 64)
  //
  // Wheras Effective Defence = (Defense Level + Defense Level Boost) * Prayer Bonus
  // Round down to nearest integer
  // +8 (Constant)
  // Round Down

  let p2effectiveDefence = activeBoosts[1][2];

  let p2DefenseRoll = p2effectiveDefence * (1 + 64);
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
  calcPlayerDPS();
  for (let i = 1; i <= 8; i++) {
    clearGroup(i, player);
    resetBoost(i, player);
  }
};

const colorize = (element) => {
  value = Math.abs(element.value);
  if (value <= 3 || value == 0) {
    // Green
    element.style.color = '#00994C';
    element.style.fontWeight = 'bold';
  } else if (value > 3) {
    // Red
    element.style.color = '#FF0000';
    element.style.fontWeight = 'bold';
  }
};

const assignEventListeners = () => {
  boostElements.forEach((elem) => {
    const element = document.getElementById(elem.name);
    element.addEventListener('click', () => {
      // Do nothing if the hiscores names aren't looked up (specifically, if the attack values aren't filled in yet)
      if (p1atk.value === '' || p2atk.value === '') {
        return;
      }

      if (elem.status === 0) {
        //boostHighlight(elem.boostID, elem.player);
        elem.status = 1;
        element.style.border = '1px red solid';
        applyBoost(elem.boostID, elem.player);
      } else {
        elem.status = 0;
        clearGroup(elem.group, elem.player);
        resetBoost(elem.group, elem.player);
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
  console.log(activeBoosts[localPlayer]);
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
