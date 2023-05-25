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
let words = [];

// Event Listeners
window.addEventListener('load', getWords);

inputs.forEach(input => input.addEventListener('keyup', (event) => moveToNextInput(event)));

keyLetters.forEach(keyLetter => keyLetter.addEventListener('click', (event) => clickLetter(event)));

guessButton.addEventListener('click', submitGuess);

viewRulesButton.addEventListener('click', viewRules);

viewGameButton.addEventListener('click', viewGame);

viewStatsButton.addEventListener('click', viewStats);

// Functions
function getWords(){
  fetch('http://localhost:3001/api/v1/words')
    .then(response => response.json())
    .then(data => {
      words = data
      setGame(words)
    })
}

function setGame(words) {
  currentRow = 1;
  winningWord = getRandomWord(words);
  updateInputPermissions();
}

function getRandomWord(words) {
  var randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

function updateInputPermissions() {
  for(var i = 0; i < inputs.length; i++) {
    if(!inputs[i].id.includes(`-${currentRow}-`)) {
      inputs[i].disabled = true;
    } else {
      inputs[i].disabled = false;
    }
  }

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
  var activeInput = null;
  var activeIndex = null;

  for (var i = 0; i < inputs.length; i++) {
    if(inputs[i].id.includes(`-${currentRow}-`) && !inputs[i].value && !activeInput) {
      activeInput = inputs[i];
      activeIndex = i;
    }
  }

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
      setTimeout(declareWinnerOrLoser, 1000, 'winner');
    } else if (guesses.length === 6) {
      setTimeout(declareWinnerOrLoser, 1000, 'loser');
    } else {
      changeRow();
    }
  } else {
    errorMessage.innerText = 'Not a valid word. Try again!';
  }
}

function updateGuess() {
  guess = '';

  for(var i = 0; i < inputs.length; i++) {
    if(inputs[i].id.includes(`-${currentRow}-`)) {
      guess += inputs[i].value;
    }
  }
}

function checkIsWord(words) {
  return words.includes(guess);
}

function compareGuess() {
  var guessLetters = guess.split('');

  for (var i = 0; i < guessLetters.length; i++) {

    if (winningWord.includes(guessLetters[i]) && winningWord.split('')[i] !== guessLetters[i]) {
      updateBoxColor(i, 'wrong-location');
      updateKeyColor(guessLetters[i], 'wrong-location-key');
    } else if (winningWord.split('')[i] === guessLetters[i]) {
      updateBoxColor(i, 'correct-location');
      updateKeyColor(guessLetters[i], 'correct-location-key');
    } else {
      updateBoxColor(i, 'wrong');
      updateKeyColor(guessLetters[i], 'wrong-key');
    }
  }

}

function updateBoxColor(letterLocation, className) {
  var row = [];

  for (var i = 0; i < inputs.length; i++) {
    if(inputs[i].id.includes(`-${currentRow}-`)) {
      row.push(inputs[i]);
    }
  }

  row[letterLocation].classList.add(className);
}

function updateKeyColor(letter, className) {
  var keyLetter = null;

  for (var i = 0; i < keyLetters.length; i++) {
    if (keyLetters[i].innerText === letter) {
      keyLetter = keyLetters[i];
    }
  }

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
  recordGameStats(winType);
  changeGameOverText(winType);
  viewGameOverMessage();
  setTimeout(startNewGame, 4000);
}

function recordGameStats(winType) {
  var status = {winner: true, loser: false}
  gamesPlayed.push({ solved: status[winType], guesses: guesses.length });
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
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].value = '';
    inputs[i].classList.remove('correct-location', 'wrong-location', 'wrong');
  }
  guess = '';
  guesses = [];
}

function clearKey() {
  for (var i = 0; i < keyLetters.length; i++) {
    keyLetters[i].classList.remove('correct-location-key', 'wrong-location-key', 'wrong-key');
  }
}

// Change Page View Functions

function viewRules() {
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
  rules.classList.remove('collapsed');
  stats.classList.add('collapsed');
  viewGameButton.classList.remove('active');
  viewRulesButton.classList.add('active');
  viewStatsButton.classList.remove('active');
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
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
  rules.classList.add('collapsed');
  stats.classList.remove('collapsed');
  viewGameButton.classList.remove('active');
  viewRulesButton.classList.remove('active');
  viewStatsButton.classList.add('active');
}

function viewGameOverMessage() {
  gameOverBox.classList.remove('collapsed')
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
}
