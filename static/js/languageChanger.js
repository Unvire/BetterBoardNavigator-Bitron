class LanguageChanger{
    constructor(picker, button, menu, badge, labelDisplay, updateUiCallback){
        this.picker = picker;
        this.button = button;
        this.menu = menu;
        this.badge = badge;
        this.labelDisplay = labelDisplay;
        this.updateUiCallback = updateUiCallback;

        this.#bindChangeLanguageLogic();
        this.#loadStoredLanguage();
    }

    #bindChangeLanguageLogic(){
        this.picker.querySelectorAll("li").forEach(item => {
            item.addEventListener("click", () => {
                const lang = item.getAttribute("data-value");
                
                this.badge.innerText = item.getAttribute("data-icon");
                this.labelDisplay.innerText = item.getAttribute("data-label");
                
                this.picker.querySelectorAll("li").forEach(li => li.classList.remove("active"));
                item.classList.add("active");
                
                this.menu.classList.remove("show");
                
                localStorage.setItem("user-lang", lang);
                this.updateUiCallback(lang);
            });
        });
    }

    #loadStoredLanguage(){
        const savedLanguage = localStorage.getItem("user-lang") || "pl";
        const target = Array.from(this.picker.querySelectorAll("li"))
            .find(li => li.getAttribute("data-value") === savedLanguage) || this.picker.querySelector("li");
        
        target.click();
    }
}