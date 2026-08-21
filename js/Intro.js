/*
==========================================================

PART 1

No JavaScript yet.

==========================================================
*/
/* ==========================================================
   PART 3
   BACKGROUND EFFECTS
========================================================== */
var isInvitationClicked = false;
const particles = document.getElementById("particles");
const leaves = document.getElementById("leaves");

/* -----------------------------
   Golden Dust
------------------------------ */
const particleCount = window.innerWidth <= 768 ? 15 : 40;

for (let i = 0; i < particleCount; i++) {
  const dot = document.createElement("span");

  dot.className = "particle";
  dot.style.top = Math.random() * 100 + "vh";
  dot.style.left = Math.random() * 100 + "vw";

  dot.style.animationDuration = 6 + Math.random() * 6 + "s";

  dot.style.animationDelay = Math.random() * 6 + "s";

  particles.appendChild(dot);
}

/* -----------------------------
   Falling Leaves
------------------------------ */
const isMobile = window.matchMedia("(max-width: 768px)").matches;
function createLeaf() {
  const leaf = document.createElement("img");
  leaf.src = "src/leaf.svg";

  leaf.className = "leaf";

  leaf.style.left = Math.random() * 100 + "vw";

  leaf.style.animationDuration = isMobile
    ? 18 + Math.random() * 8 + "s"
    : 10 + Math.random() * 8 + "s";

  const scale = isMobile
    ? 0.25 + Math.random() * 0.3
    : 0.45 + Math.random() * 0.5;

  leaf.style.transform = `scale(${scale})`;

  leaves.appendChild(leaf);

  const duration = parseFloat(leaf.style.animationDuration) * 1000;

  setTimeout(() => {
    leaf.remove();
  }, duration + 500);
}

for (let i = 0; i < (isMobile ? 2 : 5); i++) {
  createLeaf();
}

const leafInterval = setInterval(createLeaf, isMobile ? 2500 : 1200);
/* ==========================================================
   PART 4
   OPEN ENVELOPE
========================================================== */

const envelope = document.getElementById("envelope");

const seal = document.getElementById("seal");

let opened = false;

seal.addEventListener("click", () => {
  if (opened) return;

  opened = true;
  startMusic();
  envelope.classList.add("open");

  // Wait 10 seconds, then open the invitation and scroll smoothly
  setTimeout(() => {
    clearInterval(leafInterval);
    intro.classList.add("hide");
    website.classList.add("show");
    document.body.style.overflowY = "auto";

    // Tiny delay guarantees the browser renders the website before animating the scroll
    setTimeout(() => {
      const heroElement = document.getElementById("hero");
      if (heroElement && isInvitationClicked == false) {
        heroElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 50); // 50 milliseconds is invisible to the user but fixes rendering bugs
  }, 10000);
});
/* ==========================================================
   PART 5
   OPEN WEBSITE
========================================================== */

let bgMusic = null;
// resolve in the background as soon as possible (page load, not on
// click) so that by the time the user actually clicks the seal,
// startMusic() below can call .play() synchronously within that same
// gesture instead of awaiting — see the comment in bg-music.js's
// YouTubeAudio.play() for why that matters for autoplay permission.
if (window.bgMusicReady) window.bgMusicReady.then((p) => { bgMusic = p; });

const intro = document.getElementById("intro");

const website = document.getElementById("website");

const openButton = document.getElementById("openInvitation");
const seatFinder = document.getElementById("table-finder");

let musicStarted = false;
const targetSection = window.location.hash;

async function startMusic() {
  if (musicStarted) return;

  if (!bgMusic) {
    bgMusic = window.bgMusicReady ? await window.bgMusicReady : null;
    if (!bgMusic) return;
  }

  // music.js may have already resumed playback (e.g. the visitor came
  // back from photos.html with music still going) — don't reset it
  if (!bgMusic.paused) {
    musicStarted = true;
    return;
  }

  bgMusic.volume = 0;

  bgMusic
    .play()
    .then(() => {
      musicStarted = true;

      let volume = 0;

      const fadeIn = setInterval(() => {
        volume += 0.02;
        bgMusic.volume = Math.min(Math.max(volume, .3), 1);

        if (volume >= 1) {
          clearInterval(fadeIn);
        }
      }, 200);
    })
    .catch((err) => {
      console.log("Autoplay blocked.", err);
    });
}

function skipIntro() {

  opened = true;

  clearInterval(leafInterval);

  intro.classList.add("hide");

  website.classList.add("show");

  document.body.style.overflowY = "auto";

  const target = document.querySelector(targetSection);

  if (target) {

    setTimeout(() => {

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }, 300);

  }

}

// Skip intro when opening a direct section link
if (targetSection) {

  window.addEventListener("load", () => {

    skipIntro();

  });

}else{
  seatFinder.style.display = "none";
}

openButton.addEventListener("click", () => {
  this.isInvitationClicked = true;
  clearInterval(leafInterval);
  intro.classList.add("hide");

  website.classList.add("show");

  document.body.style.overflowY = "auto";
});

// musicButton play/pause wiring + cross-page state persistence
// now lives in js/music.js (loaded before this script)


