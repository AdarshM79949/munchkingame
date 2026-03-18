// ============================================================
//  FLAPPY BIRD – Sprite-based HTML5 Canvas Game
// ============================================================

(function () {
  "use strict";

  // ---- Canvas & Elements ----
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = "https://i.ibb.co/Q9yv5Jk/flappy-bird-set.png";

  // ---- Game Settings (SLOW & GENTLE) ----
  let gamePlaying = false;
  const gravity = 0.18;
  const speed = 2.0;
  const size = [51, 36];
  const jump = -5.7;
  const cTenth = (canvas.width / 10);

  let index = 0,
      bestScore = 0,
      flight,
      flyHeight,
      currentScore,
      pipes;

  // ---- Pipe Settings ----
  const pipeWidth = 78;
  const pipeGap = 270;
  const pipeLoc = () =>
    (Math.random() * ((canvas.height - (pipeGap + pipeWidth)) - pipeWidth)) + pipeWidth;

  // ---- Audio (Web Audio API Synthesis) ----
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function playTone(freq, dur, type, vol) {
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol || 0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  function sfxFlap() {
    const snd = new Audio("1476555638950854686.ogg");
    snd.volume = 0.5;
    snd.play().catch(() => {});
  }
  function sfxScore() { playTone(880, 0.12, "sine", 0.13); setTimeout(() => playTone(1200, 0.15, "sine", 0.11), 80); }
  function sfxHit()   { playTone(200, 0.25, "sawtooth", 0.15); }

  // ---- Load Best Score ----
  bestScore = parseInt(localStorage.getItem("flappy_hi") || "0", 10);

  // ---- Setup ----
  const setup = () => {
    currentScore = 0;
    flight = jump;
    flyHeight = (canvas.height / 2) - (size[1] / 2);
    pipes = Array(3).fill().map((a, i) => [canvas.width + (i * (pipeGap + pipeWidth)), pipeLoc()]);
  };

  // ---- Main Render Loop ----
  const render = () => {
    index++;

    // Background (scrolling parallax from sprite sheet)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height,
      -((index * (speed / 2)) % canvas.width) + canvas.width, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height,
      -(index * (speed / 2)) % canvas.width, 0, canvas.width, canvas.height);

    // Pipes
    if (gamePlaying) {
      pipes.map(pipe => {
        pipe[0] -= speed;

        // Top pipe
        ctx.drawImage(img, 432, 588 - pipe[1], pipeWidth, pipe[1],
          pipe[0], 0, pipeWidth, pipe[1]);
        // Bottom pipe
        ctx.drawImage(img, 432 + pipeWidth, 108, pipeWidth, canvas.height - pipe[1] + pipeGap,
          pipe[0], pipe[1] + pipeGap, pipeWidth, canvas.height - pipe[1] + pipeGap);

        // Score when pipe passes bird
        if (pipe[0] <= -pipeWidth) {
          currentScore++;
          bestScore = Math.max(bestScore, currentScore);
          localStorage.setItem("flappy_hi", String(bestScore));
          pipes = [...pipes.slice(1), [pipes[pipes.length - 1][0] + pipeGap + pipeWidth, pipeLoc()]];
          sfxScore();
        }

        // Collision detection
        if ([
          pipe[0] <= cTenth + size[0],
          pipe[0] + pipeWidth >= cTenth,
          pipe[1] > flyHeight || pipe[1] + pipeGap < flyHeight + size[1]
        ].every(elem => elem)) {
          gamePlaying = false;
          sfxHit();
          setup();
        }
      });
    }

    // Bird
    if (gamePlaying) {
      ctx.drawImage(img, 432, Math.floor((index % 9) / 3) * size[1],
        ...size, cTenth, flyHeight, ...size);
      flight += gravity;
      flyHeight = Math.min(flyHeight + flight, canvas.height - size[1]);
    } else {
      ctx.drawImage(img, 432, Math.floor((index % 9) / 3) * size[1],
        ...size, ((canvas.width / 2) - size[0] / 2), flyHeight, ...size);
      flyHeight = (canvas.height / 2) - (size[1] / 2);

      // Menu text
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#553300";
      ctx.lineWidth = 3;
      ctx.font = "bold 24px 'Press Start 2P'";
      ctx.textAlign = "center";

      ctx.strokeText("Flappy Bird", canvas.width / 2, 200);
      ctx.fillText("Flappy Bird", canvas.width / 2, 200);

      ctx.font = "12px 'Press Start 2P'";
      ctx.strokeText(`Best : ${bestScore}`, canvas.width / 2, 260);
      ctx.fillText(`Best : ${bestScore}`, canvas.width / 2, 260);

      ctx.font = "11px 'Press Start 2P'";
      const alpha = 0.5 + Math.sin(Date.now() / 300) * 0.5;
      ctx.globalAlpha = alpha;
      ctx.strokeText("Click to play", canvas.width / 2, 550);
      ctx.fillText("Click to play", canvas.width / 2, 550);
      ctx.globalAlpha = 1;
    }

    // Update score display in header
    document.getElementById("bestScore").textContent = `Best : ${bestScore}`;
    document.getElementById("currentScore").textContent = `Score : ${currentScore}`;

    window.requestAnimationFrame(render);
  };

  // ---- Input ----
  document.addEventListener("click", () => {
    ensureAudio();
    if (!gamePlaying) {
      gamePlaying = true;
      sfxFlap();
    }
  });

  window.onclick = () => {
    if (gamePlaying) sfxFlap();
    flight = jump;
  };

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      ensureAudio();
      if (!gamePlaying) gamePlaying = true;
      flight = jump;
      sfxFlap();
    }
  });

  // ---- Init ----
  setup();
  img.onload = render;

  // ---- Loading Screen & Navbar ----
  const loadingScreen = document.getElementById("loading-screen");
  const loadingBar = document.getElementById("loading-bar");
  const navbar = document.getElementById("navbar");
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  let loadProgress = 0;
  function animateLoading() {
    loadProgress += 2 + Math.random() * 4;
    if (loadProgress >= 100) {
      loadProgress = 100;
      loadingBar.style.width = "100%";
      setTimeout(() => {
        loadingScreen.classList.add("fade-out");
        navbar.classList.add("visible");
        setTimeout(() => { loadingScreen.style.display = "none"; }, 600);
      }, 300);
      return;
    }
    loadingBar.style.width = loadProgress + "%";
    requestAnimationFrame(animateLoading);
  }
  animateLoading();

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

})();
