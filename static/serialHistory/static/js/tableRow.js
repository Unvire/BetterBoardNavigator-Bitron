class AbstractTableRow {
    constructor(rowOnClickEvent, columns, flexRowStyleName) {
        this.parentRowOnClickEvent = rowOnClickEvent;

        this.columns = columns;
        this.flexRowStyleName = flexRowStyleName;

        this.row = this._createRow();
    }

    getRow() {
        return this.row;
    }

    getValue(keyName) {
    }

    _createRow() {
        const row = document.createElement("div");
        row.className = `flex-table-row ${this.flexRowStyleName}`;

        this.columns.forEach(col => {
            const cell = document.createElement("div");
            cell.className = `table-cell cell-${col.key}`;

            const span = document.createElement("span");
            span.textContent = String(col.value) || "-";
            
            this._styleResultCell(cell, col);

            cell.appendChild(span);
            row.appendChild(cell);
        });
        
        row.addEventListener("click", () => {
            this._rowOnClickEvent();
        });

        return row;
    }

    _styleResultCell(cell, column) {
    }

    _rowOnClickEvent() {
    }
}

class HistoryRow extends AbstractTableRow {
    constructor(itemJson, rowOnClickEvent) {
        const processResult = HistoryRow.normalizeResult(itemJson.processResult);
        const phaseDescription = `Faza: ${itemJson.phaseDescription}\nMaszyna: [${itemJson.machineName}]`;
        const serialNumber = itemJson.serialNumber;
        const internalCode = itemJson.internalCode;
        const testDate = itemJson.testDate;
        const rowStyle = "flex-table-body-row";

        const formattedDate = HistoryRow.formatDate(testDate);
        const columns = [
            { key: "result", value: processResult },
            { key: "date", value: formattedDate },
            { key: "phase", value: phaseDescription },
            { key: "sn", value: serialNumber },
            { key: "internal-code", value: internalCode }
        ];

        
        super(rowOnClickEvent, columns, rowStyle);


        this.processResult = processResult;
        this.phaseDescription = phaseDescription;
        this.serialNumber = serialNumber;
        this.internalCode = internalCode;
        this.testDate = testDate;
        this.measures = itemJson.measures;

        if (this.measures && this.measures.length > 0) {
            this.row.classList.add("expandable");
        }
    } 

    static formatDate(dateString) {
        if (!dateString) {
            return "-";
        }
        
        return new Date(dateString).toLocaleString();
    }

    getValue(keyName) {
        const valuesMap = {
            "result": this.processResult,
            "date": this.testDate,
            "phase": this.phaseDescription,
            "sn": this.serialNumber,
            "internal-code": this.internalCode
        }

        return valuesMap[keyName];
    }

    getMeasurements() {
        return this.measures;
    }

    _rowOnClickEvent() {
        this.parentRowOnClickEvent();
    }

    _styleResultCell(cell, column) {
        if (column.key == "result") {
            cell.classList.add("result-common");
            cell.classList.add("unselectable");
            cell.classList.add(column.value == "Pass" ? "result-pass" : "result-fail");
        }
    }        

    static normalizeResult(itemValue) {
        if (itemValue == "1") {
            return "Pass";
        }

        return "Fail";
    }
}

class MeasurementsRow extends AbstractTableRow {
    constructor(measureJson) {
        const result = MeasurementsRow.normalizeResult(measureJson.result ?? "NA");
        const measurementName = measureJson.item ?? "-";
        const measurementValue = measureJson.measure ?? "-";
        const measurementUnit = measureJson.unitMeasure ?? "-";

        const columns = [
            { key:"measurement-result", value: result },
            { key:"measurement-name", value: measurementName },
            { key:"measurement-value", value: measurementValue },
            { key:"measurement-unit", value: measurementUnit }
        ];
        const rowStyle = "measurements-body-row";

        super(null, columns, rowStyle);

        this.result = result;
        this.measurementName = measurementName;
        this.measurementValue = measurementValue;
        this.measurementUnit = measurementUnit;
    }
    
    getValue(keyName) {
        const valuesMap = {
            "measurement-result": this.result,
            "measurement-name": this.measurementName,
            "measurement-value": this.measurementValue,
            "measurement-unit": this.measurementUnit,
        }

        return valuesMap[keyName];
    }

    _styleResultCell(cell, column) {
        if (column.key == "measurement-result") {
            cell.classList.add("result-common");

            if (column.value == "Pass") {
                cell.classList.add("result-pass");
            } else if (column.value == "Fail") {
                cell.classList.add("result-fail");
            } else {
                cell.classList.add("result-na");
            }
        }
    } 

    static normalizeResult(itemValue) {
        const passKeywords = ["true", "1"];
        const failKeyWords = ["false", "0"];

        
        const valueLowerCase = String(itemValue).toLowerCase();
        if (valueLowerCase.includes("pass") || passKeywords.includes(valueLowerCase)) {
            return "Pass";

        } else if (valueLowerCase.includes("fail") || failKeyWords.includes(valueLowerCase)) {
            return "Fail";

        }
        return itemValue;
    }
}
