const lookupWord = async (currentWord) => {
  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${currentWord}`
  );

  if (response.status === 200) {
    const definition = await response.json();

    definitionEl.innerHTML = '';

    definition.forEach((defo, index) => {
      const defName = document.createElement('span');
      const br = document.createElement('br');
      defName.className = `defName`;
      defName.textContent = `${defo.word} (Def. ${index + 1})`;
      definitionEl.appendChild(defName);
      definitionEl.appendChild(br);

      defo.meanings.forEach((mean) => {
        const part = document.createElement('span');
        const br = document.createElement('br');
        part.className = 'part';
        part.textContent = ` (Part: ${mean.partOfSpeech}) `;
        definitionEl.appendChild(part);
        definitionEl.appendChild(br);

        mean.definitions.forEach((defo2) => {
          const defoFronter = document.createElement('span');
          const defoName = document.createElement('span');
          const br = document.createElement('br');
          defoFronter.className = 'defoFronter';
          defoName.className = 'actDef';
          defoFronter.textContent = `Def.:`;
          defoName.textContent = ` ${defo2.definition}`;
          definitionEl.appendChild(defoFronter);
          definitionEl.appendChild(defoName);
          definitionEl.appendChild(br);
        });
      });
    });
  } else {
    if (response.status === 404) {
      console.log('Fuck, this word has no definition!');
    } else {
      throw new Error('Unable to get definition');
    }
  }
};
