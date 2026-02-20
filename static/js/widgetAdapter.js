class WidgetAdapter{
    static resetWidgets(){
        WidgetAdapter.resetSelectedComponentsWidgets();
        TreeViewAdapter.resetTreeview();
        WidgetAdapter.resetSpans();
    }

    static resetSelectedComponentsWidgets(){
        const allComponentsList = globalInstancesMap.getAllComponentsList();
        const pinoutTable = globalInstancesMap.getPinoutTable();
        const clickedComponentSpanList = globalInstancesMap.getClickedComponentSpanList();
        const selectedComponentSpan = globalInstancesMap.getSelectedComponentSpan();
        const partNumberComponentNameSpan = globalInstancesMap.getPartNumberComponentNameSpan();
        
        allComponentsList.unselectAllItems();
        WidgetAdapter.setSelectionModeToSingle();

        pinoutTable.unselectCurrentRows();
        pinoutTable.clearBody();
        DynamicSelectableListAdapter.generateMarkedComponentsList();
        SpanListAdapter.clearSpanList(clickedComponentSpanList);

        selectedComponentSpan.innerText = "";
        partNumberComponentNameSpan.innerText = "Kod";

        EventHandler.forcedUntoggleButton(preserveComponentMarkersButton);
    }

    static resetSelectedNet(){
        const pinoutTable = globalInstancesMap.getPinoutTable();

        TreeViewAdapter.resetTreeview();
        pinoutTable.unselectCurrentRows();
    }

    static resetSpans(){
        const commonPrefixSpan = globalInstancesMap.getCommonPrefixSpan();
        const currentSideSpan = globalInstancesMap.getCurrentSideSpan();
        const selectedComponentSpan = globalInstancesMap.getSelectedComponentSpan();
        const partNumberSpan = globalInstancesMap.getPartNumberSpan();
        const partNumberComponentNameSpan = globalInstancesMap.getPartNumberComponentNameSpan();

        commonPrefixSpan.innerText = "";
        currentSideSpan.innerText = sideHandler.currentSide();

        selectedComponentSpan.innerText = "";
        partNumberComponentNameSpan.innerText = "Kod";
        partNumberSpan.innerText = "";
    }

    static setSelectionModeToSingle() {
        const allComponentsList = globalInstancesMap.getAllComponentsList();

        isSelectionModeSingle = true;
        allComponentsList.selectionMode = "single";
    }
}

class SpanListAdapter{
    static initSpanList(parentContainer){
        let spanList =  new DynamicSpanList(parentContainer);
        spanList.clickEvent = SpanListAdapter.onClickEventSpanList;
        return spanList;
    }

    static generateSpanList(clickedComponentsList){
        const clickedComponentSpanList = globalInstancesMap.getClickedComponentSpanList();

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
    static initDynamicSelectableList(parentContainer){
        let listInstance = new DynamicSelectableList(parentContainer);
        return listInstance;
    }

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
        EngineAdapter.findComponentByName(itemName, isSelectionModeSingle);
        EngineAdapter.componentInScreenCenter(itemName);
        DynamicSelectableListAdapter.generateMarkedComponentsList();
        PartNumberSpanAdapter.displayPartNumberOfComponent(itemName);
    }

    static onClickItemEvent(itemElement){
        const itemName = DynamicSelectableListAdapter.generatePinoutTableForComponent(itemElement);
        EngineAdapter.componentInScreenCenter(itemName);
        PartNumberSpanAdapter.displayPartNumberOfComponent(itemName);
    }

    static generatePinoutTableForComponent(itemElement){
        let itemName = itemElement.textContent;
        PinoutTableAdapter.generatePinoutTable(itemName);
        return itemName;
    }

    static generateMarkedComponentsList(){
        const markedComponentsList = globalInstancesMap.getMarkedComponentsList();

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
        
        const pinoutTable = globalInstancesMap.getPinoutTable();
        pinoutTable.rowEvent = PinoutTableAdapter.selectNetFromTableEvent;
        pinoutTable.beforeRowEvent = EngineAdapter.unselectNet;
        pinoutTable.addRows(pinoutMap);
        pinoutTable.generateTable();
        
        const netsTreeview = globalInstancesMap.getNetsTreeview();
        const netTreeSelectedNetName = netsTreeview.getSelectedNetName();
        pinoutTable.selectRowByName(netTreeSelectedNetName);
        
        const selectedComponentSpan = globalInstancesMap.getSelectedComponentSpan();
        selectedComponentSpan.innerText = componentName;
    }

    static selectNetFromTableEvent(netName){
        const netsTreeview = globalInstancesMap.getNetsTreeview();
        const pinoutTable = globalInstancesMap.getPinoutTable();
        const selectedRowsList = pinoutTable.getSelectedRows();

        netsTreeview.scrollToBranchByName(netName);
        if(selectedRowsList.length > 0){
            EngineAdapter.selectNet(netName);
        }
    }

    static clearBody(){
        const pinoutTable = globalInstancesMap.getPinoutTable();

        pinoutTable.clearBody();
    }
}

class TreeViewAdapter{
    static initTreeView(parentContainer){
        let treeview = new NetTreeView(parentContainer);
        return treeview
    }

    static generateTreeView(netsMap){
        const netsTreeview = globalInstancesMap.getNetsTreeview();

        netsTreeview.eventBeforeSelection = EngineAdapter.unselectNet;
        netsTreeview.netEvent = TreeViewAdapter.selectNetFromTreeviewEvent;
        netsTreeview.componentEvent = TreeViewAdapter.selectNetComponentByName;
        netsTreeview.addBranches(netsMap);
        netsTreeview.generate();
    }
    
    static selectNetFromTreeviewEvent(netName){
        const netsTreeview = globalInstancesMap.getNetsTreeview();
        const pinoutTable = globalInstancesMap.getPinoutTable();

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
        const netsTreeview = globalInstancesMap.getNetsTreeview();
        
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
                
        const allComponentsList = globalInstancesMap.getAllComponentsList();

        if (isSelectionModeSingle) {
            allComponentsList.unselectAllItems();
        }
        allComponentsList.selectItemByName(modalBoxComponentName);

        EngineAdapter.componentInScreenCenter(modalBoxComponentName);
        PinoutTableAdapter.generatePinoutTable(modalBoxComponentName);
        DynamicSelectableListAdapter.generateMarkedComponentsList();
        PartNumberSpanAdapter.displayPartNumberOfComponent(modalBoxComponentName);
    }

    static getCommonPrefixFromInput(commonPrefix){
        const modalBoxCommonPrefix = commonPrefix.toUpperCase();
    
        const isPrefixExist = EngineAdapter.showCommonPrefixComponents(modalBoxCommonPrefix);
        if (isPrefixExist){
            const  commonPrefixSpan = globalInstancesMap.getCommonPrefixSpan();
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

        const partNumberSpan = globalInstancesMap.getPartNumberSpan();
        const partNumberComponentNameSpan = globalInstancesMap.getPartNumberComponentNameSpan();
        const partNumberExtractor = globalInstancesMap.getPdfPartNumberExtractor();

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