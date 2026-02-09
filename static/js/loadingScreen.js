let loadingInterval = null; 

function showLoadingDots() {
    if (loadingInterval !== null) {
        return;
    }
    
    const loadingScreenDots = document.getElementById("loading-dots");
    loadingScreenDots.style.display = ""; // reverts back to value from css

    let count = 0;
    loadingInterval = setInterval(() => {
        count = (count + 1) % 4;   // "" -> "." -> ".." -> "..." -> repeat
        loadingScreenDots.textContent = ".".repeat(count);
    }, 200);
}

function hideLoadingDots() {
    if (loadingInterval === null) {
        return;
    }

    const loadingScreenDots = document.getElementById("loading-dots");
    loadingScreenDots.style.display = "none";

    clearInterval(loadingInterval);
    loadingInterval = null;
}


function setLoadingScreenMessage(message) {
    const loadingScreenText = document.getElementById("loading-text");
    loadingScreenText.textContent = message;
    
    showLoadingScreen();
}

function showLoadingScreen() {
    const loadingScreenDiv = document.getElementById("loading-screen");
    loadingScreenDiv.style.display = ""; // reverts back to value from css
}

function hideLoadingScreen() {
    const loadingScreenDiv = document.getElementById("loading-screen");
    loadingScreenDiv.style.display = "none";
}