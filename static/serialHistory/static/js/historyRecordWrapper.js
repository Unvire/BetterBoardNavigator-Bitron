class HistoryRecordWrapper {
    constructor(itemJson, untoggleAllWrappersCallback, saveToggledWrapperInstanceCallback) {
        this.itemJson = itemJson;
        this.untoggleAllWrappersCallback = untoggleAllWrappersCallback;
        this.saveToggledWrapperInstanceCallback = saveToggledWrapperInstanceCallback;

        this.wrapperContainer = document.createElement("div");
        this.wrapperContainer.className = "history-record-wrapper";

        this.mainRow = new HistoryRow(this.itemJson, () => this._toggleMeasurementsTable());
        
        const mainRowHtml = this.mainRow.getRow();
        this.wrapperContainer.appendChild(mainRowHtml);


        this.isExpanded = false;
        this.measurementsContainer = null;
        this.measurementsTable = null;        
        
        this.measures = this.itemJson.measures || [];
        if (this.measures.length > 0) {
            this.#buildMeasurementsTable();
        }
    }
    
    getRow() {
        return this.wrapperContainer;
    }

    getValue(keyName) {
        return this.mainRow.getValue(keyName);
    }

    getMeasurements() {
        return this.measurementsTable.getMeasurementsForMainApp();
    }

    collapse() {
        if (!this.measurementsContainer) {
            return;
        }

        this.measurementsContainer.style.display = "none";
        this.wrapperContainer.classList.remove("expanded");
        this.isExpanded = false;
    }


    _toggleMeasurementsTable() {
        if (this.measures.length === 0) {
            return;
        }
        
        const isExpandedBeforeCallback = this.isExpanded;
        this.untoggleAllWrappersCallback();

        if (!isExpandedBeforeCallback) {
            this.#expand();
            this.saveToggledWrapperInstanceCallback(this);
        }
    }



    #expand() {
        if (!this.measurementsContainer) {
            return;
        }

        this.measurementsContainer.style.display = "block";
        this.wrapperContainer.classList.add("expanded");
        this.isExpanded = true;
    }

    #buildMeasurementsTable() {
        this.measurementsContainer = document.createElement("div");
        this.measurementsContainer.className = "nested-measurements-container";
        this.measurementsContainer.style.display = "none";

        const measurementsHeaderContainer = document.createElement("div");
        measurementsHeaderContainer.className = "table-header";
        this.measurementsContainer.appendChild(measurementsHeaderContainer);

        const measurementsBodyContainer = document.createElement("div");
        measurementsBodyContainer.className = "table-body";
        this.measurementsContainer.appendChild(measurementsBodyContainer);

        this.measurementsTable = new MeasurementsTable(this.measurementsContainer, measurementsHeaderContainer, measurementsBodyContainer);

        const measurementsHeader = new MeasurementsTableHeader(this.measurementsTable.applySortOnClickCallback);
        this.measurementsTable.addHeader(measurementsHeader);

        const measurementsRows = this.measures.map(measure => new MeasurementsRow(measure));
        this.measurementsTable.addRows(measurementsRows);

        this.wrapperContainer.appendChild(this.measurementsContainer);
    }
}