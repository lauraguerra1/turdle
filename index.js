// Global Variables
var winningWord = '';
var currentRow = 1;
var guess = '';
var guesses = [];
var gamesPlayed = [];

// Query Selectors
var inputs = document.querySelectorAll('input');
var guessButton = document.querySelector('#guess-button');
var keyLetters = document.querySelectorAll('.keyletter');
var errorMessage = document.querySelector('#error-message');
var viewRulesButton = document.querySelector('#rules-button');
var viewGameButton = document.querySelector('#play-button');
var viewStatsButton = document.querySelector('#stats-button');
var gameBoard = document.querySelector('#game-section');
var letterKey = document.querySelector('#key-section');
var rules = document.querySelector('#rules-section');
var stats = document.querySelector('#stats-section');
var gameOverBox = document.querySelector('#game-over-section');
var gameOverGuessCount = document.querySelector('#game-over-guesses-count');
var gameOverGuessGrammar = document.querySelector('#game-over-guesses-plural');
var timer1; 
var timer2;

let words = [];

// Event Listeners
window.addEventListener('load', getWords);

inputs.forEach(input => input.addEventListener('keyup', (event) => moveToNextInput(event)));

keyLetters.forEach(keyLetter => keyLetter.addEventListener('click', (event) => clickLetter(event)));

guessButton.addEventListener('click', submitGuess);

viewRulesButton.addEventListener('click', viewRules);

viewGameButton.addEventListener('click', viewGame);

viewStatsButton.addEventListener('click', viewStats);

// API CALLS
function getWords(){
  fetch('http://localhost:3001/api/v1/words')
    .then(response => response.json())
    .then(data => {
      words = data
      setGame(words)
    })
    .catch(error => {
      console.error(error)
    })
}

function postGameStats(data) {
  fetch('http://localhost:3001/api/v1/games', {
    method: 'POST',
    body: JSON.stringify(data), 
    headers: {
  	'Content-Type': 'application/json'
    }
  })
}

function getGameStats() {
  fetch('http://localhost:3001/api/v1/games	')
    .then(response => response.json())
    .then(data => updateGameStats(data))
}



// FUNCTIONS
function setGame(words) {
  currentRow = 1;
  winningWord = getRandomWord(words);
  updateInputPermissions();
}

function getRandomWord(words) {
  var randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

function getRows() {
  return {
    activeRow: Array.from(inputs)
      .filter(input => input.id.includes(`-${currentRow}-`)),
    inactiveRow: Array.from(inputs)
      .filter(input => !input.id.includes(`-${currentRow}-`))
  }
}

function updateInputPermissions() {
  var grid = getRows();
  grid.activeRow.forEach(input => input.disabled = false)
  grid.inactiveRow.forEach(input => input.disabled = true)
  inputs[0].focus();
}

function moveToNextInput(e) {
  var key = e.keyCode || e.charCode;

  if( key !== 8 && key !== 46 ) {
    var indexOfNext = parseInt(e.target.id.split('-')[2]) + 1;
    inputs[indexOfNext]?.focus();
  }
}

function clickLetter(e) {
  var inputsArray = Array.from(inputs);
  var activeInput = inputsArray.find(input => {
    return input.id.includes(`-${currentRow}-`) && !input.value
  })

  var activeIndex = inputsArray.indexOf(activeInput)
  activeInput.value = e.target.innerText;
  inputs[activeIndex + 1].focus();
}

function submitGuess() {
  updateGuess();
  if (checkIsWord(words)) {
    errorMessage.innerText = '';
    guesses.push(guess)
    compareGuess();
    if (checkForWin()) {
      recordGameStats('winner');
      timer2 = setTimeout(declareWinnerOrLoser, 1000, 'winner');
    } else if (guesses.length === 6) {
      recordGameStats('loser');
      timer2 = setTimeout(declareWinnerOrLoser, 1000, 'loser');
    } else {
      changeRow();
    }
  } else {
    errorMessage.innerText = 'Not a valid word. Try again!';
  }
}

function updateGuess() {
  guess = getRows().activeRow
    .map(input => input.value)
    .join('')
}

function checkIsWord(words) {
  return words.includes(guess);
}

function compareGuess() {
  guess.split('').forEach((letter, i) => {
    if (winningWord.includes(letter) && winningWord.split('')[i] !== letter) {
      updateBoxColor(i, 'wrong-location');
      updateKeyColor(letter, 'wrong-location-key');
    } else if (winningWord.split('')[i] === letter) {
      updateBoxColor(i, 'correct-location');
      updateKeyColor(letter, 'correct-location-key');
    } else {
      updateBoxColor(i, 'wrong');
      updateKeyColor(letter, 'wrong-key');
    }
  })
}

function updateBoxColor(letterLocation, className) {
  var row = getRows().activeRow
  row[letterLocation].classList.add(className);
}

function updateKeyColor(letter, className) {
  var keyLetter = Array.from(keyLetters).find(key => key.innerText === letter)
  keyLetter.classList.add(className);
}

function checkForWin() {
  return guess === winningWord;
}

function changeRow() {
  currentRow++;
  updateInputPermissions();
}

function declareWinnerOrLoser(winType) {
  // recordGameStats(winType);
  changeGameOverText(winType);
  viewGameOverMessage();
  timer1 = setTimeout(startNewGame, 4000);
}

function recordGameStats(winType) {
  var status = {winner: true, loser: false}
  var gameStat = { solved: status[winType], guesses: guesses.length }
  gamesPlayed.push(gameStat);
  postGameStats(gameStat);
}

function updateGuessGrammar() {
  if (guesses.length < 2) {
    gameOverGuessGrammar.classList.add('collapsed');
    } else {
    gameOverGuessGrammar.classList.remove('collapsed');
    }
}

function updateWinOrLoseText(winType) {
  var gameOverMsg = document.querySelector('#game-over-message');
  var winMsg = document.querySelector('.win-message');
  var loseMsg = document.querySelector('.lose-message');
  var winningWordMsg = document.querySelector('#winningWord');
  if(winType === 'winner') {
    gameOverGuessCount.innerText = guesses.length;
    gameOverMsg.innerText = 'Yay!';
    winMsg.classList.remove('collapsed');
    loseMsg.classList.add('collapsed');
  } else {
    gameOverMsg.innerText = 'Oh no!';
    winningWordMsg.innerText = `${winningWord}`;
    winMsg.classList.add('collapsed');
    loseMsg.classList.remove('collapsed');
  }
}


function changeGameOverText(winType) {
    updateGuessGrammar();
    updateWinOrLoseText(winType);
}

function startNewGame() {
  clearGameBoard();
  clearKey();
  setGame(words);
  viewGame();
  inputs[0].focus();
}

function clearGameBoard() {
  inputs.forEach(input => {
    input.value = '';
    input.classList.remove('correct-location', 'wrong-location', 'wrong');
  })
  guess = '';
  guesses = [];
}

function clearKey() {
  keyLetters.forEach(keyLetter => keyLetter.classList.remove('correct-location-key', 'wrong-location-key', 'wrong-key'));
}

function getAvgGuesses(gamesPlayed) {
  console.log(gamesPlayed)
  var allGuesses = gamesPlayed.reduce((totalGuesses, curr) =>  totalGuesses += curr.numGuesses, 0)
  return (allGuesses/gamesPlayed.length).toFixed(2)
}

function getPercentCorrect(gamesPlayed) {
  var wonGames = gamesPlayed.filter(game => game.solved).length;
  var percentWon = (wonGames / gamesPlayed.length) * 100 
  return percentWon.toFixed(0)
}

function updateGameStats(gamesPlayed) {
  var totalGames = document.querySelector('#stats-total-games');
  var avgWins = document.querySelector('#stats-percent-correct');
  var avgGuesses = document.querySelector('#stats-average-guesses');
  totalGames.innerText = `${gamesPlayed.length}`
  avgWins.innerText = `${getPercentCorrect(gamesPlayed)}`
  avgGuesses.innerText = `${getAvgGuesses(gamesPlayed)}`
}

// Change Page View Functions

function viewRules() {
  startNewGame();
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
  rules.classList.remove('collapsed');
  stats.classList.add('collapsed');
  gameOverBox.classList.add('collapsed')
  viewGameButton.classList.remove('active');
  viewRulesButton.classList.add('active');
  viewStatsButton.classList.remove('active');
  clearTimeout(timer2);
  clearTimeout(timer1);
}

function viewGame() {
  letterKey.classList.remove('hidden');
  gameBoard.classList.remove('collapsed');
  rules.classList.add('collapsed');
  stats.classList.add('collapsed');
  gameOverBox.classList.add('collapsed')
  viewGameButton.classList.add('active');
  viewRulesButton.classList.remove('active');
  viewStatsButton.classList.remove('active');
}

function viewStats() {
  startNewGame();
  getGameStats();
  gameOverBox.classList.add('collapsed')
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
  rules.classList.add('collapsed');
  stats.classList.remove('collapsed');
  viewGameButton.classList.remove('active');
  viewRulesButton.classList.remove('active');
  viewStatsButton.classList.add('active');
  clearTimeout(timer2);
  clearTimeout(timer1);
}

function viewGameOverMessage() {
  gameOverBox.classList.remove('collapsed')
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
}
