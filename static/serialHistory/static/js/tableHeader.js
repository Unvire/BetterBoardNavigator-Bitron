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
        const headerLabels = [
            { key: "measurement-result", value: "Status" },
            { key: "measurement-name", value: "Nazwa testu" },
            { key: "measurement-value", value: "Wartość" },
            { key: "measurement-unit", value: "Jednostka" }
        ];

        super(sortMethodHandle, headerLabels);
    }
}