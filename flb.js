const bird = document.getElementById('bird');
const gameContainer = document.getElementById('game-container');
const scoreElement = document.getElementById('score');
const mainMenu = document.getElementById('main-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const highscoresMenu = document.getElementById('highscores-menu');
const finalScoreElement = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again');
const highscoresList = document.getElementById('highscores-list');

let gameLoop, pillarLoop;
let birdY = 300, velocity = 0, gravity = 0.5;
let isGameOver = false, isGameStarted = false, score = 0;
let gapSize = 220, pillarSpacing = 1800, baseSpeed = 2, difficultyLevel = 1;
let highScores = JSON.parse(localStorage.getItem('flappyHighScores')) || [];

function initializeGame() {
  birdY = 300; velocity = 0; score = 0; difficultyLevel = 1;
  gapSize = 200; pillarSpacing = 1800; isGameOver = false;
  scoreElement.textContent = '0';
  bird.style.top = `${birdY}px`;
  document.querySelectorAll('.pillar, .enemy-plane, .obstacle-wrapper')
          .forEach(o => o.remove());
}

function jump() {
  if (!isGameStarted || isGameOver) return;
  velocity = -8;
}

function updateBird() {
  if (!isGameStarted || isGameOver) return;
  velocity += gravity;
  birdY += velocity;
  bird.style.top = `${birdY}px`;
  if (birdY < 0 || birdY > 600) gameOver();
}

function createObstacle() {
  const containerHeight = gameContainer.offsetHeight;

  // Reduce randomness and add padding to reduce height difference
  const maxTopY = containerHeight - gapSize - 180;
  const topY = 80 + Math.random() * maxTopY; 
  const bottomPillarHeight = containerHeight - topY - gapSize;

  const obstacleWrapper = document.createElement('div');
  obstacleWrapper.classList.add('obstacle-wrapper');
  obstacleWrapper.style.position = 'absolute';
  obstacleWrapper.style.right = '-80px';
  obstacleWrapper.style.bottom = '0px';
  obstacleWrapper.style.width = '80px';
  obstacleWrapper.style.height = `${containerHeight}px`;
  obstacleWrapper.style.zIndex = 2;

  const bottomPillar = document.createElement('div');
  bottomPillar.classList.add('pillar');
  bottomPillar.style.position = 'absolute';
  bottomPillar.style.bottom = '0';
  bottomPillar.style.height = `${bottomPillarHeight}px`;
  bottomPillar.style.width = '100%';

  const ufo = document.createElement('img');
  ufo.src = 'images/enemy-plane.png';
  ufo.classList.add('enemy-plane');
  ufo.style.position = 'absolute';
  ufo.style.top = `${topY - 70}px`; 
  ufo.style.left = '0';
  ufo.style.width = '100%';

  obstacleWrapper.appendChild(bottomPillar);
  obstacleWrapper.appendChild(ufo);
  gameContainer.appendChild(obstacleWrapper);

  moveObstacle(obstacleWrapper, bottomPillar, ufo);
}


function moveObstacle(wrapper, pillar, ufo) {
  let position = -80;
  let scored = false;

  const moveInterval = setInterval(() => {
    if (isGameOver) {
      clearInterval(moveInterval);
      return;
    }

    position += baseSpeed + (difficultyLevel * .75);
    wrapper.style.right = `${position}px`;

    if (position > 50 && !scored) {
      score++;
      scoreElement.textContent = score;
      scored = true;

      if (score % 10 === 0) {
        difficultyLevel++;
        gapSize = Math.max(120, gapSize - 10);
        pillarSpacing = Math.max(1200, pillarSpacing - 120);

        clearInterval(pillarLoop);
        pillarLoop = setInterval(() => createObstacle(), pillarSpacing);
      }
    }

    if (position > gameContainer.offsetWidth + 80) {
      gameContainer.removeChild(wrapper);
      clearInterval(moveInterval);
    }

    const birdRect = bird.getBoundingClientRect();
    const pillarRect = pillar.getBoundingClientRect();
    const ufoRect = ufo.getBoundingClientRect();

    // Pillar collision
    if (
      birdRect.right > pillarRect.left &&
      birdRect.left < pillarRect.right &&
      birdRect.bottom > pillarRect.top
    ) {
      gameOver();
    }

    // Precise UFO circular collision check with smaller radius
    const bx = birdRect.left + birdRect.width / 2;
    const by = birdRect.top + birdRect.height / 2;
    const ux = ufoRect.left + ufoRect.width / 2;
    const uy = ufoRect.top + ufoRect.height / 2;

    const birdRadius = Math.min(birdRect.width, birdRect.height) / 2.6;
    const ufoRadius = ufoRect.width / 3.1;

    const dx = bx - ux;
    const dy = by - uy;
    const distanceSquared = dx * dx + dy * dy;
    const radiusSum = birdRadius + ufoRadius;

    if (distanceSquared < radiusSum * radiusSum) {
      gameOver();
    }
  }, 20);
}


function gameOver() {
  isGameOver = true; isGameStarted = false;
  clearInterval(gameLoop); clearInterval(pillarLoop);

  highScores.push(score);
  highScores.sort((a, b) => b - a);
  highScores = highScores.slice(0, 5);
  localStorage.setItem('flappyHighScores', JSON.stringify(highScores));
  showGameOverMenu();
}

function showMainMenu() {
  mainMenu.style.display = 'block';
  gameOverMenu.style.display = highscoresMenu.style.display = 'none';
  gameContainer.style.display = 'none';
}
function showGameOverMenu() {
  finalScoreElement.textContent = `Score: ${score}`;
  gameOverMenu.style.display = 'block';
  mainMenu.style.display = gameContainer.style.display = 'none';
}
function showHighScores() {
  highscoresList.innerHTML = highScores.length
    ? highScores.map((s,i)=>`<li>${i+1}. ${s}</li>`).join('')
    : '<li>No scores yet!</li>';
  highscoresMenu.style.display = 'block';
  mainMenu.style.display = gameOverMenu.style.display = 'none';
}

document.getElementById('play').onclick = () => { mainMenu.style.display='none'; gameContainer.style.display='block'; startGame(); };
playAgainBtn.onclick = () => { gameOverMenu.style.display='none'; gameContainer.style.display='block'; startGame(); };
document.getElementById('main-highscores').onclick = showHighScores;
document.getElementById('highscores').onclick = showHighScores;
document.getElementById('back-to-main').onclick = showMainMenu;
document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (!isGameStarted && !isGameOver) {
      mainMenu.style.display = 'none';
      gameContainer.style.display = 'block';
      startGame();
    }
    jump();
  }
});

function startGame() {
  initializeGame();
  isGameStarted = true;
  gameLoop = setInterval(updateBird, 20);
  pillarLoop = setInterval(createObstacle, pillarSpacing);
}

showMainMenu();
