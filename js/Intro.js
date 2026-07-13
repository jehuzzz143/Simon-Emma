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
  //const isMobile = window.matchMedia("(max-width: 768px)").matches;
  //const isMobile = window.innerWidth <= 768;
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
    document.body.style.overflow = "auto";

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

const bgMusic = document.getElementById("bgMusic");

const intro = document.getElementById("intro");

const website = document.getElementById("website");

const openButton = document.getElementById("openInvitation");
const seatFinder = document.getElementById("table-finder");

let musicStarted = false;
const targetSection = window.location.hash;

function startMusic() {
  if (musicStarted) return;

  bgMusic
    .play()
    .then(() => {
      musicStarted = true;
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

  document.body.style.overflow = "auto";

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

  document.body.style.overflow = "auto";
});

const musicButton = document.getElementById("musicButton");

musicButton.addEventListener("click", () => {
  console.log("Music button clicked");

  if (bgMusic.paused) {
    bgMusic.play();
    console.log("Playing");
  } else {
    bgMusic.pause();
    console.log("Paused");
  }
});


