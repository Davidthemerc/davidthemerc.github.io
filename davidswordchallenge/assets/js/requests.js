const lookupWord = async (word) => {
  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
  );

  if (response.status === 200) {
    const definition = await response.json();
    console.log(definition);

    submitWord(currentWord.toLowerCase());
  } else if (response.status === 404) {
    displayMessage('Sorry, this is not a real word!', statusEl);
  }
};
