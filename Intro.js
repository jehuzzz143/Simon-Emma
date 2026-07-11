

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

const particles = document.getElementById("particles");
const leaves = document.getElementById("leaves");

/* -----------------------------
   Golden Dust
------------------------------ */

for(let i=0;i<40;i++){

    const dot=document.createElement("span");

    dot.className="particle";

    dot.style.left=Math.random()*100+"vw";

    dot.style.top=Math.random()*100+"vh";

    dot.style.animationDuration=
        (6+Math.random()*6)+"s";

    dot.style.animationDelay=
        Math.random()*6+"s";

    particles.appendChild(dot);

}

/* -----------------------------
   Falling Leaves
------------------------------ */

function createLeaf(){

    const leaf=document.createElement("img");

    leaf.src="src/leaf.svg";

    leaf.className="leaf";

    leaf.style.left=Math.random()*100+"vw";

    leaf.style.animationDuration=
        (10+Math.random()*8)+"s";

    leaf.style.transform=
        `scale(${0.5+Math.random()})`;

    leaves.appendChild(leaf);

    setTimeout(()=>{

        leaf.remove();

    },18000);

}

setInterval(createLeaf,1200);
/* ==========================================================
   PART 4
   OPEN ENVELOPE
========================================================== */

const envelope =
document.getElementById("envelope");

const seal =
document.getElementById("seal");

seal.addEventListener("click",()=>{

    envelope.classList.add("open");
    

});
let opened=false;

seal.addEventListener("click",()=>{

    if(opened) return;

    opened=true;
    startMusic();
    envelope.classList.add("open");

});
/* ==========================================================
   PART 5
   OPEN WEBSITE
========================================================== */

const bgMusic = document.getElementById("bgMusic");

const intro = document.getElementById("intro");

const website = document.getElementById("website");

const openButton = document.getElementById("openInvitation");

let musicStarted = false;

function startMusic(){

    if(musicStarted) return;

    bgMusic.play()
        .then(()=>{

            musicStarted = true;

        })
        .catch(err=>{

            console.log("Autoplay blocked.", err);

        });

}
openButton.addEventListener("click",()=>{

    intro.classList.add("hide");

    website.classList.add("show");

    document.body.style.overflow="auto";

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