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

  // Resolve in the background (not inside the click handler) so that by
  // the time the user actually clicks, the handler can call .play()/
  // .pause() synchronously within that same gesture instead of awaiting
  // — see the comment in bg-music.js's YouTubeAudio.play() for why an
  // inline await here can silently break autoplay permission for the
  // cross-origin YouTube iframe.
  let bgMusic = null;
  window.bgMusicReady.then((p) => { bgMusic = p; });

  musicButton.addEventListener("click", () => {
    if (bgMusic) {
      if (bgMusic.paused) bgMusic.play();
      else bgMusic.pause();
      return;
    }
    // still resolving (a very early tap) — best effort; gesture
    // association may not survive the await, but the click at least
    // isn't silently dropped once the player becomes available.
    window.bgMusicReady.then((p) => { if (p && p.paused) p.play(); });
  });

  setup();

  async function setup() {
  const STORAGE_KEY = "weddingMusicState";
  bgMusic = bgMusic || await window.bgMusicReady;
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
