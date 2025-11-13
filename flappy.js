// ====== Intro Screen Handling ======
const intro = document.getElementById("intro");
const startBtn = document.getElementById("startBtn");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

startBtn.addEventListener("click", () => {
  intro.style.opacity = 0;
  setTimeout(() => {
    intro.style.display = "none";
    canvas.style.display = "block";
    startGame();
  }, 1000);
});

// ====== Game Logic ======
function startGame() {
  // ====== Setup ======
  function resizeCanvas() {
    const prevH = canvas.height || window.innerHeight;
    const prevBirdRatio = birdY ? birdY / prevH : 0.5;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    pipeGap = Math.round(canvas.height * 0.32);
    pipeWidth = Math.round(Math.max(50, canvas.width * 0.06 * 1.1)); // +10%
    birdX = canvas.width / 6;
    birdY = Math.max(
      birdRadius + 5,
      Math.min(canvas.height - birdRadius - 5, prevBirdRatio * canvas.height)
    );
  }
  window.addEventListener("resize", resizeCanvas);

  // ====== Game variables ======
  let birdRadius = 25;
  let birdX = 0;
  let birdY = 0;
  let gravity = 0.4;
  let velocity = 0;
  let jump = -8;

  let pipes = [];
  let pipeWidth = Math.round(Math.max(50, window.innerWidth * 0.06 * 1.1)); // +10%
  let pipeGap = Math.round(window.innerHeight * 0.32);
  let frame = 0;
  let score = 0;
  let pipeSpeed = 1.8;
  let spawnInterval = 170;
  let isGameOver = false;
  let animationId = null;

  resizeCanvas();
  birdX = canvas.width / 6;
  birdY = canvas.height / 2;

  // ====== Input ======
  function flapOrRestart() {
    if (isGameOver) restartGame();
    else velocity = jump;
  }

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      flapOrRestart();
    }
  });

  document.addEventListener("touchstart", (e) => {
    e.preventDefault();
    flapOrRestart();
  }, { passive: false });

  document.addEventListener("mousedown", () => flapOrRestart());

  // ====== Game functions ======
  function spawnPipe() {
    const margin = 100;
    const maxTop = canvas.height - pipeGap - margin;
    const topHeight = Math.floor(Math.random() * (maxTop - margin + 1)) + margin;
    pipes.push({ x: canvas.width, y: topHeight, passed: false });
  }

  function drawBird() {
    ctx.beginPath();
    ctx.arc(birdX, birdY, birdRadius, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
  }

  function drawPipes() {
    ctx.fillStyle = "green";
    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      ctx.fillRect(p.x, 0, pipeWidth, p.y);
      ctx.fillRect(p.x, p.y + pipeGap, pipeWidth, canvas.height - (p.y + pipeGap));
    }
  }

  function detectCollisions() {
    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      if (
        birdX + birdRadius > p.x &&
        birdX - birdRadius < p.x + pipeWidth &&
        (birdY - birdRadius < p.y || birdY + birdRadius > p.y + pipeGap)
      ) {
        return true;
      }
    }
    if (birdY - birdRadius < 0 || birdY + birdRadius > canvas.height) return true;
    return false;
  }

  function updateScore() {
    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      if (!p.passed && p.x + pipeWidth < birdX) {
        p.passed = true;
        score++;
        flashScore();
      }
    }
  }

  let scoreFlashTimer = 0;
  function flashScore() {
    scoreFlashTimer = 12;
  }

  function drawScore() {
    ctx.save();
    ctx.fillStyle = "black";
    let size = 28;
    if (scoreFlashTimer > 0) {
      size = 34;
      scoreFlashTimer--;
    }
    ctx.font = `${size}px Arial`;
    ctx.fillText("Score: " + score, 20, 40);
    ctx.restore();
  }

  function clearOffscreenPipes() {
    pipes = pipes.filter(p => p.x + pipeWidth > 0);
  }

  function gameOver() {
    isGameOver = true;
    if (animationId) cancelAnimationFrame(animationId);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "24px Arial";
    ctx.fillText("Tap / Click / Press Space to Restart", canvas.width / 2, canvas.height / 2 + 30);
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

    for (let i = 0; i < pipes.length; i++) {
      pipes[i].x -= pipeSpeed;
    }

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

  // start
  loop();
}
