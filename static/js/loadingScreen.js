class LoadingScreen{
    static showLoadingDots() {
        if (loadingScreenInterval !== null) {
            return;
        }
        const loadingScreenDots = globalInstancesMap.loadingScreenDots
        loadingScreenDots.style.display = ""; // reverts back to value from css

        let count = 0;
        loadingScreenInterval = setInterval(() => {
            count = (count + 1) % 4;   // "" -> "." -> ".." -> "..." -> repeat
            loadingScreenDots.textContent = ".".repeat(count);
        }, 200);
    }

    static hideLoadingDots() {
        if (loadingScreenInterval === null) {
            return;
        }

        globalInstancesMap.loadingScreenDots.style.display = "none";

        clearInterval(loadingScreenInterval);
        loadingScreenInterval = null;
    }


    static setLoadingScreenMessage(message) {
        globalInstancesMap.loadingScreenText.textContent = message;

        LoadingScreen.showLoadingScreen();
    }

    static showLoadingScreen() {
        globalInstancesMap.loadingScreenContainer.style.display = ""; // reverts back to value from css
    }

    static hideLoadingScreen() {
        globalInstancesMap.loadingScreenContainer.style.display = "none";
    }
}