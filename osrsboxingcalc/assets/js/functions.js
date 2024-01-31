async function hiscores(playerName, player) {
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

    // OSRS API usually lists skills in a specific order: Attack, Defense, Strength, etc.
    const attack = lines[1].split(',')[1]; // Attack is typically on the first line
    const defense = lines[2].split(',')[1]; // Defense is typically on the second line
    const strength = lines[3].split(',')[1]; // Strength is typically on the third line

    if (player === 1) {
      p1atk.value = attack;
      p1def.value = defense;
      p1str.value = strength;
      p1matk.value = attack;
      p1mdef.value = defense;
      p1mstr.value = strength;
    } else {
      p2atk.value = attack;
      p2def.value = defense;
      p2str.value = strength;
      p2matk.value = attack;
      p2mdef.value = defense;
      p2mstr.value = strength;
    }

    calcStatDif(1);
    calcStatDif(2);

    return { attack, defense, strength };
  } catch (error) {
    console.error('Error fetching player stats:', error);
  }
}

const resetStats = (player) => {
  if (player === 1) {
    p1matk.value = p1atk.value;
    p1mdef.value = p1def.value;
    p1mstr.value = p1str.value;
    calcStatDif(1);
    for (let i = 1; i <= 6; i++) {
      clearGroup(i);
    }
  } else {
    p2matk.value = p2atk.value;
    p2mdef.value = p2def.value;
    p2mstr.value = p2str.value;
    calcStatDif(2);
    for (let i = 1; i <= 7; i++) {
      clearGroup(i);
    }
  }
};

const calcStatDif = (player) => {
  if (player === 1) {
    p1atkdif.value = p1matk.value - p2matk.value;
    p1defdif.value = p1mdef.value - p2mdef.value;
    p1strdif.value = p1mstr.value - p2mstr.value;

    if (p1atkdif.value > 0) {
      p1atkdif.value = `+${p1atkdif.value}`;
    }

    if (Math.abs(p1atkdif.value) >= 0) {
      colorize(p1atkdif);
    }

    if (p1defdif.value > 0) {
      p1defdif.value = `+${p1defdif.value}`;
    }

    if (Math.abs(p1defdif.value) >= 0) {
      colorize(p1defdif);
    }

    if (p1strdif.value > 0) {
      p1strdif.value = `+${p1strdif.value}`;
    }

    if (Math.abs(p1strdif.value) >= 0) {
      colorize(p1strdif);
    }
  } else {
    p2atkdif.value = p2matk.value - p1matk.value;
    p2defdif.value = p2mdef.value - p1mdef.value;
    p2strdif.value = p2mstr.value - p1mstr.value;

    if (p2atkdif.value > 0) {
      p2atkdif.value = `+${p2atkdif.value}`;
    }

    if (Math.abs(p2atkdif.value) >= 0) {
      colorize(p2atkdif);
    }

    if (p2defdif.value > 0) {
      p2defdif.value = `+${p2defdif.value}`;
    }

    if (Math.abs(p2defdif.value) >= 0) {
      colorize(p2defdif);
    }

    if (p2strdif.value > 0) {
      p2strdif.value = `+${p2strdif.value}`;
    }

    if (Math.abs(p2strdif.value) >= 0) {
      colorize(p2strdif);
    }
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

const applyBoost = (num, player) => {
  // Apply the boost from the array based on the passed-in value
  const localBoost = boosts[num];

  // Apply it to the correct player
  if (player === 1) {
    // Reset the approriate modified values so we're not recursively increasing it
    if (boostElements[num].group === 1 || boostElements[num].group === 4) {
      p1matk.value = p1atk.value;

      clearGroup(1);
      clearGroup(4);
      clearGroup(7);
    }
    if (boostElements[num].group === 2 || boostElements[num].group === 5) {
      p1mstr.value = p1str.value;
      clearGroup(2);
      clearGroup(5);
      clearGroup(7);
    }
    if (boostElements[num].group === 3 || boostElements[num].group === 6) {
      p1mdef.value = p1def.value;
      clearGroup(3);
      clearGroup(6);
      clearGroup(7);
    }

    if (boostElements[num].group === 7) {
      p1matk.value = p1atk.value;
      p1mstr.value = p1str.value;
      p1mdef.value = p1def.value;
      for (let i = 1; i <= 6; i++) {
        clearGroup(i);
      }
    }

    const newAttack =
      parseInt(p1matk.value) * (parseFloat(localBoost.atkBoost) + 1) +
      parseInt(localBoost.atkInc);
    p1matk.value = parseInt(newAttack);
    const newStrength =
      parseInt(p1mstr.value) * (parseFloat(localBoost.strBoost) + 1) +
      parseInt(localBoost.strInc);
    p1mstr.value = parseInt(newStrength);
    const newDefense =
      parseInt(p1mdef.value) * (parseFloat(localBoost.defBoost) + 1) +
      parseInt(localBoost.defInc);
    p1mdef.value = parseInt(newDefense);

    calcStatDif(1);
    calcStatDif(2);
  } else {
    if (boostElements[num].group === 1 || boostElements[num].group === 4) {
      p2matk.value = p2atk.value;
      clearGroup(1);
      clearGroup(4);
      clearGroup(7);
    }
    if (boostElements[num].group === 2 || boostElements[num].group === 5) {
      p2mstr.value = p2str.value;
      clearGroup(2);
      clearGroup(5);
      clearGroup(7);
    }
    if (boostElements[num].group === 3 || boostElements[num].group === 6) {
      p2mdef.value = p2def.value;
      clearGroup(3);
      clearGroup(6);
      clearGroup(7);
    }

    if (boostElements[num].group === 7) {
      p2matk.value = p2atk.value;
      p2mstr.value = p2str.value;
      p2mdef.value = p2def.value;
    }

    const newAttack =
      parseInt(p2matk.value) * (parseFloat(localBoost.atkBoost) + 1) +
      parseInt(localBoost.atkInc);
    p2matk.value = parseInt(newAttack);
    const newStrength =
      parseInt(p2mstr.value) * (parseFloat(localBoost.strBoost) + 1) +
      parseInt(localBoost.strInc);
    p2mstr.value = parseInt(newStrength);
    const newDefense =
      parseInt(p2mdef.value) * (parseFloat(localBoost.defBoost) + 1) +
      parseInt(localBoost.defInc);
    p2mdef.value = parseInt(newDefense);

    calcStatDif(1);
    calcStatDif(2);
  }
};

const assignEventListeners = () => {
  boostElements.forEach((elem) => {
    const element = document.getElementById(elem.name);
    element.addEventListener('click', () => {
      //console.log(elem.boostID);
      //console.log(`Player ${elem.player}`);
      applyBoost(elem.boostID, elem.player);
      element.style.border = '1px red solid';
    });
  });
  //});
};

const clearGroup = (num) => {
  const groupElements = boostElements.filter(
    (element) => element.group === num
  );

  groupElements.forEach((elem) => {
    const element = document.getElementById(elem.name);
    element.style.border = '0px transparent';
  });
};
