const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const intro = document.getElementById("intro");
const startBtn = document.getElementById("startBtn");
const highScoreDisplay = document.getElementById("highScoreDisplay");

// Load high score
let highScore = parseInt(localStorage.getItem("flappyHarryHighScore") || "0", 10);
highScoreDisplay.textContent = "Highest Score: " + highScore;

// Harry Potter image
const harryImg = new Image();
harryImg.src = "harry.png";   // make sure file exists!!

// ===== Game variables =====
let birdX = 0;
let birdY = 0;
let birdSize = 50;

let gravity = 0.4;
let velocity = 0;
let jump = -8;

let pipes = [];
let pipeWidth = 70;
let pipeGap = 260;

let score = 0;
let frame = 0;
let isGameOver = false;
let animationId;

// =========================
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  pipeGap = canvas.height * 0.32;
  birdX = canvas.width / 6;
  birdY = canvas.height / 2;
}
window.addEventListener("resize", resizeCanvas);

// =========================
startBtn.addEventListener("click", () => {
  intro.style.display = "none";
  canvas.style.display = "block";
  resizeCanvas();
  startGame();
});

// Handle flap or restart
function flap() {
  if (isGameOver) return;
  velocity = jump;
}

document.addEventListener("touchstart", () => {
  if (isGameOver) location.reload();
  else flap();
});

document.addEventListener("mousedown", () => {
  if (isGameOver) location.reload();
  else flap();
});

document.addEventListener("keydown", (e) => {
  if (isGameOver) location.reload();
  if (e.code === "Space" || e.code === "ArrowUp") flap();
});

// =========================
function spawnPipe() {
  let topHeight = Math.random() * (canvas.height - pipeGap - 100) + 50;
  pipes.push({
    x: canvas.width,
    y: topHeight,
    passed: false
  });
}

// =========================
function drawHarry() {
  ctx.drawImage(harryImg, birdX - birdSize / 2, birdY - birdSize / 2, birdSize, birdSize);
}

// =========================
function drawPipes() {
  ctx.fillStyle = "green";
  pipes.forEach(p => {
    ctx.fillRect(p.x, 0, pipeWidth, p.y);
    ctx.fillRect(p.x, p.y + pipeGap, pipeWidth, canvas.height);
  });
}

// =========================
function detectCollision() {
  for (let p of pipes) {
    if (
      birdX + birdSize/2 > p.x &&
      birdX - birdSize/2 < p.x + pipeWidth &&
      (birdY - birdSize/2 < p.y || birdY + birdSize/2 > p.y + pipeGap)
    ) return true;
  }

  return (birdY - birdSize/2 < 0 || birdY + birdSize/2 > canvas.height);
}

// =========================
function updateScore() {
  pipes.forEach(p => {
    if (!p.passed && p.x + pipeWidth < birdX) {
      p.passed = true;
      score++;
    }
  });
}

// =========================
function drawScore() {
  ctx.fillStyle = "red";
  ctx.font = "40px Arial Black";
  ctx.fillText("Score: " + score, 20, 50);
}

// =========================
function gameOver() {
  isGameOver = true;
  cancelAnimationFrame(animationId);

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("flappyHarryHighScore", highScore);
  }

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "60px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "30px Arial";
  ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText("Tap or Press Any Key to Restart", canvas.width / 2, canvas.height / 2 + 70);
}

// =========================
function loop() {
  if (isGameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (frame % 150 === 0) spawnPipe();

  pipes.forEach(p => p.x -= 2);
  pipes = pipes.filter(p => p.x + pipeWidth > 0);

  velocity += gravity;
  birdY += velocity;

  drawHarry();
  drawPipes();
  updateScore();
  drawScore();

  if (detectCollision()) {
    gameOver();
    return;
  }

  frame++;
  animationId = requestAnimationFrame(loop);
}

// =========================
function startGame() {
  pipes = [];
  score = 0;
  frame = 0;
  velocity = 0;
  isGameOver = false;
  loop();
}

