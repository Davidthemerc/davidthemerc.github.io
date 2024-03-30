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
