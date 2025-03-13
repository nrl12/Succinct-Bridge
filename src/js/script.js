/*
If you want to know how this game was made, check out this video, that explains how it's made: 
https://youtu.be/eue3UdFvwPo
Follow me on twitter for more: https://twitter.com/HunorBorbely
*/

// Extend the base functionality of JavaScript
Array.prototype.last = function () {
  return this[this.length - 1];
};

// A sinus function that acceps degrees instead of radians
Math.sinus = function (degree) {
  return Math.sin((degree / 180) * Math.PI);
};

// Game data
let phase = "waiting"; // waiting | stretching | turning | walking | transitioning | falling
let lastTimestamp; // The timestamp of the previous requestAnimationFrame cycle

let heroX; // Changes when moving forward
let heroY; // Only changes when falling
let sceneOffset; // Moves the whole game

let platforms = [];
let sticks = [];
let trees = [];
let collectibles = []; // Array to store collectible items

// Todo: Save high score to localStorage (?)

let score = 0;
let perfectJumps = 0;
let normalJumps = 0;
let collectiblesGathered = 0;

// Configuration
const canvasWidth = 375;
const canvasHeight = 375;
const platformHeight = 100;
const heroDistanceFromEdge = 10; // While waiting
const paddingX = 100; // The waiting position of the hero in from the original canvas size
const perfectAreaSize = 10;
const collectibleSize = 30; // Size of collectible items

// The background moves slower than the hero
const backgroundSpeedMultiplier = 0.2;

const hill1BaseHeight = 100;
const hill1Amplitude = 10;
const hill1Stretch = 1;
const hill2BaseHeight = 70;
const hill2Amplitude = 20;
const hill2Stretch = 0.5;

// Add difficulty settings
const difficulties = {
  easy: {
    platformGapMin: 40,
    platformGapMax: 150,
    platformWidthMin: 40,
    platformWidthMax: 100,
    stretchingSpeed: 5,
    turningSpeed: 5,
    walkingSpeed: 5,
    scoreMultiplier: 1,
    name: "EASY"
  },
  normal: {
    platformGapMin: 40,
    platformGapMax: 200,
    platformWidthMin: 30,
    platformWidthMax: 100,
    stretchingSpeed: 4,
    turningSpeed: 4,
    walkingSpeed: 4,
    scoreMultiplier: 1.5,
    name: "NORMAL"
  },
  hard: {
    platformGapMin: 50,
    platformGapMax: 250,
    platformWidthMin: 20,
    platformWidthMax: 80,
    stretchingSpeed: 3,
    turningSpeed: 3,
    walkingSpeed: 3,
    scoreMultiplier: 2,
    name: "HARD"
  }
};

let currentDifficulty = difficulties.normal; // Default difficulty

const stretchingSpeed = 4; // Milliseconds it takes to draw a pixel
const turningSpeed = 4; // Milliseconds it takes to turn a degree
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 2;

const heroWidth = 50; // Increased from 17
const heroHeight = 80; // Increased from 30

const canvas = document.getElementById("game");
canvas.width = window.innerWidth; // Make the Canvas full screen
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

const introductionElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");

// Load hero image
const heroImage = new Image();
heroImage.src = 'images/uma.png';

// Load collectible image
const collectibleImage = new Image();
collectibleImage.src = 'images/sp1.png';

// Update introduction element style
introductionElement.style.position = 'fixed';
introductionElement.style.top = '100px';
introductionElement.style.left = '50%';
introductionElement.style.transform = 'translateX(-50%)';
introductionElement.style.padding = '15px 30px';
introductionElement.style.background = 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(20, 20, 20, 0.9))';
introductionElement.style.color = '#fff';
introductionElement.style.fontSize = '20px';
introductionElement.style.fontFamily = "'Segoe UI', sans-serif";
introductionElement.style.borderRadius = '15px';
introductionElement.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3), inset 0 2px rgba(255, 255, 255, 0.1)';
introductionElement.style.border = '1px solid rgba(255, 255, 255, 0.1)';
introductionElement.style.backdropFilter = 'blur(10px)';
introductionElement.style.webkitBackdropFilter = 'blur(10px)';
introductionElement.style.zIndex = '1000';
introductionElement.style.textAlign = 'center';
introductionElement.style.transition = 'opacity 0.3s ease-out';
introductionElement.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
introductionElement.style.letterSpacing = '0.5px';

// Initialize layout
resetGame();

// Style the score element for a modern look
scoreElement.style.position = 'fixed';
scoreElement.style.top = '20px';
scoreElement.style.right = '20px';
scoreElement.style.padding = '15px 25px';
scoreElement.style.background = 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(20, 20, 20, 0.9))';
scoreElement.style.color = '#fff';
scoreElement.style.fontSize = '28px';
scoreElement.style.fontWeight = '600';
scoreElement.style.borderRadius = '15px';
scoreElement.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3), inset 0 2px rgba(255, 255, 255, 0.1)';
scoreElement.style.border = '1px solid rgba(255, 255, 255, 0.1)';
scoreElement.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
scoreElement.style.zIndex = '1000';
scoreElement.style.backdropFilter = 'blur(10px)';
scoreElement.style.webkitBackdropFilter = 'blur(10px)';
scoreElement.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';
scoreElement.style.letterSpacing = '1px';
scoreElement.style.display = 'flex';
scoreElement.style.alignItems = 'center';
scoreElement.style.justifyContent = 'center';
scoreElement.style.minWidth = '120px';
scoreElement.style.transform = 'translateZ(0)';
scoreElement.style.transition = 'all 0.3s ease-out';

// Initialize score with 0
updateScore(0);

// Start the animation loop immediately
window.requestAnimationFrame(animate);

// Resets game variables and layouts but does not start the game (game starts on keypress)
function resetGame() {
  // Reset game progress
  phase = "waiting";
  lastTimestamp = undefined;
  sceneOffset = 0;
  score = 0;
  perfectJumps = 0;
  normalJumps = 0;
  collectiblesGathered = 0;

  // Reset game over flags
  window.isGameOver = false;
  window.gameOverPanelShown = false;

  // Remove game over panel
  const gameOverPanel = document.getElementById('gameOverPanel');
  if (gameOverPanel) {
    gameOverPanel.style.opacity = '0';
    gameOverPanel.style.transform = 'translate(-50%, -50%) scale(0.8)';
    setTimeout(() => {
      gameOverPanel.remove();
    }, 500);
  }

  introductionElement.style.opacity = 1;
  perfectElement.style.opacity = 0;
  restartButton.style.display = "none";

  // Update score display
  updateScore(0);

  // The first platform is always the same
  // x + w has to match paddingX
  platforms = [{ x: 50, w: 50 }];
  generatePlatform();
  generatePlatform();
  generatePlatform();
  generatePlatform();

  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

  trees = [];
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();

  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
  heroY = 0;

  // Reset collectibles
  collectibles = [];
  generateCollectible();
  generateCollectible();
  generateCollectible();

  // Force a redraw
  draw();

  // Start animation loop
  window.requestAnimationFrame(animate);
}

function generateTree() {
  const minimumGap = 30;
  const maximumGap = 150;

  // X coordinate of the right edge of the furthest tree
  const lastTree = trees[trees.length - 1];
  let furthestX = lastTree ? lastTree.x : 0;

  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));

  const treeColors = ["#6D8821", "#8FAC34", "#98B333"];
  const color = treeColors[Math.floor(Math.random() * 3)];

  trees.push({ x, color });
}

// Add difficulty selector UI
function createDifficultySelector() {
  const selector = document.createElement('div');
  selector.id = 'difficultySelector';
  selector.style.position = 'fixed';
  selector.style.top = '20px';
  selector.style.left = '20px';
  selector.style.padding = '15px';
  selector.style.background = 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(20, 20, 20, 0.9))';
  selector.style.borderRadius = '15px';
  selector.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
  selector.style.zIndex = '1000';
  selector.style.display = 'flex';
  selector.style.gap = '10px';
  selector.style.backdropFilter = 'blur(10px)';

  ['easy', 'normal', 'hard'].forEach(diff => {
    const btn = document.createElement('button');
    btn.textContent = difficulties[diff].name;
    btn.style.padding = '8px 15px';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'all 0.3s ease';
    btn.style.background = currentDifficulty === difficulties[diff] ? 
      'linear-gradient(135deg, #ff6b6b, #ffb347)' : 
      'rgba(255, 255, 255, 0.1)';
    btn.style.color = '#fff';
    btn.style.fontFamily = "'Segoe UI', sans-serif";
    btn.style.fontSize = '14px';
    btn.style.fontWeight = 'bold';

    btn.onmouseover = () => {
      if (currentDifficulty !== difficulties[diff]) {
        btn.style.background = 'rgba(255, 255, 255, 0.2)';
      }
    };

    btn.onmouseout = () => {
      if (currentDifficulty !== difficulties[diff]) {
        btn.style.background = 'rgba(255, 255, 255, 0.1)';
      }
    };

    btn.onclick = () => {
      setDifficulty(diff);
      selector.querySelectorAll('button').forEach(b => {
        b.style.background = 'rgba(255, 255, 255, 0.1)';
      });
      btn.style.background = 'linear-gradient(135deg, #ff6b6b, #ffb347)';
    };

    selector.appendChild(btn);
  });

  document.body.appendChild(selector);
}

// Function to set difficulty
function setDifficulty(level) {
  currentDifficulty = difficulties[level];
  resetGame();
}

// Modify generatePlatform function to use difficulty settings
function generatePlatform() {
  const minimumGap = currentDifficulty.platformGapMin;
  const maximumGap = currentDifficulty.platformGapMax;
  const minimumWidth = currentDifficulty.platformWidthMin;
  const maximumWidth = currentDifficulty.platformWidthMax;

  const lastPlatform = platforms[platforms.length - 1];
  let furthestX = lastPlatform.x + lastPlatform.w;

  const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap));
  const w = minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

  platforms.push({ x, w });
  generateCollectible();
}

// If space was pressed restart the game
window.addEventListener("keydown", function (event) {
  if (event.key == " ") {
    event.preventDefault();
    resetGame();
    return;
  }
});

// Update event listeners
restartButton.addEventListener("click", function (event) {
  event.preventDefault();
  resetGame();
  restartButton.style.display = "none";
  
  // Reset mouse events
  window.removeEventListener("mousedown", handleMouseDown);
  window.removeEventListener("mouseup", handleMouseUp);
  
  window.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mouseup", handleMouseUp);
});

// Separate mouse event handlers
function handleMouseDown(event) {
  if (phase == "waiting") {
    lastTimestamp = undefined;
    introductionElement.style.opacity = 0;
    phase = "stretching";
    window.requestAnimationFrame(animate);
  }
}

function handleMouseUp(event) {
  if (phase == "stretching") {
    phase = "turning";
  }
}

// Replace existing mouse event listeners with the new handlers
window.removeEventListener("mousedown", handleMouseDown);
window.removeEventListener("mouseup", handleMouseUp);

window.addEventListener("mousedown", handleMouseDown);
window.addEventListener("mouseup", handleMouseUp);

window.addEventListener("resize", function (event) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
});

// The main game loop
function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
    return;
  }

  // Always draw the scene to keep fire animation running
  draw();
  
  // Check if game is over
  if (window.isGameOver) {
    window.requestAnimationFrame(animate);
    lastTimestamp = timestamp;
    return;
  }

  // Skip game logic if in waiting phase
  if (phase === "waiting") {
    window.requestAnimationFrame(animate);
    lastTimestamp = timestamp;
    return;
  }

  switch (phase) {
    case "stretching": {
      sticks.last().length += (timestamp - lastTimestamp) / currentDifficulty.stretchingSpeed;
      break;
    }
    case "turning": {
      sticks.last().rotation += (timestamp - lastTimestamp) / currentDifficulty.turningSpeed;

      if (sticks.last().rotation > 90) {
        sticks.last().rotation = 90;

        const [nextPlatform, perfectHit] = thePlatformTheStickHits();
        if (nextPlatform) {
          // Track jumps
          if (perfectHit) {
            perfectJumps++;
            updateScore(score + Math.round(2 * currentDifficulty.scoreMultiplier));
          } else {
            normalJumps++;
            updateScore(score + Math.round(1 * currentDifficulty.scoreMultiplier));
          }

          if (perfectHit) {
            perfectElement.style.opacity = 1;
            setTimeout(() => (perfectElement.style.opacity = 0), 1000);
          }

          generatePlatform();
          generateTree();
          generateTree();
        }

        phase = "walking";
      }
      break;
    }
    case "walking": {
      heroX += (timestamp - lastTimestamp) / currentDifficulty.walkingSpeed;

      const [nextPlatform] = thePlatformTheStickHits();
      if (nextPlatform) {
        // If hero will reach another platform then limit it's position at it's edge
        const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "transitioning";
        }
      } else {
        // If hero won't reach another platform then limit it's position at the end of the pole
        const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "falling";
        }
      }
      break;
    }
    case "transitioning": {
      sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;

      const [nextPlatform] = thePlatformTheStickHits();
      if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
        // Add the next step
        sticks.push({
          x: nextPlatform.x + nextPlatform.w,
          length: 0,
          rotation: 0
        });
        phase = "waiting";
      }
      break;
    }
    case "falling": {
      if (sticks.last().rotation < 180)
        sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

      heroY += (timestamp - lastTimestamp) / fallingSpeed;
      const maxHeroY =
        platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
      if (heroY > maxHeroY) {
        restartButton.style.display = "block";
        showGameOverPanel();
        window.requestAnimationFrame(animate); // Keep animation running
        lastTimestamp = timestamp;
        return;
      }
      break;
    }
    default:
      throw Error("Wrong phase");
  }

  if (phase === "walking" || phase === "transitioning") {
    checkCollectibles();
  }

  window.requestAnimationFrame(animate);
  lastTimestamp = timestamp;
}

// Returns the platform the stick hit (if it didn't hit any stick then return undefined)
function thePlatformTheStickHits() {
  if (sticks.last().rotation != 90)
    throw Error(`Stick is ${sticks.last().rotation}°`);
  const stickFarX = sticks.last().x + sticks.last().length;

  const platformTheStickHits = platforms.find(
    (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
  );

  // If the stick hits the perfect area
  if (
    platformTheStickHits &&
    platformTheStickHits.x + platformTheStickHits.w / 2 - perfectAreaSize / 2 <
      stickFarX &&
    stickFarX <
      platformTheStickHits.x + platformTheStickHits.w / 2 + perfectAreaSize / 2
  )
    return [platformTheStickHits, true];

  return [platformTheStickHits, false];
}

function draw() {
  ctx.save();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  drawBackground();

  // Center main canvas area to the middle of the screen
  ctx.translate(
    (window.innerWidth - canvasWidth) / 2 - sceneOffset,
    (window.innerHeight - canvasHeight) / 2
  );

  // Draw scene
  drawPlatforms();
  drawCollectibles();
  drawHero();
  drawSticks();

  // Restore transformation
  ctx.restore();
}

function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    // Draw platform with modern look
    const platformGradient = ctx.createLinearGradient(
      x,
      canvasHeight - platformHeight,
      x,
      canvasHeight
    );
    platformGradient.addColorStop(0, "#2a2a2a");
    platformGradient.addColorStop(1, "#1a1a1a");
    
    // Platform shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    
    ctx.fillStyle = platformGradient;
    ctx.fillRect(
      x,
      canvasHeight - platformHeight,
      w,
      platformHeight + (window.innerHeight - canvasHeight) / 2
    );
    
    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Draw perfect area with green light
    if (sticks.last().x < x) {
      ctx.fillStyle = "#00ff00";
      ctx.shadowColor = "#00ff00";
      ctx.shadowBlur = 10;
      ctx.fillRect(
        x + w / 2 - perfectAreaSize / 2,
        canvasHeight - platformHeight,
        perfectAreaSize,
        perfectAreaSize
      );
      
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }
  });
}

function drawHero() {
  ctx.save();
  ctx.translate(
    heroX - heroWidth / 2,
    heroY + canvasHeight - platformHeight - heroHeight / 2
  );

  // Draw the hero image
  if (heroImage.complete) {
    ctx.drawImage(
      heroImage,
      -heroWidth / 2,
      -heroHeight / 2,
      heroWidth,
      heroHeight
    );
  }

  ctx.restore();
}

function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x, y + radius);
  ctx.lineTo(x, y + height - radius);
  ctx.arcTo(x, y + height, x + radius, y + height, radius);
  ctx.lineTo(x + width - radius, y + height);
  ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
  ctx.lineTo(x + width, y + radius);
  ctx.arcTo(x + width, y, x + width - radius, y, radius);
  ctx.lineTo(x + radius, y);
  ctx.arcTo(x, y, x, y + radius, radius);
  ctx.fill();
}

function drawSticks() {
  sticks.forEach((stick) => {
    ctx.save();

    // Move the anchor point to the start of the stick and rotate
    ctx.translate(stick.x, canvasHeight - platformHeight);
    ctx.rotate((Math.PI / 180) * stick.rotation);

    // Draw stick with glowing effect
    ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
    ctx.shadowBlur = 5;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stick.length);
    ctx.stroke();

    ctx.restore();
  });
}

function drawBackground() {
  // Draw dark background
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  // Add subtle grid pattern
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  const gridSize = 30;
  
  for(let i = 0; i < window.innerWidth; i += gridSize) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, window.innerHeight);
    ctx.stroke();
  }
  
  for(let i = 0; i < window.innerHeight; i += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(window.innerWidth, i);
    ctx.stroke();
  }

  // Draw hills
  drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#95C629");
  drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#659F1C");

  // Draw trees
  trees.forEach((tree) => drawTree(tree.x, tree.color));

  // Draw hell fire effect with multiple layers
  const time = new Date().getTime() * 0.001;
  const baseFireHeight = 200;

  // Background fire layer (darker, slower)
  drawFireLayer(baseFireHeight, time, {
    color1: "rgba(255, 30, 0, 0.9)",
    color2: "rgba(255, 70, 0, 0.9)",
    color3: "rgba(255, 90, 0, 0.95)",
    color4: "rgba(200, 0, 0, 1)",
    speed: 2,
    frequency: 0.03,
    amplitude: 25,
    step: 20
  });

  // Middle fire layer (brighter, medium speed)
  drawFireLayer(baseFireHeight * 0.8, time, {
    color1: "rgba(255, 100, 0, 0.9)",
    color2: "rgba(255, 150, 0, 0.9)",
    color3: "rgba(255, 170, 0, 0.95)",
    color4: "rgba(255, 50, 0, 1)",
    speed: 3,
    frequency: 0.05,
    amplitude: 20,
    step: 15
  });

  // Front fire layer (brightest, fastest)
  drawFireLayer(baseFireHeight * 0.6, time, {
    color1: "rgba(255, 200, 0, 0.9)",
    color2: "rgba(255, 220, 0, 0.9)",
    color3: "rgba(255, 240, 0, 0.95)",
    color4: "rgba(255, 100, 0, 1)",
    speed: 4,
    frequency: 0.07,
    amplitude: 15,
    step: 10
  });

  // Ember effect
  drawEmbers(time, baseFireHeight);

  // Hide YouTube elements
  const youtubeLink = document.getElementById("youtube");
  const youtubeCard = document.getElementById("youtube-card");
  if (youtubeLink) youtubeLink.style.display = "none";
  if (youtubeCard) youtubeCard.style.display = "none";
}

// Helper function to draw a single fire layer
function drawFireLayer(height, time, config) {
  const fireGradient = ctx.createLinearGradient(
    0,
    window.innerHeight - height,
    0,
    window.innerHeight
  );
  
  const flickerAmount = Math.sin(time * 5) * 0.1 + 0.9;
  
  fireGradient.addColorStop(0, config.color1);
  fireGradient.addColorStop(0.3, config.color2);
  fireGradient.addColorStop(0.8, config.color3);
  fireGradient.addColorStop(1, config.color4);
  
  ctx.fillStyle = fireGradient;
  
  ctx.beginPath();
  ctx.moveTo(0, window.innerHeight);
  
  for(let x = 0; x <= window.innerWidth; x += config.step) {
    const waveHeight = Math.sin(x * config.frequency + time * config.speed) * config.amplitude * flickerAmount;
    const secondaryWave = Math.cos((x * config.frequency + time * (config.speed * 0.8)) * 1.5) * (config.amplitude * 0.5);
    const finalHeight = waveHeight + secondaryWave;
    
    ctx.lineTo(x, window.innerHeight - height + finalHeight);
  }
  
  ctx.lineTo(window.innerWidth, window.innerHeight);
  ctx.closePath();
  ctx.fill();

  // Add glow effect
  ctx.shadowColor = config.color3;
  ctx.shadowBlur = 30;
  ctx.fill();
  ctx.shadowBlur = 0;
}

// Helper function to draw floating embers
function drawEmbers(time, baseHeight) {
  const numEmbers = 50;
  ctx.fillStyle = "rgba(255, 200, 0, 0.8)";
  
  for(let i = 0; i < numEmbers; i++) {
    const seed = i * 487.31; // Use a prime number for pseudo-random distribution
    const x = (Math.sin(seed) * 0.5 + 0.5) * window.innerWidth;
    const yOffset = ((Math.cos(seed * 0.37) * 0.5 + 0.5) * baseHeight);
    const y = window.innerHeight - yOffset - Math.abs(Math.sin(time * 2 + seed) * 50);
    
    const emberSize = Math.sin(time * 3 + seed) * 1 + 2;
    
    ctx.beginPath();
    ctx.arc(x, y, emberSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Add glow to embers
    ctx.shadowColor = "rgba(255, 150, 0, 0.5)";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// A hill is a shape under a stretched out sinus wave
function drawHill(baseHeight, amplitude, stretch, color) {
  ctx.beginPath();
  ctx.moveTo(0, window.innerHeight);
  ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));
  for (let i = 0; i < window.innerWidth; i++) {
    ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));
  }
  ctx.lineTo(window.innerWidth, window.innerHeight);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawTree(x, color) {
  ctx.save();
  ctx.translate(
    (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch,
    getTreeY(x, hill1BaseHeight, hill1Amplitude)
  );

  const treeTrunkHeight = 5;
  const treeTrunkWidth = 2;
  const treeCrownHeight = 25;
  const treeCrownWidth = 10;

  // Draw trunk
  ctx.fillStyle = "#7D833C";
  ctx.fillRect(
    -treeTrunkWidth / 2,
    -treeTrunkHeight,
    treeTrunkWidth,
    treeTrunkHeight
  );

  // Draw crown
  ctx.beginPath();
  ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);
  ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
  ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.restore();
}

function getHillY(windowX, baseHeight, amplitude, stretch) {
  const sineBaseY = window.innerHeight - baseHeight;
  return (
    Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) *
      amplitude +
    sineBaseY
  );
}

function getTreeY(x, baseHeight, amplitude) {
  const sineBaseY = window.innerHeight - baseHeight;
  return Math.sinus(x) * amplitude + sineBaseY;
}

// Generate collectible items
function generateCollectible() {
  const lastPlatform = platforms[platforms.length - 1];
  const x = lastPlatform.x + lastPlatform.w / 2;
  const y = canvasHeight - platformHeight - collectibleSize - 50; // Float above platform
  
  collectibles.push({
    x,
    y,
    collected: false
  });
}

// Update score function to maintain the new structure
function updateScore(newScore) {
  score = newScore;
  
  // Create score container if it doesn't exist
  const scoreElement = document.getElementById('score');
  if (!scoreElement.querySelector('div')) {
    scoreElement.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
      ">
        <span style="
          font-size: 14px;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 2px;
        ">SCORE</span>
        <span style="
          font-size: 28px;
          font-weight: bold;
        ">${score}</span>
      </div>
    `;
  } else {
    // Update only the score number
    const scoreSpan = scoreElement.querySelector('div span:last-child');
    if (scoreSpan) {
      scoreSpan.textContent = score;
    }
  }
  
  // Add animation effect
  scoreElement.style.transform = 'translateZ(0) scale(1.1)';
  scoreElement.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4), inset 0 2px rgba(255, 255, 255, 0.1)';
  
  setTimeout(() => {
    scoreElement.style.transform = 'translateZ(0) scale(1)';
    scoreElement.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3), inset 0 2px rgba(255, 255, 255, 0.1)';
  }, 200);
}

// Modify checkCollectibles to use difficulty multiplier
function checkCollectibles() {
  collectibles.forEach(collectible => {
    if (!collectible.collected) {
      const heroPositionX = heroX;
      const heroPositionY = heroY + canvasHeight - platformHeight - heroHeight/2;
      
      const collectibleCenterX = collectible.x;
      const collectibleCenterY = collectible.y + collectibleSize/2;
      
      const dx = heroPositionX - collectibleCenterX;
      const dy = heroPositionY - collectibleCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const collisionRadius = heroWidth/2 + collectibleSize/2;
      
      if (distance < collisionRadius) {
        collectible.collected = true;
        collectiblesGathered++;
        updateScore(score + Math.round(5 * currentDifficulty.scoreMultiplier));
        
        perfectElement.style.opacity = 1;
        setTimeout(() => (perfectElement.style.opacity = 0), 500);
      }
    }
  });
}

// Add drawCollectibles function
function drawCollectibles() {
  collectibles.forEach(collectible => {
    if (!collectible.collected && collectibleImage.complete) {
      ctx.save();
      
      // Add floating animation
      const floatOffset = Math.sin(Date.now() * 0.003) * 5;
      
      // Add glow effect
      ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
      ctx.shadowBlur = 15;
      
      ctx.drawImage(
        collectibleImage,
        collectible.x - collectibleSize / 2,
        collectible.y + floatOffset,
        collectibleSize,
        collectibleSize
      );
      
      ctx.restore();
    }
  });
}

// Add game over score panel
function showGameOverPanel() {
  // Remove existing panel if it exists
  const existingPanel = document.querySelector('div[style*="game-over"]');
  if (existingPanel) {
    existingPanel.remove();
  }

  // Set a flag to prevent multiple panels
  if (window.gameOverPanelShown) return;
  window.gameOverPanelShown = true;

  const gameOverPanel = document.createElement('div');
  gameOverPanel.id = 'gameOverPanel';
  gameOverPanel.style.position = 'fixed';
  gameOverPanel.style.top = '50%';
  gameOverPanel.style.left = '50%';
  gameOverPanel.style.transform = 'translate(-50%, -50%) scale(0.8)';
  gameOverPanel.style.background = 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 20, 0.9))';
  gameOverPanel.style.padding = '30px';
  gameOverPanel.style.borderRadius = '20px';
  gameOverPanel.style.boxShadow = '0 0 30px rgba(0, 0, 0, 0.5), inset 0 2px rgba(255, 255, 255, 0.1)';
  gameOverPanel.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  gameOverPanel.style.color = '#fff';
  gameOverPanel.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
  gameOverPanel.style.textAlign = 'center';
  gameOverPanel.style.minWidth = '300px';
  gameOverPanel.style.backdropFilter = 'blur(10px)';
  gameOverPanel.style.webkitBackdropFilter = 'blur(10px)';
  gameOverPanel.style.zIndex = '1000';
  gameOverPanel.style.opacity = '0';
  gameOverPanel.style.transition = 'all 0.5s ease-out';

  const scoreDetails = `
    <h2 style="
      font-size: 32px;
      margin: 0 0 20px 0;
      background: linear-gradient(45deg, #ff6b6b, #ffb347);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    ">GAME OVER</h2>
    <div style="
      font-size: 18px;
      margin-bottom: 15px;
      color: #ffb347;
    ">
      ${currentDifficulty.name} MODE
    </div>
    <div style="
      display: grid;
      gap: 15px;
      margin-bottom: 25px;
    ">
      <div style="
        display: flex;
        justify-content: space-between;
        padding: 10px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
      ">
        <span>Final Score</span>
        <span style="font-weight: bold; color: #ffb347">${score}</span>
      </div>
      <div style="
        display: flex;
        justify-content: space-between;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
      ">
        <span>Perfect Platforms</span>
        <span style="color: #00ff00">${perfectJumps} × ${Math.round(2 * currentDifficulty.scoreMultiplier)}pts</span>
      </div>
      <div style="
        display: flex;
        justify-content: space-between;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
      ">
        <span>Regular Platforms</span>
        <span style="color: #fff">${normalJumps} × ${Math.round(1 * currentDifficulty.scoreMultiplier)}pts</span>
      </div>
      <div style="
        display: flex;
        justify-content: space-between;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
      ">
        <span>Collectibles</span>
        <span style="color: #ff6b6b">${collectiblesGathered} × ${Math.round(5 * currentDifficulty.scoreMultiplier)}pts</span>
      </div>
    </div>
  `;

  gameOverPanel.innerHTML = scoreDetails;
  document.body.appendChild(gameOverPanel);

  // Animate panel entrance
  setTimeout(() => {
    gameOverPanel.style.opacity = '1';
    gameOverPanel.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 100);

  // Update restart button
  restartButton.style.position = 'fixed';
  restartButton.style.bottom = '20%';
  restartButton.style.left = '50%';
  restartButton.style.transform = 'translateX(-50%)';
  restartButton.style.padding = '15px 30px';
  restartButton.style.fontSize = '18px';
  restartButton.style.backgroundColor = '#ff6b6b';
  restartButton.style.color = '#fff';
  restartButton.style.border = 'none';
  restartButton.style.borderRadius = '10px';
  restartButton.style.cursor = 'pointer';
  restartButton.style.transition = 'all 0.3s ease';
  restartButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
  restartButton.style.zIndex = '1001';

  restartButton.onmouseover = () => {
    restartButton.style.backgroundColor = '#ff8787';
    restartButton.style.transform = 'translateX(-50%) scale(1.05)';
  };
  
  restartButton.onmouseout = () => {
    restartButton.style.backgroundColor = '#ff6b6b';
    restartButton.style.transform = 'translateX(-50%) scale(1)';
  };

  // Stop the animation loop
  window.isGameOver = true;
}

// Initialize difficulty selector when game starts
createDifficultySelector(); 