//display value based on the randomAngle
const valueGenerator = (angleValue) => {
  for (let i of rotationValues) {
    //if the angleValue is between min and max then display it
    if (angleValue >= i.minDegree && angleValue <= i.maxDegree) {
      if (i.value === 0) {
        displayMessage('Bankrupt!', statusEl, 3);
        spinBtn.disabled = false;
        activeSpin = 0;
        // Player is totally fucked. Set money to 0.
        money = 0;
        break;
      }
      displayMessage(`$${i.value}`, statusEl);
      break;
    }
  }
};

const fixer = (val) => {
  myChart.options.rotation = val;
  myChart.update();
};

const spinner = () => {
  activeSpin = 1;
  spinBtn.disabled = true;
  //Empty final value
  displayMessage(`Spinning...`, statusEl, 2);
  //Generate random degrees to stop at
  let randomDegree = Math.floor(Math.random() * (355 - 0 + 1) + 0);
  //Interval for rotation animation
  let rotationInterval = window.setInterval(() => {
    //Set rotation for piechart
    /*
      Initially to make the piechart rotate faster we set resultValue to 101 so it rotates 101 degrees at a time and this reduces by 1 with every count. Eventually on last rotation we rotate by 1 degree at a time.
      */
    myChart.options.rotation = myChart.options.rotation + resultValue;
    //Update chart with new value;
    myChart.update();
    //If rotation>360 reset it back to 0
    if (myChart.options.rotation >= 360) {
      count += 1;
      resultValue -= 6;
      myChart.options.rotation = 0;
    } else if (count > 15 && myChart.options.rotation === randomDegree) {
      valueGenerator(randomDegree);
      clearInterval(rotationInterval);
      count = 0;
      resultValue = 97;
    }
  }, 10);
};

const initialDisplayPuzzle = (selectedPuzzle) => {
  // Color the remaining appropriate spaces in the first row
  // We'll need to determine which spaces those are, of course
  // Basically, since we know the length of the word, let's use this
  // to run a For Loop from the defined start place to the end of the length
  // of the world. Child's play.
  for (
    let space = selectedPuzzle.startOne;
    space < selectedPuzzle.startOne + selectedPuzzle.wordOne.length;
    space++
  ) {
    row1[space].className += ' whitespace';
  }
  // Do this three more times for the other rows, as applicable (run a check)
  // Second row
  if (selectedPuzzle.startTwo > 0) {
    for (
      let space = selectedPuzzle.startTwo;
      space < selectedPuzzle.startTwo + selectedPuzzle.wordTwo.length;
      space++
    ) {
      row2[space].className += ' whitespace';
    }
  }
  // Third row
  if (selectedPuzzle.startThree > 0) {
    for (
      let space = selectedPuzzle.startThree;
      space < selectedPuzzle.startThree + selectedPuzzle.wordThree.length;
      space++
    ) {
      row3[space].className += ' whitespace';
    }
  }
  // Fourth row
  if (selectedPuzzle.startFour > 0) {
    for (
      let space = selectedPuzzle.startFour;
      space < selectedPuzzle.startFour + selectedPuzzle.wordFour.length;
      space++
    ) {
      row4[space].className += ' whitespace';
    }
  }
};

const displayMessage = (message, messageEl, length) => {
  messageEl.innerHTML = message;

  if (length > 0) {
    setTimeout(() => {
      messageEl.innerHTML = '';
    }, length * 1000);
  }
};
