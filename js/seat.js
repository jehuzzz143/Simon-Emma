const API_URL = "https://script.google.com/macros/s/AKfycbxcz3ApREZwbSCDbwi32Z9mtFFnnk5SA4AMzqd7Iab_olsa6GIRTPxwjJ8m8tT1uWvm/exec";


let guests = [];

async function loadGuests() {

    try{

        const response = await fetch(API_URL);

        guests = await response.json();
        guests.sort((a,b)=>

            a.name.localeCompare(b.name)
        
        );
        loading.style.display = "none";

    }

    catch(error){

        console.error(error);

loading.innerHTML = "Unable to load guest list.";

    }

}

const search = document.getElementById("search");
const suggestions = document.getElementById("suggestions");
const result = document.getElementById("result");
const loading = document.getElementById("loading");

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

                <p>Your table assignment</p>

                <div class="table">
                    TABLE ${guest.table}
                </div>

                <div class="message">
                    We look forward to celebrating our special day with you.
                    <br>
                    <br> - Simon & Emma -
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