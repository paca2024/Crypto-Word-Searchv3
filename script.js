// Game configuration
const GRID_SIZE = 15;
const words = [
    'BITCOIN', 'ETHEREUM', 'BLOCKCHAIN', 'MINING', 'WALLET', 
    'DEFI', 'TOKEN', 'CRYPTO', 'LEDGER', 'NFT',
    'SOLANA', 'CARDANO', 'POLYGON', 'AVALANCHE', 'BINANCE',
    'STAKING', 'YIELD', 'DOGE', 'SHIBA', 'METAMASK',
    'AIRDROP', 'ALTCOIN', 'HODL', 'BULLISH', 'BEARISH'
];
const hiddenWords = ['AFFILIATE', 'MOON', 'LAMBO', 'WAGMI'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIRECTIONS = [
    [0, 1],  // right
    [1, 0],  // down
    [1, 1],  // diagonal right down
    [-1, 1], // diagonal right up
];

let grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(''));
let foundWords = new Set();
let score = 0;
let timerInterval;
let startTime;
let gameActive = false;
let selectedCells = [];
let username = '';

// Initialize grid
function initGrid() {
    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(''));
    const allWords = [...hiddenWords, ...words]; // Place hidden words first
    
    for (const word of allWords) {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 500; // Increased attempts for better placement chances

        while (!placed && attempts < maxAttempts) {
            // For longer words, prefer horizontal placement
            let directionIndex = word.length > 8 ? 0 : Math.floor(Math.random() * DIRECTIONS.length);
            const direction = DIRECTIONS[directionIndex];
            
            // Calculate valid starting positions based on word length
            const maxRow = GRID_SIZE - (word.length * Math.abs(direction[0]));
            const maxCol = GRID_SIZE - (word.length * Math.abs(direction[1]));
            
            const row = Math.floor(Math.random() * (maxRow || GRID_SIZE));
            const col = Math.floor(Math.random() * (maxCol || GRID_SIZE));

            if (canPlaceWord(word, row, col, direction)) {
                placeWord(word, row, col, direction);
                placed = true;
            }
            attempts++;
        }
        
        if (!placed) {
            console.log(`Failed to place word: ${word}`);
        }
    }
    
    fillEmptyCells();
}

function placeWord(word, row, col, direction) {
    for (let i = 0; i < word.length; i++) {
        const newRow = row + (direction[0] * i);
        const newCol = col + (direction[1] * i);
        grid[newRow][newCol] = word[i];
    }
}

function canPlaceWord(word, row, col, direction) {
    for (let i = 0; i < word.length; i++) {
        const newRow = row + (direction[0] * i);
        const newCol = col + (direction[1] * i);
        
        if (newRow < 0 || newRow >= GRID_SIZE || newCol < 0 || newCol >= GRID_SIZE) {
            return false;
        }
        
        if (grid[newRow][newCol] !== '' && grid[newRow][newCol] !== word[i]) {
            return false;
        }
    }
    return true;
}

function fillEmptyCells() {
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col] === '') {
                grid[row][col] = LETTERS[Math.floor(Math.random() * LETTERS.length)];
            }
        }
    }
}

// Game UI
function createGrid() {
    const gameBoard = document.getElementById('gameBoard');
    if (!gameBoard) return;
    
    // Clear existing content
    gameBoard.innerHTML = '';
    
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.textContent = grid[row][col];
            cell.addEventListener('mousedown', startSelection);
            cell.addEventListener('mouseover', updateSelection);
            cell.addEventListener('mouseup', endSelection);
            cell.addEventListener('touchstart', handleTouchStart, { passive: false });
            cell.addEventListener('touchmove', handleTouchMove, { passive: false });
            cell.addEventListener('touchend', handleTouchEnd);
            gameBoard.appendChild(cell);
        }
    }
}

function updateWordList() {
    const wordList = document.getElementById('wordList');
    if (!wordList) return;
    
    wordList.innerHTML = '';
    words.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        if (foundWords.has(word)) {
            li.classList.add('found');
        }
        wordList.appendChild(li);
    });
}

// Game interaction
function startSelection(event) {
    if (!gameActive) return;
    event.preventDefault();
    
    selectedCells = [];
    const cell = event.target;
    if (cell.classList.contains('grid-cell')) {
        cell.classList.add('selected');
        selectedCells.push(cell);
    }
    
    document.addEventListener('mouseup', endSelection);
}

function updateSelection(event) {
    if (!gameActive || selectedCells.length === 0) return;
    
    const cell = event.target;
    if (cell.classList.contains('grid-cell') && !selectedCells.includes(cell)) {
        const lastCell = selectedCells[selectedCells.length - 1];
        const lastRow = parseInt(lastCell.dataset.row);
        const lastCol = parseInt(lastCell.dataset.col);
        const currentRow = parseInt(cell.dataset.row);
        const currentCol = parseInt(cell.dataset.col);
        
        if (isValidSelection(lastRow, lastCol, currentRow, currentCol)) {
            cell.classList.add('selected');
            selectedCells.push(cell);
        }
    }
}

function endSelection() {
    if (!gameActive) return;
    
    const word = getSelectedWord();
    checkWord(word);
    
    selectedCells.forEach(cell => cell.classList.remove('selected'));
    selectedCells = [];
    
    document.removeEventListener('mouseup', endSelection);
}

function getSelectedWord() {
    return selectedCells.map(cell => cell.textContent).join('');
}

function checkWord(word) {
    const reversedWord = word.split('').reverse().join('');
    
    if (words.includes(word) && !foundWords.has(word)) {
        foundWords.add(word);
        score += 100;
        selectedCells.forEach(cell => cell.classList.add('found'));
        updateScore();
        updateWordList();
        checkGameEnd();
    } else if (hiddenWords.includes(word) && !foundWords.has(word)) {
        foundWords.add(word);
        score += 500;
        selectedCells.forEach(cell => cell.classList.add('found-hidden'));
        updateScore();
        showHiddenWordMessage(word);
        checkGameEnd();
    } else if (words.includes(reversedWord) && !foundWords.has(reversedWord)) {
        foundWords.add(reversedWord);
        score += 100;
        selectedCells.forEach(cell => cell.classList.add('found'));
        updateScore();
        updateWordList();
        checkGameEnd();
    } else if (hiddenWords.includes(reversedWord) && !foundWords.has(reversedWord)) {
        foundWords.add(reversedWord);
        score += 500;
        selectedCells.forEach(cell => cell.classList.add('found-hidden'));
        updateScore();
        showHiddenWordMessage(reversedWord);
        checkGameEnd();
    }
}

function isValidSelection(lastRow, lastCol, currentRow, currentCol) {
    const rowDiff = Math.abs(currentRow - lastRow);
    const colDiff = Math.abs(currentCol - lastCol);
    
    return (rowDiff <= 1 && colDiff <= 1) && (rowDiff !== 0 || colDiff !== 0);
}

// Touch support
function handleTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const cell = document.elementFromPoint(touch.clientX, touch.clientY);
    if (cell) {
        startSelection({ target: cell, preventDefault: () => {} });
    }
}

function handleTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const cell = document.elementFromPoint(touch.clientX, touch.clientY);
    if (cell) {
        updateSelection({ target: cell });
    }
}

function handleTouchEnd() {
    endSelection();
}

// Timer functions
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimerDisplay, 1000);
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    if (!timerElement) return;
    
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function stopTimer() {
    clearInterval(timerInterval);
}

// Game lifecycle
function initGame() {
    const startGameBtn = document.getElementById('startGameBtn');
    const tgUsername = document.getElementById('tgUsername');
    const signInOverlay = document.getElementById('signInOverlay');
    
    if (startGameBtn && tgUsername && signInOverlay) {
        // Check cooldown on game load
        if (checkCooldown()) {
            signInOverlay.style.display = 'none';
        }
        
        startGameBtn.addEventListener('click', handleStartGame);
    }
    
    document.getElementById('endGameBtn')?.addEventListener('click', endGame);
}

function handleStartGame() {
    const tgUsername = document.getElementById('tgUsername');
    const signInOverlay = document.getElementById('signInOverlay');
    
    if (tgUsername && signInOverlay) {
        if (tgUsername.value.trim()) {
            if (checkCooldown()) {
                return; // Don't start if in cooldown
            }
            username = tgUsername.value.trim();
            signInOverlay.style.display = 'none';
            startGame();
        } else {
            alert('Please enter your Telegram username');
        }
    }
}

function startGame() {
    gameActive = true;
    score = 0;
    foundWords.clear();
    
    initGrid();
    createGrid();
    updateWordList();
    updateScore();
    startTimer();
    
    document.getElementById('endGameBtn').style.display = 'block';
}

function endGame() {
    gameActive = false;
    stopTimer();
    
    const finalTime = document.getElementById('timer').textContent;
    const foundWordsList = Array.from(foundWords);
    const hiddenWordsFound = hiddenWords.filter(word => foundWords.has(word));
    const nextGameTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Store next game time in localStorage
    localStorage.setItem('nextGameTime', nextGameTime.getTime());
    
    // Create game summary overlay
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    
    const summary = document.createElement('div');
    summary.className = 'game-summary';
    
    const content = `
        <h2>Game Over!</h2>
        <div class="summary-content">
            <p><strong>Player ID:</strong> ${username}</p>
            <p><strong>Final Score:</strong> ${score}</p>
            <p><strong>Time:</strong> ${finalTime}</p>
            <p><strong>Words Found:</strong> ${foundWordsList.length} / ${words.length}</p>
            <p><strong>Hidden Treasures Found:</strong> ${hiddenWordsFound.length} / ${hiddenWords.length}</p>
            <div class="next-game">
                <p><strong>Next Game Available In:</strong></p>
                <div id="countdown" class="countdown"></div>
            </div>
        </div>
        <button id="closeGameSummary">Close</button>
    `;
    
    summary.innerHTML = content;
    overlay.appendChild(summary);
    document.body.appendChild(overlay);
    
    // Start countdown
    startCountdown(nextGameTime);
    
    // Close button handler
    document.getElementById('closeGameSummary').addEventListener('click', () => {
        overlay.remove();
        document.getElementById('signInOverlay').style.display = 'flex';
    });
}

function startCountdown(nextGameTime) {
    const countdownElement = document.getElementById('countdown');
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = nextGameTime - now;
        
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        countdownElement.innerHTML = `${hours}h ${minutes}m ${seconds}s`;
        
        if (distance < 0) {
            clearInterval(countdownInterval);
            countdownElement.innerHTML = "You can play again!";
        }
    }
    
    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
}

function checkCooldown() {
    const nextGameTime = localStorage.getItem('nextGameTime');
    if (nextGameTime) {
        const now = new Date().getTime();
        const distance = nextGameTime - now;
        
        if (distance > 0) {
            // Show cooldown overlay
            const overlay = document.createElement('div');
            overlay.className = 'game-over-overlay';
            
            const summary = document.createElement('div');
            summary.className = 'game-summary';
            
            const content = `
                <h2>Game Cooldown</h2>
                <div class="summary-content">
                    <p>You need to wait before playing again.</p>
                    <div class="next-game">
                        <p><strong>Next Game Available In:</strong></p>
                        <div id="countdown" class="countdown"></div>
                    </div>
                </div>
                <button id="closeGameSummary">Close</button>
            `;
            
            summary.innerHTML = content;
            overlay.appendChild(summary);
            document.body.appendChild(overlay);
            
            // Start countdown
            startCountdown(parseInt(nextGameTime));
            
            // Close button handler
            document.getElementById('closeGameSummary').addEventListener('click', () => {
                overlay.remove();
            });
            
            return true; // Cooldown active
        }
    }
    return false; // No cooldown
}

function checkGameEnd() {
    const totalWords = words.length + hiddenWords.length;
    if (foundWords.size === totalWords) {
        endGame();
    }
}

function updateScore() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = score;
    }
}

function showHiddenWordMessage(word) {
    alert(`Congratulations! You found a hidden word: ${word}\nBonus: 500 points!`);
}

// Initialize game
document.addEventListener('DOMContentLoaded', initGame);
