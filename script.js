const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("startScreen");
const winScreen = document.getElementById("winScreen");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const scoreValue = document.getElementById("scoreValue");
const targetValue = document.getElementById("targetValue");
const finalScore = document.getElementById("finalScore");
const loadingScreen = document.getElementById("loadingScreen");

// Responsive canvas setup
function setupCanvas() {
  const container = document.querySelector('.game-container');
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    // Mobile: 9:16 aspect ratio
    canvas.width = container.clientWidth;
    canvas.height = Math.floor(container.clientWidth * (16/9));
  } else {
    // Desktop: 16:9 aspect ratio
    canvas.width = container.clientWidth;
    canvas.height = Math.floor(container.clientWidth * (9/16));
  }
}

// Initialize canvas
setupCanvas();
window.addEventListener('resize', setupCanvas);

// Game variables
let face = { x: 80, y: 150, w: 50, h: 50, velocity: 0 };
let pipes = [];
let coins = [];
let frame = 0;
let score = 0;
let gameOver = false;
let started = false;
let gameWon = false;
const WIN_SCORE = 5; // Score needed to win

// Adjust game parameters based on screen size
function getGameParams() {
  const isMobile = window.innerWidth <= 768;
  return {
    faceWidth: isMobile ? 40 : 50,
    faceHeight: isMobile ? 40 : 50,
    pipeSpeed: isMobile ? 1 : 2.5, // SLOWER on mobile
    pipeGap: isMobile ? 140 : 150, // Slightly larger gap on mobile
    coinSize: isMobile ? 25 : 30,
    gravity: isMobile ? 0.3 : 0.4, // LESS gravity on mobile
    jumpPower: isMobile ? -7 : -8, // Adjusted jump for mobile
    pipeFrequency: isMobile ? 120 : 100, // FEWER pipes on mobile
    coinFrequency: isMobile ? 100 : 80 // FEWER coins on mobile
  };
}

// Create placeholder images
function createPlaceholderFace() {
  const canvas = document.createElement('canvas');
  const params = getGameParams();
  canvas.width = params.faceWidth;
  canvas.height = params.faceHeight;
  const ctx = canvas.getContext('2d');
  
  // Draw face
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(params.faceWidth/2, params.faceHeight/2, params.faceWidth/2, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw eyes
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(params.faceWidth/2 - 10, params.faceHeight/2 - 10, 4, 0, Math.PI * 2);
  ctx.arc(params.faceWidth/2 + 10, params.faceHeight/2 - 10, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw mouth
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(params.faceWidth/2, params.faceHeight/2 + 5, 8, 0, Math.PI);
  ctx.stroke();
  
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

function createPlaceholderPipe() {
  const canvas = document.createElement('canvas');
  canvas.width = 80;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  
  // Draw pipe
  ctx.fillStyle = '#228B22';
  ctx.fillRect(0, 0, 80, 400);
  
  // Draw pipe details
  ctx.fillStyle = '#32CD32';
  ctx.fillRect(0, 0, 80, 20);
  ctx.fillRect(0, 380, 80, 20);
  ctx.fillRect(0, 190, 80, 20);
  
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

function createPlaceholderCoin(type) {
  const canvas = document.createElement('canvas');
  const params = getGameParams();
  canvas.width = params.coinSize;
  canvas.height = params.coinSize;
  const ctx = canvas.getContext('2d');
  
  // Draw coin
  ctx.fillStyle = type === 'mamata' ? '#FF69B4' : '#00BFFF';
  ctx.beginPath();
  ctx.arc(params.coinSize/2, params.coinSize/2, params.coinSize/2, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw coin shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.arc(params.coinSize/2 - 5, params.coinSize/2 - 5, params.coinSize/4, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw coin letter
  ctx.fillStyle = '#000';
  ctx.font = `bold ${Math.floor(params.coinSize/2)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(type === 'mamata' ? 'M' : 'R', params.coinSize/2, params.coinSize/2);
  
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

// Create placeholder images
const faceImg = createPlaceholderFace();
const pipeImg = createPlaceholderPipe();
const mamataCoinImg = createPlaceholderCoin('mamata');
const rahulCoinImg = createPlaceholderCoin('rahul');
const winImg = new Image();
winImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23FFD700'/%3E%3Ctext x='100' y='75' font-family='Arial' font-size='24' font-weight='bold' text-anchor='middle' fill='%23333'%3EWINNER!%3C/text%3E%3C/svg%3E";

// Audio assets - create silent audio as fallback
function createSilentAudio() {
  const audio = new Audio();
  audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
  return audio;
}

const bgm = createSilentAudio();
const jumpSound = createSilentAudio();
const crashSound = createSilentAudio();
const mamataCoinSound = createSilentAudio();
const rahulCoinSound = createSilentAudio();
const winSound = createSilentAudio();

// Try to load actual assets
function loadAsset(img, src) {
  const newImg = new Image();
  newImg.onload = function() {
    img.src = newImg.src;
    console.log(`Loaded: ${src}`);
  };
  newImg.onerror = function() {
    console.log(`Failed to load: ${src}, using placeholder`);
  };
  newImg.src = src;
}

function loadAudio(audio, src) {
  const newAudio = new Audio();
  newAudio.oncanplaythrough = function() {
    audio.src = newAudio.src;
    console.log(`Loaded: ${src}`);
  };
  newAudio.onerror = function() {
    console.log(`Failed to load: ${src}, using silent audio`);
  };
  newAudio.src = src;
}

// Load actual assets if available
loadAsset(faceImg, "assets/face.png");
loadAsset(pipeImg, "assets/pipe.jpg");
loadAsset(mamataCoinImg, "assets/mamata.jpg");
loadAsset(rahulCoinImg, "assets/rahul.png");
loadAsset(winImg, "assets/win.jpg");

loadAudio(bgm, "assets/bgm.mp3");
loadAudio(jumpSound, "assets/jump.mp3");
loadAudio(crashSound, "assets/crash.mp3");
loadAudio(mamataCoinSound, "assets/mamata.mp3");
loadAudio(rahulCoinSound, "assets/rahul.mp3");
loadAudio(winSound, "assets/win.mp3");

// Set audio properties
bgm.loop = true;
bgm.volume = 0.5;

// Stop all audio
function stopAllAudio() {
  bgm.pause();
  bgm.currentTime = 0;
  jumpSound.pause();
  jumpSound.currentTime = 0;
  crashSound.pause();
  crashSound.currentTime = 0;
  mamataCoinSound.pause();
  mamataCoinSound.currentTime = 0;
  rahulCoinSound.pause();
  rahulCoinSound.currentTime = 0;
  winSound.pause();
  winSound.currentTime = 0;
}

// Handle jump - Fixed keyboard controls
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "Enter") {
    e.preventDefault();
    flap();
  }
});

canvas.addEventListener("click", flap);
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  flap();
});

startBtn.addEventListener("click", () => {
  startScreen.style.display = "none";
  started = true;
  stopAllAudio();
  bgm.play().catch(e => console.log("Audio play failed:", e));
});

restartBtn.addEventListener("click", () => {
  winScreen.style.display = "none";
  resetGame();
  started = true;
  stopAllAudio();
  bgm.play().catch(e => console.log("Audio play failed:", e));
});

function flap() {
  if (!started) {
    startScreen.style.display = "none";
    started = true;
    stopAllAudio();
    bgm.play().catch(e => console.log("Audio play failed:", e));
  }
  if (!gameOver && !gameWon) {
    const params = getGameParams();
    face.velocity = params.jumpPower;
    jumpSound.play().catch(e => console.log("Audio play failed:", e));
  } else if (gameOver) {
    resetGame();
    started = true;
    stopAllAudio();
    bgm.play().catch(e => console.log("Audio play failed:", e));
  }
}

// Reset game
function resetGame() {
  pipes = [];
  coins = [];
  score = 0;
  scoreValue.textContent = score;
  frame = 0;
  const params = getGameParams();
  face.w = params.faceWidth;
  face.h = params.faceHeight;
  face.y = canvas.height / 3;
  face.velocity = 0;
  gameOver = false;
  gameWon = false;
  started = false;
}

// Generate pipes
function generatePipes() {
  const params = getGameParams();
  if (frame % params.pipeFrequency === 0) {
    let gap = params.pipeGap;
    let topHeight = Math.floor(Math.random() * (canvas.height / 2)) + 50;
    pipes.push({
      x: canvas.width,
      top: topHeight,
      bottom: topHeight + gap,
      passed: false,
    });
  }
}

// Generate coins
function generateCoins() {
  const params = getGameParams();
  if (frame % params.coinFrequency === 0) {
    let coinType = Math.random() > 0.5 ? "mamata" : "rahul";
    coins.push({
      x: canvas.width,
      y: Math.floor(Math.random() * (canvas.height - 100)) + 50,
      w: params.coinSize,
      h: params.coinSize,
      type: coinType,
      collected: false
    });
  }
}

// Draw everything
function draw() {
  // Clear canvas with sky background
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw ground
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
  ctx.fillStyle = '#90EE90';
  ctx.fillRect(0, canvas.height - 40, canvas.width, 10);

  // Draw pipes
  pipes.forEach((p) => {
    // Top pipe (flipped)
    ctx.save();
    ctx.translate(p.x, p.top);
    ctx.scale(1, -1);
    ctx.drawImage(pipeImg, 0, 0, 80, 400);
    ctx.restore();
    
    // Bottom pipe
    ctx.drawImage(pipeImg, p.x, p.bottom, 80, 400);
  });

  // Draw coins
  coins.forEach((coin) => {
    if (!coin.collected) {
      const coinImg = coin.type === "mamata" ? mamataCoinImg : rahulCoinImg;
      // Add slight floating animation
      const floatOffset = Math.sin(frame * 0.1) * 3;
      ctx.drawImage(coinImg, coin.x, coin.y + floatOffset, coin.w, coin.h);
    }
  });

  // Draw face with rotation based on velocity
  ctx.save();
  ctx.translate(face.x + face.w/2, face.y + face.h/2);
  let rotation = face.velocity * 0.05;
  rotation = Math.max(-0.5, Math.min(0.5, rotation));
  ctx.rotate(rotation);
  ctx.drawImage(faceImg, -face.w/2, -face.h/2, face.w, face.h);
  ctx.restore();

  // Game over or win screens
  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", canvas.width/2, canvas.height/2 - 30);
    ctx.font = "20px Arial";
    ctx.fillText("Press Space or Click to Restart", canvas.width/2, canvas.height/2 + 20);
    ctx.textAlign = "left";
  } else if (gameWon) {
    // Win screen is handled by the HTML overlay
  }
}

// Update logic
function update() {
  if (!started || gameOver || gameWon) return;

  const params = getGameParams();
  
  // Apply gravity and update position
  face.velocity += params.gravity;
  face.y += face.velocity;

  generatePipes();
  generateCoins();

  // Update pipes
  pipes.forEach((p) => {
    p.x -= params.pipeSpeed;

    // Collision with pipes
    if (
      face.x + face.w - 10 > p.x &&
      face.x + 10 < p.x + 80 &&
      (face.y + 10 < p.top || face.y + face.h - 10 > p.bottom)
    ) {
      stopAllAudio();
      crashSound.play().catch(e => console.log("Audio play failed:", e));
      gameOver = true;
    }

    // Scoring for pipes
    if (!p.passed && p.x + 80 < face.x) {
      score++;
      scoreValue.textContent = score;
      p.passed = true;
    }
  });

  // Update coins
  coins.forEach((coin) => {
    if (!coin.collected) {
      coin.x -= params.pipeSpeed;
      
      // Coin collection
      if (
        face.x + face.w - 10 > coin.x &&
        face.x + 10 < coin.x + coin.w &&
        face.y + 10 < coin.y + coin.h &&
        face.y + face.h - 10 > coin.y
      ) {
        coin.collected = true;
        score += 2; // Coins worth more points
        scoreValue.textContent = score;
        
        // Play appropriate coin sound
        if (coin.type === "mamata") {
          mamataCoinSound.play().catch(e => console.log("Audio play failed:", e));
        } else {
          rahulCoinSound.play().catch(e => console.log("Audio play failed:", e));
        }
      }
    }
  });

  // Remove offscreen pipes and coins
  pipes = pipes.filter((p) => p.x + 80 > 0);
  coins = coins.filter((c) => c.x + c.w > 0 || !c.collected);

  // Ground or ceiling collision
  if (face.y + face.h >= canvas.height - 40 || face.y <= 0) {
    stopAllAudio();
    crashSound.play().catch(e => console.log("Audio play failed:", e));
    gameOver = true;
  }

  // Check for win condition
  if (score >= WIN_SCORE && !gameWon) {
    gameWon = true;
    stopAllAudio();
    winSound.play().catch(e => console.log("Audio play failed:", e));
    finalScore.textContent = score;
    winScreen.style.display = "flex";
    // Update win image if loaded successfully
    if (winImg.complete && winImg.naturalHeight !== 0) {
      document.getElementById("winImage").style.backgroundImage = `url(${winImg.src})`;
      document.getElementById("winImage").style.backgroundSize = "cover";
      document.getElementById("winImage").innerHTML = "";
    }
  }

  frame++;
}

// Game loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Set target score display
targetValue.textContent = WIN_SCORE;

// Hide loading screen after a short delay
setTimeout(() => {
  loadingScreen.style.display = "none";
}, 1000);

// Initialize game
resetGame();

// Start the game loop
loop();