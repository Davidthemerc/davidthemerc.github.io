// Code for testing text values in word grid
// Comment out once production is underway
// for (let i = 0; i < 48; i++) {
//   collection[i].innerHTML = i;
// }

// Reference for all letter spaces on the board
const letters = document.getElementsByClassName('letterspace');
const row1 = document.getElementsByClassName('row1');
const row2 = document.getElementsByClassName('row2');
const row3 = document.getElementsByClassName('row3');
const row4 = document.getElementsByClassName('row4');
// Reference all keyboard keys
const keyboardKeys = document.getElementsByClassName('keyboardkey');
const keyboardArray = Array.from(keyboardKeys);
// Wheel code
const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const statusEl = document.getElementById('finalvalue');
let spinValue;
// Default spinner values
let count = 0;
//100 rotations for animation and last rotation for result
let resultValue = 97;
// Player game values
let money = 0;
let activeSpin = 0;

// Object that stores values of min and max angles for value
const rotationValues = [
  { minDegree: 0, maxDegree: 29, value: 900 },
  { minDegree: 30, maxDegree: 59, value: 650 },
  { minDegree: 60, maxDegree: 89, value: 0 },
  { minDegree: 90, maxDegree: 119, value: 1500 },
  { minDegree: 120, maxDegree: 149, value: 650 },
  { minDegree: 150, maxDegree: 179, value: 400 },
  { minDegree: 180, maxDegree: 209, value: 550 },
  { minDegree: 210, maxDegree: 239, value: 250 },
  { minDegree: 240, maxDegree: 269, value: 0 },
  { minDegree: 270, maxDegree: 299, value: 400 },
  { minDegree: 300, maxDegree: 329, value: 1000 },
  { minDegree: 330, maxDegree: 360, value: 350 },
];
//Size of each piece
const data = [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16];
//background color for each piece
const pieColors = [
  '#242124',
  '#A865C9',
  '#EBC106',
  '#B3CCF5',
  '#A0ADA9',
  '#C66359',
  '#242124',
  '#A15BE4 ',
  '#F35A91',
  '#31A39D',
  '#FF7300',
  '#FCC923',
  '#242124',
  '#EBC106',
  '#C66359',
  '#B3CCF5',
  '#FF7300',
  '#A865C9',
];
let myChart = new Chart(wheel, {
  //Plugin for displaying text on pie chart
  plugins: [ChartDataLabels],
  //Chart Type Pie
  type: 'pie',
  data: {
    //labels(values displayed)
    labels: [
      'BANKRUPT',
      '$650',
      '$900',
      '$350',
      '$1000',
      '$400',
      'BANKRUPT',
      '$250',
      '$550',
      '$400',
      '$650',
      '$1500',
    ],
    //Settings for data set/pie
    datasets: [
      {
        backgroundColor: pieColors,
        data: data,
      },
    ],
  },
  options: {
    //Responsive chart
    responsive: true,
    animation: { duration: 0 },
    plugins: {
      //hide tooltip and legend
      tooltip: false,
      legend: {
        display: false,
      },
      //display labels inside pie chart
      datalabels: {
        color: '#ffffff',
        formatter: (_, context) => context.chart.data.labels[context.dataIndex],
        font: { size: 14, weight: 'bold' },
        rotation: [105, -425, -15, 15, 45, 65, 105, 135, 160, 195, 225, 255],
      },
    },
  },
});

// Spinner code
spinBtn.addEventListener('click', () => {
  spinner();
});

// Pick puzzle
let selectedNum = 0;
let selectedPuzzle = puzzles[selectedNum];
initialDisplayPuzzle(selectedPuzzle);

// Event listeners for all keys on the virtual keyboard
keyboardArray.forEach((key) => {
  key.addEventListener('click', (e) => {
    let keyValue = key.innerHTML;
    try {
      console.log(`Player selects ${keyValue}`);

      if (
        keyValue === 'A' ||
        keyValue === 'E' ||
        keyValue === 'I' ||
        keyValue === 'O' ||
        keyValue === 'U'
      ) {
        // If no money, damn fool, you can't buy a vowel!
        if (money === 0) {
          throw new Error(`You can't buy a vowel fool! No money!`);
        }
        // Else, buy a vowel if there's enough money
        money -= money - 200;

        // If the vowel isn't in the puzzle, oh well.
        // The player will just lose money.

        // Add code here for a successful vowel
        // If the vowel is there, give the player $200 for each extra vowel
        // present in the puzzle (the vowel pays for itself if there are two)
        // Alternatively, just look up the current rotation value of the wheel
        // And give the player that $value per each extra vowel
        // The rotation is saved since the last spin, so it should be able
        // to be looked up.
      } else {
        if (activeSpin === 0) {
          throw new Error(`You need to spin first!`);
        }
        // We're OK to allow this letter to be selected.
        // Re-enable the wheel and reset the activeSpin variable
        // Basically, we're ready for a new wheel spin and cash amount
        spinBtn.disabled = false;
        activeSpin = 0;

        // CODE FOR CHECKING AGAINST THE PUZZLE GOES HERE
        // Check this letter against the puzzle.
        // Depending on the quantity of letters in the puzzle
        // Give the player the spin amount * # of letters

        // Turn the key green if the letter is in the puzzle
        //key.className += ' green';

        // Turn the key red if the letter isn't in the puzzle
        //key.className += ' red';
      }
    } catch (error) {
      displayMessage(error, statusEl, 3);
    }
  });
});
