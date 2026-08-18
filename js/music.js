/* ==========================================================
   BACKGROUND MUSIC — persists play/pause + position across
   page navigations (index.html <-> photos.html) via
   sessionStorage, since each page load is a fresh document.
========================================================== */
(function () {
  const STORAGE_KEY = "weddingMusicState";
  const DEFAULT_START_TIME = 35;

  const bgMusic = document.getElementById("bgMusic");
  const musicButton = document.getElementById("musicButton");
  if (!bgMusic || !musicButton) return;

  function readState() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    } catch (err) {
      return null;
    }
  }

  function saveState() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        playing: !bgMusic.paused,
        time: bgMusic.currentTime,
      }));
    } catch (err) {
      /* sessionStorage unavailable (private mode, etc.) — ignore */
    }
  }

  // exposed so Intro.js's envelope-open flow can coordinate with this
  window.weddingMusic = { bgMusic, musicButton, readState, saveState };

  musicButton.addEventListener("click", () => {
    if (bgMusic.paused) bgMusic.play();
    else bgMusic.pause();
  });

  bgMusic.addEventListener("play", () => {
    musicButton.classList.add("playing");
    musicButton.setAttribute("aria-label", "Pause music");
    musicButton.setAttribute("aria-pressed", "true");
    saveState();
  });

  bgMusic.addEventListener("pause", () => {
    musicButton.classList.remove("playing");
    musicButton.setAttribute("aria-label", "Play music");
    musicButton.setAttribute("aria-pressed", "false");
    saveState();
  });

  // throttled position sync so we can resume close to where we left off
  let lastSaved = 0;
  bgMusic.addEventListener("timeupdate", () => {
    if (bgMusic.currentTime - lastSaved >= 1) {
      lastSaved = bgMusic.currentTime;
      saveState();
    }
  });

  window.addEventListener("pagehide", saveState);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveState();
  });

  function applyInitialPosition() {
    const saved = readState();
    const targetTime = (saved && Number.isFinite(saved.time)) ? saved.time : DEFAULT_START_TIME;
    // guard against a saved position past the track's actual length
    bgMusic.currentTime = (bgMusic.duration && targetTime >= bgMusic.duration) ? 0 : targetTime;

    if (saved && saved.playing) {
      bgMusic.play().catch(() => {
        /* autoplay blocked without a fresh gesture on this page —
           the button stays paused and the user can tap it once to
           resume from the saved position */
      });
    }
  }

  // setting .currentTime before metadata has loaded is unreliable —
  // browsers can silently ignore it and reset to 0 once it does load
  if (bgMusic.readyState >= 1) {
    applyInitialPosition();
  } else {
    bgMusic.addEventListener("loadedmetadata", applyInitialPosition, { once: true });
  }
})();
