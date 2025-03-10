const up1Button = document.getElementById('up1');
const up2Button = document.getElementById('up2');
const up3Button = document.getElementById('up3');
const up4Button = document.getElementById('up4');
const up5Button = document.getElementById('up5');
const down1Button = document.getElementById('down1');
const down2Button = document.getElementById('down2');
const down3Button = document.getElementById('down3');
const down4Button = document.getElementById('down4');
const down5Button = document.getElementById('down5');
const ddupButton = document.getElementById('ddup');
const dddownButton = document.getElementById('dddown');
const money6 = document.getElementById('money6');
const path = window.location.pathname;
const pageName = path.split('/').pop();
let moneyDisplay = document.getElementById('moneydisplay');
const nextPage = document.getElementById('nextpage');
const backPage = document.getElementById('backpage');
let funds = parseFloat(getJSON('CJscoreboard-funds'));

// Display active funds
moneyDisplay.innerHTML = funds;

if (pageName !== 'final.html') {
  nextPage.addEventListener('click', () => {
    if (pageName === 'index.html') {
      location.assign('double.html');
    } else if (pageName === 'double.html') {
      location.assign('triple.html');
    } else if (pageName === 'triple.html') {
      location.assign('final.html');
    }
  });
}

if (pageName !== 'index.html') {
  backPage.addEventListener('click', () => {
    if (pageName === 'final.html') {
      location.assign('triple.html');
    } else if (pageName === 'double.html') {
      location.assign('index.html');
    } else if (pageName === 'triple.html') {
      location.assign('double.html');
    }
  });
}

if (pageName !== 'final.html') {
  up1Button.addEventListener('click', () => {
    if (pageName === 'index.html') {
      funds += 100;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'double.html') {
      funds += 200;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'triple.html') {
      funds += 300;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    }
  });

  up2Button.addEventListener('click', () => {
    if (pageName === 'index.html') {
      funds += 200;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'double.html') {
      funds += 400;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'triple.html') {
      funds += 600;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    }
  });

  up3Button.addEventListener('click', () => {
    if (pageName === 'index.html') {
      funds += 300;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'double.html') {
      funds += 600;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'triple.html') {
      funds += 900;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    }
  });

  up4Button.addEventListener('click', () => {
    if (pageName === 'index.html') {
      funds += 400;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'double.html') {
      funds += 800;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'triple.html') {
      funds += 1200;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    }
  });

  up5Button.addEventListener('click', () => {
    if (pageName === 'index.html') {
      funds += 500;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'double.html') {
      funds += 1000;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'triple.html') {
      funds += 1500;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    }
  });

  down1Button.addEventListener('click', () => {
    if (pageName === 'index.html') {
      funds -= 100;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'double.html') {
      funds -= 200;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'triple.html') {
      funds -= 300;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    }
  });

  down2Button.addEventListener('click', () => {
    if (pageName === 'index.html') {
      funds -= 200;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'double.html') {
      funds -= 400;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'triple.html') {
      funds -= 600;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    }
  });

  down3Button.addEventListener('click', () => {
    if (pageName === 'index.html') {
      funds -= 300;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'double.html') {
      funds -= 600;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'triple.html') {
      funds -= 900;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    }
  });

  down4Button.addEventListener('click', () => {
    if (pageName === 'index.html') {
      funds -= 400;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'double.html') {
      funds -= 800;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'triple.html') {
      funds -= 1200;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    }
  });

  down5Button.addEventListener('click', () => {
    if (pageName === 'index.html') {
      funds -= 500;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'double.html') {
      funds -= 1000;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    } else if (pageName === 'triple.html') {
      funds -= 1500;
      moneyDisplay.innerHTML = funds;
      saveJSON(funds, 'CJscoreboard-funds');
    }
  });
}

dddownButton.addEventListener('click', () => {
  if (processValue(parseFloat(money6.value)) <= funds) {
    funds -= processValue(parseFloat(money6.value));
    money6.value = '';
    moneyDisplay.innerHTML = funds;
    saveJSON(funds, 'CJscoreboard-funds');
  } else {
    money6.value = '';
  }
});

ddupButton.addEventListener('click', () => {
  if (processValue(parseFloat(money6.value)) <= funds) {
    funds += processValue(parseFloat(money6.value));
    money6.value = '';
    moneyDisplay.innerHTML = funds;
    saveJSON(funds, 'CJscoreboard-funds');
  } else {
    money6.value = '';
  }
});
