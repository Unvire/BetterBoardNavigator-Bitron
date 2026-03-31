class AbstractTable {
    constructor(parentContainer, headerContainer, bodyContainer, defaultKey, defaultIsAscending) {
        this.parentContainer = parentContainer;
        this.headerContainer = headerContainer;
        this.bodyContainer = bodyContainer;
        
        this.headerInstance = null;
        this.rows = [];

        this.defaultKey = defaultKey;
        this.defaultIsAscending = defaultIsAscending;
        this.sortConfig = { key: this.defaultKey, isAscending: this.defaultIsAscending };
    }

    addHeader(headerInstance) {
        this.headerInstance = headerInstance;

        const headerRow = this.headerInstance.getHeaderRow();
        this.headerContainer.appendChild(headerRow);
    }

    addRows(rowInstancesList) {
        this.#clearTable();
        
        rowInstancesList.forEach(rowInstance => { 
            this.rows.push(rowInstance);
        });

        this.#sortRows();
        this.#renderBody();
        this.headerInstance.updateSortUI(this.sortConfig.key, this.sortConfig.isAscending);
    }

    applySortOnClickCallback = (key) => {
        if (this.sortConfig.key === key) {
            this.sortConfig.isAscending = !this.sortConfig.isAscending;
        } else {
            this.sortConfig.key = key;
            this.sortConfig.isAscending = true;
        }
        
        this.#sortRows();
        this.#renderBody();
        this.headerInstance.updateSortUI(this.sortConfig.key, this.sortConfig.isAscending);
    }


    #clearTable() {
        this.rows = [];
        this.bodyContainer.innerHTML = "";
        this.sortConfig = { key: this.defaultKey, isAscending: this.defaultIsAscending };
    }

    #sortRows() {
        const key = this.sortConfig.key;
        const ascendingFactor = this.sortConfig.isAscending ? 1 : -1;

        this.rows.sort((rowInstanceA, rowInstanceB) => {
            let valA = rowInstanceA.getValue(key);
            let valB = rowInstanceB.getValue(key);

            // 1. when 2 values are equal sort by default key
            if (valA === valB && key !== this.defaultKey) {
                return (rowInstanceA.getValue(this.defaultKey) - rowInstanceB.getValue(this.defaultKey)) * ascendingFactor;
            }

            // 2. numeric type sorting
            if (typeof valA === "number") {
                return (valA - valB) * ascendingFactor;
            }

            // 3. string sorting
            valA = String(valA || "").toLowerCase();
            valB = String(valB || "").toLowerCase();
            return valA.localeCompare(valB, "pl") * ascendingFactor;
        });
    }

    #renderBody() {
        this.bodyContainer.innerHTML = "";
        this.rows.forEach(rowInstance => {
            this.bodyContainer.appendChild(rowInstance.getRow());
        });
    }
}

class HistoryTable extends AbstractTable {
    constructor(parentContainer, headerContainer, bodyContainer) {
        const defaultSortKey = "date";
        const defaultIsAscending = false;

        super(parentContainer, headerContainer, bodyContainer, defaultSortKey, defaultIsAscending);
    }
}

class MeasurementsTable extends AbstractTable {
    constructor(parentContainer, headerContainer, bodyContainer) {
        const defaultSortKey = "measurement-name";
        const defaultIsAscending = true;
        
        super(parentContainer, headerContainer, bodyContainer, defaultSortKey, defaultIsAscending);
    }
}