const personNameEl = document.getElementById('person');

// Pick a random hunter name
const hunterFirst = randomHunterNames.first[ranBetween(0, 74)];
const hunterLast = randomHunterNames.last[ranBetween(0, 74)];

personNameEl.innerHTML = `Name: ${hunterFirst} ${hunterLast}`;
