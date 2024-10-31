async function hiscores(playerName) {
  const proxyUrl = 'https://e8gsqorhc2.execute-api.us-east-2.amazonaws.com/';

  const url = `hiscores?player=Spaghett ii`;

  try {
    const response = await fetch(proxyUrl + url, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    const data = await response.text();
    const lines = data.split('\n');

    // OSRS API usually lists skills in a specific order: Attack, Defence, Strength, etc.
    const killcount = lines[80].split(',')[1]; // Get the Sarachnis kill count

    console.log(`Sarachnis Killcount: ${killcount}`);

    // Set KC display element
    kcDisplayEl.innerHTML = `Current KC: ${killcount}`;

    // Separate guesses array
    separateGuessesByThreshold(guesses, killcount);
    console.log('Contender Array:');
    console.log(contenderArray);
    console.log('Shame Array:');
    console.log(shameArray);

    // Populate list of contenders
    populateContenders(killcount);

    // Populate list of shamed
    populateShamed(killcount);
  } catch (error) {
    console.error('Error fetching player stats:', error);
  }
}

// Examples of the list elements in HTML
//<p class="list">Waterrboy (5188 KC) (21)</p>
//<p class="list">MakFM (5039 KC) (-128)</p>

const populateContenders = (kc) => {
  let displayVal;
  contenderArray.forEach((contender, index) => {
    const conEl = document.createElement('p');
    conEl.className = 'list';
    if (kc - contender.guess > 0) {
      displayVal = `-${Math.abs(kc - contender.guess)}`;
    } else {
      displayVal = `+${Math.abs(kc - contender.guess)}`;
    }

    if (Math.abs(kc - contender.guess) <= 25) {
      conEl.classList += ' green';
    }

    conEl.innerHTML = `<b>${index + 1}.</b> <i>${
      contender.name
    }</i> - Guess: <u>${contender.guess}</u> (${displayVal})`;

    if (contender.name === 'Lord Phood') {
      conEl.innerHTML = `<b>${index + 1}.</b> <i>${
        contender.name
      }</i> <img class="frog" src="assets/img/froggy.png"> - Guess: <u>${
        contender.guess
      }</u> (${displayVal})`;
    }

    if (contender.name === 'Penscrawl' && contender.guess === 7362) {
      conEl.innerHTML = `<b>${index + 1}.</b> <i>${contender.name} "Next KC" ${
        contender.guess
      }</u> (${displayVal})`;
    }

    contendersEl.appendChild(conEl);
  });
};

const populateShamed = (kc) => {
  let displayVal;
  shameArray.forEach((shame, index) => {
    const shamedEl = document.createElement('p');
    shamedEl.className = 'listshame';
    if (kc - shame.guess > 0) {
      displayVal = `-${Math.abs(kc - shame.guess)}`;
    } else {
      displayVal = `+${Math.abs(kc - shame.guess)}`;
    }
    shamedEl.innerHTML = `<b>${index + 1}.</b> <i>${
      shame.name
    }</i> - Guess: <u>${shame.guess}</u> (${displayVal})`;

    if (shame.name === 'Lord Phood') {
      shamedEl.innerHTML = `<b>${index + 1}.</b> <i>${
        shame.name
      }</i> <img class="frog" src="assets/img/froggy.png"> - Guess: <u>${
        shame.guess
      }</u> (${displayVal})`;
    }

    shameEl.appendChild(shamedEl);
  });
};

const separateGuessesByThreshold = (guesses, kc) => {
  guesses.forEach((entry) => {
    if (entry.guess >= kc || Math.abs(entry.guess - kc) <= 25) {
      contenderArray.push(entry);
    } else {
      shameArray.push(entry);
    }

    // Sort arrays by guess in ascending order
    contenderArray.sort((a, b) => a.guess - b.guess);
    shameArray.sort((a, b) => a.guess - b.guess);
  });

  return { contenderArray, shameArray };
};
