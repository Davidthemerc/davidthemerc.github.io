const getWord = async () => {
  const response = await fetch(`https://puzzle.mead.io/puzzle?wordCount=1`);

  if (response.status === 200) {
    const data = await response.json();
    displayWord(data.puzzle);
    saveWord(data.puzzle);
  } else {
    throw new Error('Unable to get word');
  }
};
