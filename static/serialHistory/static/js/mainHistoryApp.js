class HistoryApp {
    constructor() {
        this.tracebilityRootUrl = "";

        this.submitButton = document.getElementById("submit-button");
        this.userInput = document.getElementById("user-input");
        this.loader = document.getElementById("loader");
        
        this.tableContainer = document.getElementById("history-table");
        this.tableHeaderContainer = document.getElementById("table-header");
        this.tableBodyContainer = document.getElementById("table-body");

        this.wrapperInstancesList = [];
        this.currentlySelectedWrapper = null;
        this.historyTable = null;

        this.#initEventListeners();
    }

    
    resetTableState() {
        this.wrapperInstancesList = [];
        this.currentlySelectedWrapper = null;
        this.tableHeaderContainer.innerHTML = "";
        this.tableBodyContainer.innerHTML = "";

        this.historyTable = new HistoryTable(this.tableContainer, this.tableHeaderContainer, this.tableBodyContainer);
        const historyTableHeader = new HistoryTableHeader(this.historyTable.applySortOnClickCallback);
        this.historyTable.addHeader(historyTableHeader);
    }

    setFilteredJsons(filteredJsons) {
        this.wrapperInstancesList = filteredJsons.map(itemJson => {
            return new HistoryRecordWrapper(
                itemJson, 
                () => this._untoggleAllRows(), 
                (wrapper) => this._storeExpandedRowInstance(wrapper)
            );
        });

        this.loader.classList.add("hidden");
        if (this.wrapperInstancesList.length > 0) {
            this.historyTable.addRows(this.wrapperInstancesList);
        }
    }


    #initEventListeners() {
        this.userInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault(); 
                
                this.submitButton.click(); 
            }
        });

        this.submitButton.addEventListener("click", () => this.#handleSearch());
    }

    async #handleSearch() {
        const serialNumber = this.userInput.value.trim();
        if (!serialNumber) {
            const lang = document.documentElement.lang;
            const alertMessage = translationsDict[lang]?.["js-no-serial-number-alert"] || "Pole nie może być puste!";

            alert(alertMessage);
            return;
        }

        this.resetTableState();
        this.loader.classList.remove("hidden");

        const filteredJsons = await HistoryRequestWrapper.getBoardHistory(this.tracebilityRootUrl, serialNumber);
        this.setFilteredJsons(filteredJsons);
    }

    _untoggleAllRows() {
        this.wrapperInstancesList.forEach(wrapperInstance => {
            wrapperInstance.collapse();
        });
        this.currentlySelectedWrapper = null;
    }

    _storeExpandedRowInstance(wrapperInstance) {
        this.currentlySelectedWrapper = wrapperInstance;
    }


    getMeasurementsJson() {
        if (!this.currentlySelectedWrapper) {
            return {};
        }

        return this.currentlySelectedWrapper.getMeasurements();
    }

    static async loadTranslations(){
        const response = await fetch("../../../../config/lang.json");
        return await response.json();
    }
}