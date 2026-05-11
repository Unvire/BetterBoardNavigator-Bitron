class PartNumberSearcherApp {
    constructor() {
        this.userInput = document.getElementById("search-input");
        this.clearButton = document.getElementById("clear-button");

        this.tableContainer = document.getElementById("part-number-table");
        this.tableHeaderContainer = document.getElementById("table-header");
        this.tableBodyContainer = document.getElementById("table-body");

        this.allItems = [];
        this.filteredItems = [];
        this.#initEventListeners();
    }

    setPartNumberDict(rawPnDict) {
        this.allItems = this.#processRawPnDict(rawPnDict);
        this.filteredItems = [...this.allItems];
    }

    renderBody() {
        this.tableBodyContainer.innerHTML = "";

        this.filteredItems.forEach(partNumberItem => {
            const row = document.createElement("div");
            row.className = "flex-table-row";

            const columns = [
                { className: "cell-name", text: partNumberItem.name },
                { className: "cell-part-number", text: partNumberItem.code },
                { className: "cell-description", text: partNumberItem.description }
            ];

            columns.forEach(col => {
                const cell = document.createElement("div");
                cell.className = `table-cell ${col.className}`;
                
                const innerDiv = document.createElement("div");
                innerDiv.textContent = col.text;
                
                cell.appendChild(innerDiv);
                row.appendChild(cell);
            });

            this.tableBodyContainer.appendChild(row);
        });
    }

    #initEventListeners() {
        this.clearButton.addEventListener("click", () => {
            this.userInput.value = "";
            this.filteredItems = [...this.allItems];
            this.renderBody();
        });

        this.userInput.addEventListener("input", () => {
            const valueToSearch = this.userInput.value.trim().toLowerCase();

            if (!valueToSearch) {
                this.filteredItems = [...this.allItems];
            } else {
                this.filteredItems = this.allItems.filter(partNumberItem =>
                    partNumberItem.name.toLowerCase().includes(valueToSearch) ||
                    partNumberItem.code.toLowerCase().includes(valueToSearch) ||
                    partNumberItem.description.toLowerCase().includes(valueToSearch)
                );
            }

            this.renderBody();
        });
    }

    #processRawPnDict(rawPnDict) {
        const items = Object.entries(rawPnDict).map(([name, attrs]) => ({
            name,
            code: String(attrs.partNumber || ""),
            description: String(attrs.description || "")
        }));

        items.sort((a, b) => this.#weightFunction(a) - this.#weightFunction(b));
        return items;
    }

    #weightFunction(item) {
        const name = (item.name || "").toUpperCase();
        
        if (!/^[A-Z]+[0-9]+/.test(name)) return Number.POSITIVE_INFINITY;

        let i = 0;
        let letterWeight = 1e6;
        let resultWeight = 0;

        while (i < name.length) {
            const codeAscii = name.charCodeAt(i);
            if (codeAscii >= 65 && codeAscii <= 90) {
                resultWeight += codeAscii * letterWeight;
                letterWeight /= 10;
                i++;
            } else {
                break;
            }
        }

        const numPart = parseInt(name.slice(i), 10);
        return resultWeight + (Number.isFinite(numPart) ? numPart : 0);
    }

    static async loadTranslations(){
        const response = await fetch("../../../../config/lang.json");
        return await response.json();
    }
}