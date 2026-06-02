class WidgetAdapter{
    static async resetWidgets(){
        await WidgetAdapter.resetSelectedComponentsWidgets();
        TreeViewAdapter.resetTreeview();
        WidgetAdapter.resetSpans();
        
        const toggleComponentNamesButton = globalInstancesMap.toggleComponentNamesButton;
        EventHandler.forcedUntoggleButton(toggleComponentNamesButton);
    }

    static async resetSelectedComponentsWidgets(){
        const allComponentsList = globalInstancesMap.allComponentsList;
        const pinoutTable = globalInstancesMap.pinoutTable;
        const clickedComponentSpanList = globalInstancesMap.clickedComponentSpanList;
        const selectedComponentSpan = globalInstancesMap.selectedComponentSpan;
        const preserveComponentMarkersButton = globalInstancesMap.preserveComponentMarkersButton;
        
        allComponentsList.unselectAllItems();
        await EngineAdapter.clearMarkers();

        // change selection mode to single component
        if (!isSelectionModeSingle){
            isSelectionModeSingle = EventHandler.preserveComponentMarkers(isSelectionModeSingle);
        };

        pinoutTable.unselectCurrentRows();
        pinoutTable.clearBody();
        DynamicSelectableListAdapter.generateMarkedComponentsList();
        SpanListAdapter.clearSpanList(clickedComponentSpanList);
        selectedComponentSpan.innerText = "";

        EventHandler.forcedUntoggleButton(preserveComponentMarkersButton);
    }

    static resetSelectedNet(){
        const pinoutTable = globalInstancesMap.pinoutTable;

        TreeViewAdapter.resetTreeview();
        pinoutTable.unselectCurrentRows();
    }

    static resetSpans(){
        const sideHandler = globalInstancesMap.sideHandler;
        const currentSideSpan = globalInstancesMap.currentSideSpan;
        const commonPrefixSpan = globalInstancesMap.commonPrefixSpan;
        const partNumberSpan = globalInstancesMap.partNumberSpan;

        currentSideSpan.innerText = sideHandler.currentSide();
        commonPrefixSpan.innerText = "";
        partNumberSpan.innerText = ""


        const selectedComponentSpan = globalInstancesMap.selectedComponentSpan;
        selectedComponentSpan.innerText = "";
    }
}



class SpanListAdapter{
    static initSpanList(parentContainer){
        let spanList =  new DynamicSpanList(parentContainer);
        spanList.clickEvent = SpanListAdapter.onClickEventSpanList;
        return spanList;
    }

    static generateSpanList(clickedComponentsList){
        const clickedComponentSpanList = globalInstancesMap.clickedComponentSpanList;

        clickedComponentSpanList.addSpans(clickedComponentsList);
        clickedComponentSpanList.generate();

        const componentName = clickedComponentsList.length === 1 ? clickedComponentsList[0] : "";
        PartNumberSpanAdapter.displayPartNumberOfComponent(componentName);
    }

    static onClickEventSpanList(componentName){
        PinoutTableAdapter.generatePinoutTable(componentName);
        PartNumberSpanAdapter.displayPartNumberOfComponent(componentName);
    }

    static clearSpanList(spanList){
        const spanListParent = spanList.getParentContainer();

        spanListParent.innerText = "";
    }
}



class DynamicSelectableListAdapter{
    static generateList(listInstance, dataList, onClickEvent, selectionMode){
        listInstance.elementsList = dataList;
        listInstance.callbackEventFunction = onClickEvent;
        listInstance.selectionMode = selectionMode;
        listInstance.generateList();
    }

    static clearList(listInstance){
        listInstance.clearList();
    }

    static async selectItemFromListEvent(itemElement){
        const itemName = await DynamicSelectableListAdapter.generatePinoutTableForComponent(itemElement);

        const markedComponentsList = globalInstancesMap.markedComponentsList;
        if (markedComponentsList.includes(itemName)){
            await EngineAdapter.componentInScreenCenter(itemName);
            return;
        }

        await EngineAdapter.findComponentByName(itemName);
        await EngineAdapter.componentInScreenCenter(itemName);
        await DynamicSelectableListAdapter.generateMarkedComponentsList();
        PartNumberSpanAdapter.displayPartNumberOfComponent(itemName);
    }

    static async onClickItemEvent(itemElement){
        const itemName = await DynamicSelectableListAdapter.generatePinoutTableForComponent(itemElement);
        await EngineAdapter.componentInScreenCenter(itemName);
        PartNumberSpanAdapter.displayPartNumberOfComponent(itemName);
    }

    static async generatePinoutTableForComponent(itemElement){
        let itemName = itemElement.getAttribute("data-key");
        await PinoutTableAdapter.generatePinoutTable(itemName);
        return itemName;
    }

    static async generateMarkedComponentsList(){
        const markedComponentsList = globalInstancesMap.markedComponentsList;

        await pyodide.runPythonAsync(`
            componentsList = engine.getSelectedComponents()
        `);
        const componentsListProxy = pyodide.globals.get("componentsList");
        const componentsList = componentsListProxy.toJs();
        componentsListProxy.destroy()

        DynamicSelectableListAdapter.generateList(markedComponentsList, componentsList, DynamicSelectableListAdapter.onClickItemEvent, "no");
        markedComponentsList.onCloseIconClick = DynamicSelectableListAdapter.unselectComponentAndRemoveItemFromList;
    }

    static async unselectComponentAndRemoveItemFromList(componentName){
        if (isSelectionModeSingle) {
            await EngineAdapter.clearMarkers();
        } else {
            await EngineAdapter.findComponentByName(componentName);
        }        
        await DynamicSelectableListAdapter.generateMarkedComponentsList();

        const allComponentsList = globalInstancesMap.allComponentsList;
        allComponentsList.unselectItemByName(componentName);
    }
}



class PinoutTableAdapter{
    static initPinoutTable(parentContainer){
        let table = new PinoutTable(parentContainer);
        return table;
    }

    static async generatePinoutTable(componentName){
        await pyodide.runPythonAsync(`
            pinoutDict = engine.getComponentPinout("${componentName}")
        `);
        let pinoutMapProxy = pyodide.globals.get("pinoutDict");  
        let pinoutMap = pinoutMapProxy.toJs();
        pinoutMapProxy.destroy();
        
        const pinoutTable = globalInstancesMap.pinoutTable;
        pinoutTable.rowEvent = PinoutTableAdapter.selectNetFromTableEvent;
        pinoutTable.beforeRowEvent = EngineAdapter.unselectNet;
        pinoutTable.addRows(pinoutMap);
        pinoutTable.generateTable();
        
        const netsTreeview = globalInstancesMap.netsTreeview;
        const netTreeSelectedNetName = netsTreeview.getSelectedNetName();
        pinoutTable.selectRowByName(netTreeSelectedNetName);
        
        const selectedComponentSpan = globalInstancesMap.selectedComponentSpan;
        selectedComponentSpan.innerText = `${componentName}\n`;
    }

    static async selectNetFromTableEvent(netName){
        const netsTreeview = globalInstancesMap.netsTreeview;
        const pinoutTable = globalInstancesMap.pinoutTable;
        const selectedRowsList = pinoutTable.getSelectedRows();

        netsTreeview.scrollToBranchByName(netName);
        if(selectedRowsList.length > 0){
            await EngineAdapter.selectNet(netName);
        }
    }

    static clearBody(){
        const pinoutTable = globalInstancesMap.pinoutTable;

        pinoutTable.clearBody();
    }
}



class TreeViewAdapter{
    static initTreeView(parentContainer){
        let treeview = new NetTreeView(parentContainer);
        return treeview
    }

    static generateTreeView(netsMap){
        const netsTreeview = globalInstancesMap.netsTreeview;

        netsTreeview.eventBeforeSelection = EngineAdapter.unselectNet;
        netsTreeview.netEvent = TreeViewAdapter.selectNetFromTreeviewEvent;
        netsTreeview.componentEvent = TreeViewAdapter.selectNetComponentByName;
        netsTreeview.addBranches(netsMap);
        netsTreeview.generate();
    }
    
    static async selectNetFromTreeviewEvent(netName){
        const netsTreeview = globalInstancesMap.netsTreeview;
        const pinoutTable = globalInstancesMap.pinoutTable;

        pinoutTable.selectRowByName(netName);    

        if(netsTreeview.getSelectedNet()){
            await EngineAdapter.selectNet(netName);
        }
    }

    static async selectNetComponentByName(componentName){
        await EngineAdapter.selectNetComponentByName(componentName);
        PartNumberSpanAdapter.displayPartNumberOfComponent(componentName);
    }

    static resetTreeview(){
        const netsTreeview = globalInstancesMap.netsTreeview;
        
        netsTreeview.unselectCurrentBranch();
        netsTreeview.unselectCurrentItem();
    }
}



class InputModalBoxAdapter{
    static generateModalBox(modalboxInstance, headerString, submitEvent){
        modalboxInstance.setHeader(headerString);
        modalboxInstance.buttonEvent = submitEvent;
        modalboxInstance.show();
    }

    static async getComponentNameFromInput(componentName){
        if (!componentName || componentName.trim() === "") {
            return; 
        }

        const modalBoxComponentName = componentName.toUpperCase();
        const isComponentExist = await EngineAdapter.findComponentByName(modalBoxComponentName);

        if (!isComponentExist){ 
            return;
        }

        const markedComponentsList = globalInstancesMap.markedComponentsList;
        if (markedComponentsList.includes(modalBoxComponentName)){
            return;
        }


        const allComponentsList = globalInstancesMap.allComponentsList;

        if (isSelectionModeSingle) {
            allComponentsList.unselectAllItems();
        }
        allComponentsList.selectItemByName(modalBoxComponentName);

        await EngineAdapter.componentInScreenCenter(modalBoxComponentName);
        await PinoutTableAdapter.generatePinoutTable(modalBoxComponentName);
        await DynamicSelectableListAdapter.generateMarkedComponentsList();
        PartNumberSpanAdapter.displayPartNumberOfComponent(modalBoxComponentName);
    }

    static async getCommonPrefixFromInput(commonPrefix){
        if (!commonPrefix || commonPrefix.trim() === "") {
            return; 
        }
        
        const modalBoxCommonPrefix = commonPrefix.toUpperCase();
    
        const isPrefixExist = await EngineAdapter.showCommonPrefixComponents(modalBoxCommonPrefix);
        if (isPrefixExist){
            const  commonPrefixSpan = globalInstancesMap.commonPrefixSpan;
            commonPrefixSpan.innerText = modalBoxCommonPrefix;
        }
    }
}



class SimpleModalAdapter{
    static generateModalBox(modalboxInstance){
        modalboxInstance.show();
    }
}



class PartNumberSpanAdapter{
    static displayPartNumberOfComponent(componentName){
        if (!isPdfFileLoaded) {
            return;
        }

        const partNumberSpan = globalInstancesMap.partNumberSpan;
        const partNumberComponentNameSpan = globalInstancesMap.partNumberComponentNameSpan;
        const partNumberExtractor = globalInstancesMap.partNumberExtractor;

        const partNumber = partNumberExtractor.getPartNumberOfComponent(componentName);
        if (partNumber == ""){
            const lang = document.documentElement.lang;
            const partNumberSpanText = translationsDict[lang]?.["current-code-text"] || "Kod";

            partNumberComponentNameSpan.innerText = partNumberSpanText;
            partNumberSpan.innerText = "";
        } else {
            partNumberComponentNameSpan.innerText = componentName;
            partNumberSpan.innerText = partNumber;
        }
    }
}



class BoardHistoryAdapter{
    static showModalBox(){
        const lang = document.documentElement.lang;
        const boardHistoryInstance = globalInstancesMap.modalBoardHistory;
        const modalHeaderText = translationsDict[lang]?.["js-board-history-modal-title"] || "Historia płytki";

        boardHistoryInstance.setHeader(modalHeaderText);
        boardHistoryInstance.show();        
    }

    static passTracebilityUrlToIframe(tracebilityRootUrl){
        const targetOrigin = window.location.origin; 

        globalInstancesMap.boardHistoryIframe.contentWindow.postMessage({
            type: "SET_API_ROOT",
            payload: tracebilityRootUrl
        }, targetOrigin);
    }

    static getMeasurementsJsonRequest(){
        const targetOrigin = window.location.origin;

        globalInstancesMap.boardHistoryIframe.contentWindow.postMessage({ 
            type: "GET_DATA_REQUEST" 
        }, targetOrigin);
    }

    static async showFailedComponents(tracebiliyTestNames){
        if (!Array.isArray(tracebiliyTestNames) || tracebiliyTestNames.length === 0){
            return;
        }
        

        const allComponentsList = globalInstancesMap.allComponentsList;
        const modalBoardHistory = globalInstancesMap.modalBoardHistory;

        // change selection mode to multiple components
        if (isSelectionModeSingle){
            isSelectionModeSingle = EventHandler.preserveComponentMarkers(isSelectionModeSingle);
        };

        await EngineAdapter.clearMarkers();
        allComponentsList.unselectAllItems();

        pyodide.globals.set("tracebiliyTestNames", tracebiliyTestNames);
        await pyodide.runPythonAsync(`
            from tracebilityFailsParser import TracebilityFailsParser
            
            failsParser = TracebilityFailsParser()
            failedComponents = failsParser.parse(tracebiliyTestNames)            
        `);
        
        // short and float fails return number of testpoint, so prefix mostCommonPrefix must be added
        const failedComponents = pyodide.globals.get("failedComponents").toJs();
        failedComponents.forEach((item, index, array) => {
            if (/^\d+$/.test(item)) {
                array[index] = `${mostCommonPrefix}${item}`;
            }
        });

        for (const componentName of failedComponents) {
            const ifComponentExist = await EngineAdapter.findComponentByName(componentName);
            
            if (ifComponentExist) {
                allComponentsList.selectItemByName(componentName);
            }
        }

        DynamicSelectableListAdapter.generateMarkedComponentsList();        
        
        modalBoardHistory.close()
    }
}