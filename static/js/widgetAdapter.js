class WidgetAdapter{
    static resetWidgets(){
        WidgetAdapter.resetSelectedComponentsWidgets();
        TreeViewAdapter.resetTreeview();
        WidgetAdapter.resetSpans();
    }

    static resetSelectedComponentsWidgets(){
        const allComponentsList = globalInstancesMap.allComponentsList;
        const pinoutTable = globalInstancesMap.pinoutTable;
        const clickedComponentSpanList = globalInstancesMap.clickedComponentSpanList;
        const selectedComponentSpan = globalInstancesMap.selectedComponentSpan;
        const preserveComponentMarkersButton = globalInstancesMap.preserveComponentMarkersButton;
        
        allComponentsList.unselectAllItems();
        EngineAdapter.clearMarkers();

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
        const commonPrefixSpan = globalInstancesMap.commonPrefixSpan;
        const currentSideSpan = globalInstancesMap.currentSideSpan;
        const selectedComponentSpan = globalInstancesMap.selectedComponentSpan;
        const sideHandler = globalInstancesMap.sideHandler;

        commonPrefixSpan.innerText = '';
        currentSideSpan.innerText = sideHandler.currentSide();

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

    static selectItemFromListEvent(itemElement){
        const itemName = DynamicSelectableListAdapter.generatePinoutTableForComponent(itemElement);

        const markedComponentsList = globalInstancesMap.markedComponentsList;
        if (markedComponentsList.includes(itemName)){
            return;
        }

        EngineAdapter.findComponentByName(itemName, isSelectionModeSingle);
        EngineAdapter.componentInScreenCenter(itemName);
        DynamicSelectableListAdapter.generateMarkedComponentsList();
    }

    static onClickItemEvent(itemElement){
        const itemName = DynamicSelectableListAdapter.generatePinoutTableForComponent(itemElement);
        EngineAdapter.componentInScreenCenter(itemName);
        PartNumberSpanAdapter.displayPartNumberOfComponent(itemName);
    }

    static generatePinoutTableForComponent(itemElement){
        let itemName = itemElement.getAttribute("data-key");
        PinoutTableAdapter.generatePinoutTable(itemName);
        return itemName;
    }

    static generateMarkedComponentsList(){
        const markedComponentsList = globalInstancesMap.markedComponentsList;

        pyodide.runPython(`
            componentsList = engine.getSelectedComponents()
        `);
        const componentsList = pyodide.globals.get("componentsList").toJs();
        DynamicSelectableListAdapter.generateList(markedComponentsList, componentsList, DynamicSelectableListAdapter.onClickItemEvent, "no");
    }
}

class PinoutTableAdapter{
    static initPinoutTable(parentContainer){
        let table = new PinoutTable(parentContainer);
        return table;
    }

    static generatePinoutTable(componentName){
        pyodide.runPython(`
            pinoutDict = engine.getComponentPinout('${componentName}')
        `);
        let pinoutMap = pyodide.globals.get("pinoutDict").toJs();
        
        const pinoutTable = globalInstancesMap.pinoutTable;
        pinoutTable.rowEvent = PinoutTableAdapter.selectNetFromTableEvent;
        pinoutTable.beforeRowEvent = EngineAdapter.unselectNet;
        pinoutTable.addRows(pinoutMap);
        pinoutTable.generateTable();
        
        const netsTreeview = globalInstancesMap.netsTreeview;
        const netTreeSelectedNetName = netsTreeview.getSelectedNetName();
        pinoutTable.selectRowByName(netTreeSelectedNetName);
        
        const selectedComponentSpan = globalInstancesMap.selectedComponentSpan;
        selectedComponentSpan.innerText = componentName;
    }

    static selectNetFromTableEvent(netName){
        const netsTreeview = globalInstancesMap.netsTreeview;
        const pinoutTable = globalInstancesMap.pinoutTable;
        const selectedRowsList = pinoutTable.getSelectedRows();

        netsTreeview.scrollToBranchByName(netName);
        if(selectedRowsList.length > 0){
            EngineAdapter.selectNet(netName);
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
        netsTreeview.componentEvent = EngineAdapter.selectNetComponentByName;
        netsTreeview.addBranches(netsMap);
        netsTreeview.generate();
    }
    
    static selectNetFromTreeviewEvent(netName){
        const netsTreeview = globalInstancesMap.netsTreeview;
        const pinoutTable = globalInstancesMap.pinoutTable;

        pinoutTable.selectRowByName(netName);    

        if(netsTreeview.getSelectedNet()){
            EngineAdapter.selectNet(netName);
        }
    }

    static selectNetComponentByName(componentName){
        EngineAdapter.selectNetComponentByName(componentName);
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

    static getComponentNameFromInput(componentName){
        const modalBoxComponentName = componentName.toUpperCase();
        const isComponentExist = EngineAdapter.findComponentByName(modalBoxComponentName, isSelectionModeSingle);

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

        EngineAdapter.componentInScreenCenter(modalBoxComponentName);
        PinoutTableAdapter.generatePinoutTable(modalBoxComponentName);
        DynamicSelectableListAdapter.generateMarkedComponentsList();
    }

    static getCommonPrefixFromInput(commonPrefix){
        const modalBoxCommonPrefix = commonPrefix.toUpperCase();
    
        const isPrefixExist = EngineAdapter.showCommonPrefixComponents(modalBoxCommonPrefix);
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
            partNumberComponentNameSpan.innerText = "Kod";
            partNumberSpan.innerText = "";
        } else {
            partNumberComponentNameSpan.innerText = componentName;
            partNumberSpan.innerText = partNumber;
        }
    }
}

class BoardHistoryAdapter{
    static showModalBox(){
        const boardHistoryInstance = globalInstancesMap.modalBoardHistory;
        boardHistoryInstance.show();        
    }

    static passTracebilityUrlToIframe(tracebilityRootUrl){
        const targetOrigin = window.location.origin; 

        globalInstancesMap.boardHistoryIframe.contentWindow.postMessage({
            type: 'SET_API_ROOT',
            payload: tracebilityRootUrl
        }, targetOrigin);
    }

    static getMeasurementsJsonRequest(){
        const targetOrigin = window.location.origin;

        globalInstancesMap.boardHistoryIframe.contentWindow.postMessage({ 
            type: 'GET_DATA_REQUEST' 
        }, targetOrigin);
    }

    static showFailedComponents(tracebiliyTestNames){
        if (!Array.isArray(tracebiliyTestNames) || tracebiliyTestNames.length === 0){
            return;
        }
        

        const allComponentsList = globalInstancesMap.allComponentsList;
        const modalBoardHistory = globalInstancesMap.modalBoardHistory;

        // change selection mode to multiple components
        if (isSelectionModeSingle){
            isSelectionModeSingle = EventHandler.preserveComponentMarkers(isSelectionModeSingle);
        };

        EngineAdapter.clearMarkers();
        allComponentsList.unselectAllItems();

        pyodide.globals.set("tracebiliyTestNames", tracebiliyTestNames);
        pyodide.runPython(`
            from tracebilityFailsParser import TracebilityFailsParser
            
            failsParser = TracebilityFailsParser()
            failedComponents = failsParser.parse(tracebiliyTestNames)            
        `);
        
        const failedComponents = pyodide.globals.get("failedComponents").toJs();
        failedComponents.forEach(componentName => {
            const ifComponentExist = EngineAdapter.findComponentByName(componentName, isSelectionModeSingle);
            if (ifComponentExist){
                allComponentsList.selectItemByName(componentName);
            }
        });

        DynamicSelectableListAdapter.generateMarkedComponentsList();        
        
        modalBoardHistory.close()
    }
}