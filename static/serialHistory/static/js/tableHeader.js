class AbstractTableHeader {
    constructor(sortMethodHandle, headerLabelsList) {
        this.onSortCallback = sortMethodHandle;
        this.headerLabelsList = headerLabelsList;

        this.cells = {};
        this.row = this.#createHeaderRow();
    }

    #createHeaderRow(){
        const row = document.createElement("div");
        row.className = "flex-table-row";

        this.headerLabelsList.forEach(header => {
            const cell = document.createElement("div");
            cell.className = `table-cell header-cell cell-${header.key} unselectable`;

            const span = document.createElement("span");
            span.textContent = header.value;

            cell.onclick = () => {this.onSortCallback(header.key)};

            cell.appendChild(span);
            row.appendChild(cell);

            this.cells[header.key] = cell;
        });

        return row;
    }

    getHeaderRow() {
        return this.row;
    }

    updateSortUI = (activeKey, isAscending) => {
        Object.values(this.cells).forEach(cell => {
            cell.classList.remove("sort-asc", "sort-desc");
        });

        const activeCell = this.cells[activeKey];
        if (activeCell) {
            activeCell.classList.add(isAscending ? "sort-asc" : "sort-desc");
        }
    }
}

class HistoryTableHeader extends AbstractTableHeader {
    constructor(sortMethodHandle) {
        const lang = document.documentElement.lang;

        const status = translationsDict[lang]?.["js-history-table-header-row-status"] || "Status";
        const testDate = translationsDict[lang]?.["js-history-table-header-test-date"] || "Data testu";
        const phase = translationsDict[lang]?.["js-history-table-header-phase"] || "Faza";
        const msn = translationsDict[lang]?.["js-history-table-header-serial-number"] || "Numer seryjny";
        const internalCode = translationsDict[lang]?.["js-history-table-header-internal-code"] || "Kod";

        const headerLabels = [
            { key: "result", value: "Status" },
            { key: "date", value: "Data testu" },
            { key: "phase", value: "Faza" },
            { key: "sn", value: "Numer seryjny" },
            { key: "internal-code", value: "Kod" }
        ];

        super(sortMethodHandle, headerLabels);
    }
}

class MeasurementsTableHeader extends AbstractTableHeader {
    constructor(sortMethodHandle) {
        const lang = document.documentElement.lang;

        const status = translationsDict[lang]?.["js-history-table-header-row-status"] || "Status";
        const testname = translationsDict[lang]?.["js-history-table-header-test-name"] || "Nazwa testu";
        const value = translationsDict[lang]?.["js-history-table-header-test-value"] || "Wartość";
        const unit = translationsDict[lang]?.["js-history-table-header-test-unit"] || "Jednostka";

        const headerLabels = [
            { key: "measurement-result", value: status },
            { key: "measurement-name", value: testname },
            { key: "measurement-value", value: value },
            { key: "measurement-unit", value: unit }
        ];

        super(sortMethodHandle, headerLabels);
    }
}