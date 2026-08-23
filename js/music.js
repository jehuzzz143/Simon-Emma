/* ==========================================================
   BACKGROUND MUSIC — persists play/pause + position across
   page navigations (index.html <-> photos.html) via
   sessionStorage, since each page load is a fresh document.

   The actual player (YouTube-backed or the local fallback file)
   is resolved by js/bg-music.js; this file only drives it.
========================================================== */
(function () {
  const musicButton = document.getElementById("musicButton");
  if (!musicButton || !window.bgMusicReady) return;

  // Attach the click handler immediately — window.bgMusicReady can take a
  // while to resolve (Supabase lookup + YouTube iframe API load), and a
  // tap before it resolves must not be silently dropped. The handler
  // awaits the player itself instead of the listener being gated behind it.
  musicButton.addEventListener("click", async () => {
    const bgMusic = await window.bgMusicReady;
    if (!bgMusic) return;
    if (bgMusic.paused) bgMusic.play();
    else bgMusic.pause();
  });

  setup();

  async function setup() {
  const STORAGE_KEY = "weddingMusicState";
  const bgMusic = await window.bgMusicReady;
  if (!bgMusic) return;

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

  // pause background music while the story video plays, resume once
  // it's paused/ended — but only if the music was actually playing.
  // both directions fade instead of cutting sharply.
  const storyVideo = document.querySelector(".story-video");
  if (storyVideo) {
    const FADE_MS = 600;
    let fadeTimer = null;

    function fadeVolume(target, onComplete) {
      clearInterval(fadeTimer);
      const start = bgMusic.volume;
      const startTime = performance.now();
      fadeTimer = setInterval(() => {
        const progress = Math.min((performance.now() - startTime) / FADE_MS, 1);
        bgMusic.volume = start + (target - start) * progress;
        if (progress >= 1) {
          clearInterval(fadeTimer);
          fadeTimer = null;
          if (onComplete) onComplete();
        }
      }, 40);
    }

    let resumeMusicAfterVideo = false;
    let musicVolumeBeforeFade = bgMusic.volume || 1;

    storyVideo.addEventListener("play", () => {
      if (!bgMusic.paused) {
        resumeMusicAfterVideo = true;
        musicVolumeBeforeFade = bgMusic.volume || 1;
        fadeVolume(0, () => bgMusic.pause());
      }
    });

    const resumeMusicIfNeeded = () => {
      if (resumeMusicAfterVideo) {
        resumeMusicAfterVideo = false;
        bgMusic.volume = 0;
        bgMusic.play()
          .then(() => fadeVolume(musicVolumeBeforeFade))
          .catch(() => {});
      }
    };
    storyVideo.addEventListener("pause", resumeMusicIfNeeded);
    storyVideo.addEventListener("ended", resumeMusicIfNeeded);
  }

  function applyInitialPosition() {
    const saved = readState();
    const fallbackStart = bgMusic.defaultStartTime ?? 0;
    const targetTime = (saved && Number.isFinite(saved.time)) ? saved.time : fallbackStart;
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
  }
})();
