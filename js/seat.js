const API_URL = "https://script.google.com/macros/s/AKfycbxcz3ApREZwbSCDbwi32Z9mtFFnnk5SA4AMzqd7Iab_olsa6GIRTPxwjJ8m8tT1uWvm/exec";

const search = document.getElementById("search");
const suggestions = document.getElementById("suggestions");
const result = document.getElementById("result");
const loading = document.getElementById("loading");

let guests = [];

async function loadGuests() {

     // Loading state
    search.disabled = true;
    search.placeholder = "Downloading guest list...";

    try{

        const response = await fetch(API_URL);

        guests = await response.json();
        guests.sort((a,b)=>

            a.name.localeCompare(b.name)
        
        );
        loading.style.display = "none";
        search.disabled = false;
        search.placeholder = "Search your name...";
        
    }

    catch(error){

        console.error(error);

        search.disabled = true;
        search.placeholder = "Unable to load guest list";
        loading.textContent = "Unable to load guest list. Please try again, Refresh.";

    }

}



search.addEventListener("input", function(){

    const keyword = this.value
    .trim()
    .replace(/\s+/g," ")
    .toLowerCase();

    suggestions.innerHTML = "";

    if(keyword === ""){

        suggestions.style.display = "none";

        result.innerHTML = "";

        return;

    }

    const filtered = guests.filter(guest =>

        guest.name.toLowerCase().includes(keyword)

    );

    if(filtered.length === 0){

        suggestions.innerHTML = `
            <div class="suggestion">
                No guest found.
            </div>
        `;
    
        suggestions.style.display = "block";
    
        return;
    
    }

    filtered.forEach(guest=>{

        const item = document.createElement("div");

        item.className = "suggestion";

        item.textContent = guest.name;

        item.onclick = ()=>{

            search.value = guest.name;

            suggestions.style.display = "none";

            result.innerHTML = `
            <div class="result-card">

                <div class="guest">
                    Hello ${guest.name}
                </div>

                <p>Your table assignment is</p>

                <div class="table">
                    TABLE ${guest.table}
                </div>

            </div>
            `;

        };

        suggestions.appendChild(item);

    });

    suggestions.style.display = "block";

});

loadGuests();

document.addEventListener("click", function(e){

    if(!e.target.closest(".search-box")){

        suggestions.style.display = "none";

    }

});

search.addEventListener("focus", function(){

    if(this.value !== ""){

        this.dispatchEvent(new Event("input"));

    }

});