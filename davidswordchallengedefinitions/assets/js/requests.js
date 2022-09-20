const lookupWord = async (word) => {
  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
  );
  let definition = [];
  let rightDefinedWord = word;

  // Only continue here if the word was found!
  if (response.status === 200) {
    definition = await response.json();

    let randomWords = [
      rightDefinedWord,
      words[ranBetween(0, 769)],
      words[ranBetween(770, 1540)],
      words[ranBetween(1541, 2309)],
    ];

    shuffle(randomWords);

    quizEl.innerHTML = '';

    displayMessage(
      'Please select the correct definition of the word below:',
      quizEl
    );
    randomWords.forEach((word) => {
      basicLookupWord(word, rightDefinedWord);
    });

    // Else, the user can't proceed
  } else if (response.status === 404) {
    displayMessage('Sorry, this is not a real word!', statusEl);
    cheaterStopper = 0;
  }
};

const basicLookupWord = async (bword, rightDefinedWord) => {
  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${bword}`
  );

  if (response.status === 200) {
    const definition = await response.json();

    definitionsDOM(definition, bword, rightDefinedWord);
  } else if (response.status === 404) {
    // Do nothing, sorry
  }
};
