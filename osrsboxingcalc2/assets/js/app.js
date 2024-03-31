const p1rsn = document.getElementById('p1rsn');
const p1lookup = document.getElementById('p1lookup');
const p1atk = document.getElementById('p1atk');
const p1str = document.getElementById('p1str');
const p1def = document.getElementById('p1def');
const p1hp = document.getElementById('p1hp');
const p1dps = document.getElementById('p1dps');
const p1dpsdiff = document.getElementById('p1dpsdiff');
const p1hpdiff = document.getElementById('p1hpdiff');
const p1defpray1 = document.getElementById('p1defpray1');
const p1strpray1 = document.getElementById('p1strpray1');
const p1atkpray1 = document.getElementById('p1atkpray1');
const p1defpray2 = document.getElementById('p1defpray2');
const p1strpray2 = document.getElementById('p1strpray2');
const p1atkpray2 = document.getElementById('p1atkpray2');
const p1defpray3 = document.getElementById('p1defpray3');
const p1strpray3 = document.getElementById('p1strpray3');
const p1atkpray3 = document.getElementById('p1atkpray3');
const p1melpray1 = document.getElementById('p1atkpray1');
const p1melpray2 = document.getElementById('p1atkpray2');
const p1atkpot1 = document.getElementById('p1atkpot1');
const p1strpot1 = document.getElementById('p1strpot1');
const p1defpot1 = document.getElementById('p1defpot1');
const p1atkpot2 = document.getElementById('p1atkpot2');
const p1strpot2 = document.getElementById('p1strpot2');
const p1defpot2 = document.getElementById('p1defpot2');
const p1zampot = document.getElementById('p1zampot');
const p1guthixrest = document.getElementById('p1guthixrest');
const p1bloodybracer = document.getElementById('p1bloodybracer');
const p1weapon = document.getElementById('p1weapon');
const p1cbstyle = document.getElementById('p1cbstyle');
const p1skillstyle = document.getElementById('p1skillstyle');
const p1activestyle = document.getElementById('p1activestyle');
const p1activeskillstyle = document.getElementById('p1activeskillstyle');
const p1melstr = document.getElementById('p1melstr');
const p1stab = document.getElementById('p1stab');
const p1slash = document.getElementById('p1slash');
const p1crush = document.getElementById('p1crush');
const p2rsn = document.getElementById('p2rsn');
const p2lookup = document.getElementById('p2lookup');
const p2atk = document.getElementById('p2atk');
const p2str = document.getElementById('p2str');
const p2def = document.getElementById('p2def');
const p2hp = document.getElementById('p2hp');
const p2dps = document.getElementById('p2dps');
const p2dpsdiff = document.getElementById('p2dpsdiff');
const p2hpdiff = document.getElementById('p2hpdiff');
const p2defpray1 = document.getElementById('p2defpray1');
const p2strpray1 = document.getElementById('p2strpray1');
const p2atkpray1 = document.getElementById('p2atkpray1');
const p2defpray2 = document.getElementById('p2defpray2');
const p2strpray2 = document.getElementById('p2strpray2');
const p2atkpray2 = document.getElementById('p2atkpray2');
const p2defpray3 = document.getElementById('p2defpray3');
const p2strpray3 = document.getElementById('p2strpray3');
const p2atkpray3 = document.getElementById('p2atkpray3');
const p2melpray1 = document.getElementById('p2atkpray1');
const p2melpray2 = document.getElementById('p2atkpray2');
const p2atkpot1 = document.getElementById('p2atkpot1');
const p2strpot1 = document.getElementById('p2strpot1');
const p2defpot1 = document.getElementById('p2defpot1');
const p2atkpot2 = document.getElementById('p2atkpot2');
const p2strpot2 = document.getElementById('p2strpot2');
const p2defpot2 = document.getElementById('p2defpot2');
const p2zampot = document.getElementById('p2zampot');
const p2guthixrest = document.getElementById('p2guthixrest');
const p2bloodybracer = document.getElementById('p2bloodybracer');
const p2weapon = document.getElementById('p2weapon');
const p2cbstyle = document.getElementById('p2cbstyle');
const p2skillstyle = document.getElementById('p2skillstyle');
const p2activestyle = document.getElementById('p2activestyle');
const p2activeskillstyle = document.getElementById('p2activeskillstyle');
const p2melstr = document.getElementById('p2melstr');
const p2stab = document.getElementById('p2stab');
const p2slash = document.getElementById('p2slash');
const p2crush = document.getElementById('p2crush');
const p1reset = document.getElementById('p1reset');
const p2reset = document.getElementById('p2reset');
const statusEl = document.getElementById('status');

function handleKeyPress(event) {
  // Check if the key pressed is Enter (key code 13)
  if (event.keyCode === 13) {
    // Execute your specific JavaScript code here
    hiscores(p1rsn.value, 1);
    hiscores(p2rsn.value, 2);
    // Prevent the default form submission behavior
    event.preventDefault();
  }
}

// Competitor One RSN lookup code - when the user clicks lookup, look up the RSN on the OSRS hiscores
p1lookup.addEventListener('click', () => {
  // Do not execute if both names are not filled out
  if (p1rsn.value === '' || p2rsn.value === '') {
    return;
  }

  hiscores(p1rsn.value, 1);
  hiscores(p2rsn.value, 2);
});

// Competitor Two RSN lookup code - when the user clicks lookup, look up the RSN on the OSRS hiscores
p2lookup.addEventListener('click', () => {
  // Do not execute if both names are not filled out
  if (p1rsn.value === '' || p2rsn.value === '') {
    return;
  }

  hiscores(p1rsn.value, 1);
  hiscores(p2rsn.value, 2);
});

p1reset.addEventListener('click', () => {
  resetStats(1);
});

p2reset.addEventListener('click', () => {
  resetStats(2);
});

// Assign event listeners to the prayers and potions
assignEventListeners();

// Assign event listeners to the Guthix rest and more (new stuff)
assignNewEventListeners();

// Assign event listeners to the player one weapon selection menu
p1weapon.addEventListener('change', (sel) => {
  // Do not execute if both names are not filled out
  if (p1rsn.value === '' || p2rsn.value === '') {
    return;
  }

  console.log(sel.target.value);
  // Run the equip weapon function, 0 = Player 1, sel = selected weapon
  equipWeapon(0, parseInt(sel.target.value));
});

// Assign event listeners to the player one combat style selection menu
p1cbstyle.addEventListener('change', (sel) => {
  // Do not execute if both names are not filled out
  if (p1rsn.value === '' || p2rsn.value === '') {
    return;
  }
  // Run the equip weapon function, 0 = Player 1, sel = selected weapon
  changeCombatStyle(0, sel.target.value);
});

// Assign event listeners to the player one combat skill style selection menu
p1skillstyle.addEventListener('change', (sel) => {
  // Do not execute if both names are not filled out
  if (p1rsn.value === '' || p2rsn.value === '') {
    return;
  }
  // Run the equip weapon function, 0 = Player 1, sel = selected weapon
  changeCombatSkillStyle(0, sel.target.value);
});

// DIVIDER - Player Two New Event Listeners past this point

// Assign event listeners to the player two weapon selection menu
p2weapon.addEventListener('change', (sel) => {
  // Do not execute if both names are not filled out
  if (p1rsn.value === '' || p2rsn.value === '') {
    return;
  }

  console.log(sel.target.value);
  // Run the equip weapon function, 0 = Player 1, sel = selected weapon
  equipWeapon(1, sel.target.value);
});

// Assign event listeners to the player two combat style selection menu
p2cbstyle.addEventListener('change', (sel) => {
  // Do not execute if both names are not filled out
  if (p1rsn.value === '' || p2rsn.value === '') {
    return;
  }
  // Run the equip weapon function, 0 = Player 1, sel = selected weapon
  changeCombatStyle(1, sel.target.value);
});

// Assign event listeners to the player two combat skill style selection menu
p2skillstyle.addEventListener('change', (sel) => {
  // Do not execute if both names are not filled out
  if (p1rsn.value === '' || p2rsn.value === '') {
    return;
  }
  // Run the equip weapon function, 0 = Player 1, sel = selected weapon
  changeCombatSkillStyle(1, sel.target.value);
});
