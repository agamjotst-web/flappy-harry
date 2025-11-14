// ====== Setup ======
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const intro = document.getElementById("intro");
const startBtn = document.getElementById("startBtn");
const highScoreDisplay = document.getElementById("highScoreDisplay");

// Load and show high score from localStorage
let highScore = parseInt(localStorage.getItem("flappyHarryHighScore") || "0", 10);
highScoreDisplay.textContent = "Highest Score: " + highScore;

startBtn.addEventListener("click", () => {
  intro.style.display = "none";
  canvas.style.display = "block";
  startGame();
});

// ====== Game variables ======
let birdRadius = 25;
let birdX = 0;
let birdY = 0;
let gravity = 0.4;
let velocity = 0;
let jump = -8;
let pipes = [];
let pipeWidth = Math.round(Math.max(50, window.innerWidth * 0.06 * 1.1));
let pipeGap = Math.round(window.innerHeight * 0.32);
let frame = 0;
let score = 0;
let pipeSpeed = 1.8;
let spawnInterval = 170;
let isGameOver = false;
let animationId = null;

function resizeCanvas() {
  const prevH = canvas.height || window.innerHeight;
  const prevBirdRatio = birdY ? birdY / prevH : 0.5;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  pipeGap = Math.round(canvas.height * 0.32);
  birdX = canvas.width / 6;
  birdY = Math.max(birdRadius + 5, Math.min(canvas.height - birdRadius - 5, prevBirdRatio * canvas.height));
}
window.addEventListener("resize", resizeCanvas);

// ====== Input handling ======
function flapOrRestart() {
  if (isGameOver) return; // disable flap after game over
  velocity = jump;
}

document.addEventListener("keydown", (e) => {
  if (isGameOver) {
    window.location.reload(); // ✅ redirect to home if game over
  } else if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    flapOrRestart();
  }
});

document.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (isGameOver) window.location.reload(); // ✅ redirect on touch after game over
  else flapOrRestart();
}, { passive: false });

document.addEventListener("mousedown", (e) => {
  if (isGameOver) window.location.reload(); // ✅ redirect on click after game over
  else flapOrRestart();
});

// ====== Game functions ======
function spawnPipe() {
  const margin = 100;
  const maxTop = canvas.height - pipeGap - margin;
  const topHeight = Math.floor(Math.random() * (maxTop - margin + 1)) + margin;
  pipes.push({ x: canvas.width, y: topHeight, passed: false });
}

// === Draw Golden Bird with flapping wings and sparkles ===
let wingAngle = 0;
function drawBird() {
  ctx.save();
  ctx.translate(birdX, birdY);
  ctx.scale(1.2, 1.2);

  const gradient = ctx.createRadialGradient(0, 0, 5, 0, 0, birdRadius);
  gradient.addColorStop(0, "#fff6b0");
  gradient.addColorStop(0.4, "#ffd700");
  gradient.addColorStop(1, "#cfa600");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, birdRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffec80";
  ctx.lineWidth = 2;
  ctx.stroke();

  wingAngle += 0.2;
  const wingOffset = Math.sin(wingAngle) * 6;

  ctx.fillStyle = "#ffeb3b";
  ctx.beginPath();
  ctx.moveTo(-birdRadius / 2, 0);
  ctx.quadraticCurveTo(-birdRadius * 1.5, wingOffset, -birdRadius / 2, -wingOffset);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(birdRadius / 2, 0);
  ctx.quadraticCurveTo(birdRadius * 1.5, -wingOffset, birdRadius / 2, wingOffset);
  ctx.fill();

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(birdRadius / 3, -5, 3, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 4; i++) {
    const sx = (Math.random() - 0.5) * birdRadius * 2;
    const sy = (Math.random() - 0.5) * birdRadius * 2;
    ctx.fillStyle = `rgba(255,255,150,${Math.random() * 0.8})`;
    ctx.fillRect(sx, sy, 2, 2);
  }

  ctx.restore();
}

function drawPipes() {
  ctx.fillStyle = "green";
  for (const p of pipes) {
    ctx.fillRect(p.x, 0, pipeWidth, p.y);
    ctx.fillRect(p.x, p.y + pipeGap, pipeWidth, canvas.height - (p.y + pipeGap));
  }
}

function detectCollisions() {
  for (const p of pipes) {
    if (
      birdX + birdRadius > p.x &&
      birdX - birdRadius < p.x + pipeWidth &&
      (birdY - birdRadius < p.y || birdY + birdRadius > p.y + pipeGap)
    ) return true;
  }
  return birdY - birdRadius < 0 || birdY + birdRadius > canvas.height;
}

function updateScore() {
  for (const p of pipes) {
    if (!p.passed && p.x + pipeWidth < birdX) {
      p.passed = true;
      score++;
      flashScore();
    }
  }
}

let scoreFlashTimer = 0;
function flashScore() { scoreFlashTimer = 12; }

function drawScore() {
  ctx.save();
  ctx.fillStyle = "red";
  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 15;
  let size = scoreFlashTimer > 0 ? 38 : 30;
  if (scoreFlashTimer > 0) scoreFlashTimer--;
  ctx.font = `${size}px Arial Black`;
  ctx.fillText("Score: " + score, 20, 50);
  ctx.restore();
}

function clearOffscreenPipes() {
  pipes = pipes.filter(p => p.x + pipeWidth > 0);
}

function gameOver() {
  isGameOver = true;
  if (animationId) cancelAnimationFrame(animationId);

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("flappyHarryHighScore", highScore);
  }

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = "60px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "28px Arial";
  ctx.fillText("Your Score: " + score, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText("Press any key to return...", canvas.width / 2, canvas.height / 2 + 60);
  ctx.restore();
}

function restartGame() {
  pipes = [];
  score = 0;
  frame = 0;
  velocity = 0;
  isGameOver = false;
  birdX = canvas.width / 6;
  birdY = canvas.height / 2;
  loop();
}

// ====== Main loop ======
function loop() {
  if (isGameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (frame % spawnInterval === 0) spawnPipe();
  for (const p of pipes) p.x -= pipeSpeed;

  velocity += gravity;
  birdY += velocity;

  drawPipes();
  drawBird();
  updateScore();
  drawScore();
  clearOffscreenPipes();

  if (detectCollisions()) {
    gameOver();
    return;
  }

  frame++;
  animationId = requestAnimationFrame(loop);
}

function startGame() {
  resizeCanvas();
  birdX = canvas.width / 6;
  birdY = canvas.height / 2;
  loop();
}
