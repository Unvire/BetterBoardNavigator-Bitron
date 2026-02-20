class EventHandler{
    static compensateUserDevicePixelRatio(){
        const dpr = window.devicePixelRatio;
        const dynamicVH = dpr * 100;

        document.body.style.zoom = `${Math.floor(1 / dpr * 100)}%`;
        document.documentElement.style.setProperty('--GRID-CONTAINER-HEIGHT', dynamicVH + 'vh');
    }

    static keyDown(event, isTextModalInputFocused){
        if (isTextModalInputFocused){
            const textModalInput = globalInstancesMap.getTextModalInput();
            const textModalSubmitButton = globalInstancesMap.getTextModalSubmitButton();
            
            if (event.key === "Backspace"){
                textModalInput.value = textModalInput.value.slice(0, -1);
            } else if (event.key.length === 1){
                textModalInput.value += event.key;
            } else if (event.key === "Enter"){
                textModalSubmitButton.click();
            }
            event.preventDefault();
        }
    }

    static async windowResize(){
        const RESCALE_AFTER_MS = 15;
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(EngineAdapter.resizeBoard, RESCALE_AFTER_MS);
    }

    static setCanvasDimensions(){
        const canvas = globalInstancesMap.getCanvas();
        const canvasParent = globalInstancesMap.getCanvasParent();

        canvas.width = canvasParent.clientWidth;
        canvas.height = canvasParent.clientHeight;
    }

    static loadCadFile(loadedFileName){
        const partNumberSearcherIframe = globalInstancesMap.getPartNumberSearcherIframe();
        const partNumberButton = globalInstancesMap.getPartNumberSearcherButton();

        removePreviousFileFromFS(pyodide, loadedFileName);
        openAndLoadCadFile(pyodide, loadedFileName);
        EventHandler.enableButtons();
        
        isPdfFileLoaded = false;
        partNumberButton.disabled = true;
        partNumberSearcherIframe.contentWindow.location.reload();
        return loadedFileName.name;
    }

    static async loadPdfFile(loadedFileName){
        const partNumberExtractor = globalInstancesMap.getPdfPartNumberExtractor();
        const partNumberButton = globalInstancesMap.getPartNumberSearcherButton();
        const iframe = globalInstancesMap.getPartNumberSearcherIframe();
        
        const pnDict = await partNumberExtractor.getPartNumbers(loadedFileName);

        if (Object.keys(pnDict).length === 0) {
            partNumberButton.disabled = true;
            isPdfFileLoaded = false;
            alert("W pliku PDF nie ma tabel z part numberami!");
        } else {
            partNumberButton.disabled = false;
            isPdfFileLoaded = true;
            iframe.contentWindow.postMessage({
                type: "PN_DICT",
                payload: pnDict
            }, "*");
        }
    }

    static enableButtons(){
        changeSideButton.disabled = false;
        rotateButton.disabled = false;
        mirrorSideButton.disabled = false;
        toggleOutlinesButton.disabled = false;
        resetViewButton.disabled = false;
        areaFromComponentsButton.disabled = false;
        preserveComponentMarkersButton.disabled = false;
        clearMarkersButton.disabled = false;
        unselectNetButton.disabled = false;
        findComponentUsingNameButton.disabled = false;
        prefixComponentsButton.disabled = false;
    }

    static preserveComponentMarkers(isSelectionModeSingle){
        const allComponentsList = globalInstancesMap.getAllComponentsList();
        const selectionModesMap = {true: "single", false: "multiple"};
    
        isSelectionModeSingle = !isSelectionModeSingle;
        allComponentsList.selectionMode = selectionModesMap[isSelectionModeSingle];
        EventHandler.toggleButton(preserveComponentMarkersButton);
        return isSelectionModeSingle;
    }

    static unselectNet(){
        EngineAdapter.unselectNet();
        WidgetAdapter.resetSelectedNet();
    }

    static findComponentUsingName(){
        const modalSubmit = globalInstancesMap.getModalSubmit();
        InputModalBoxAdapter.generateModalBox(modalSubmit, "Nazwa komponentu", InputModalBoxAdapter.getComponentNameFromInput);
    }
    
    static showCommonPrefixComponents(){
        const modalSubmit = globalInstancesMap.getModalSubmit();
        InputModalBoxAdapter.generateModalBox(modalSubmit, "Prefix", InputModalBoxAdapter.getCommonPrefixFromInput);
    }
    
    static hideCommonPrefixComponents(){
        const commonPrefixSpan = globalInstancesMap.getCommonPrefixSpan();
        
        EngineAdapter.hideCommonPrefixComponents();
        commonPrefixSpan.innerText = "";
    }

    static toggleOutlines(){
        EngineAdapter.toggleOutlines();
        EventHandler.toggleButton(toggleOutlinesButton);
    }

    static toggleButton(button){
        if (button.classList.contains("button-selected")){
            button.classList.remove("button-selected");
        } else {
            button.classList.add("button-selected");
        }
    }

    static forcedUntoggleButton(button){
        button.classList.remove("button-selected");
    }

    static showHelpModalBox(){
        const modalHelp = globalInstancesMap.getModalHelp();
        SimpleModalAdapter.generateModalBox(modalHelp);
    }

    static showPartNumberSearcherModalBox(){
        const modalPartNumberSearcher = globalInstancesMap.getModalPartNumberSearcher();
        SimpleModalAdapter.generateModalBox(modalPartNumberSearcher);
    }

    static loadDemoFile(loadedFileName){
        fetch("./static/cad_files/demo.cad")
            .then(response => response.blob())
            .then(blob => {
                const file = new File([blob], "demo.cad", {type: "application/octet-stream"});
                const simulatedEvent = {
                    target: {
                        files: [file]
                    }
                };
                EventHandler.loadCadFile(simulatedEvent, loadedFileName);
                
                
                const partNumberButton = globalInstancesMap.getPartNumberSearcherButton();
                partNumberButton.disabled = false;
                isPdfFileLoaded = true;

                const partNumberExtractor = globalInstancesMap.getPdfPartNumberExtractor();
                const pnDict = {
                    "R1": {"partNumber": "kod1", "description": "opis1"},
                    "R2": {"partNumber": "kod2", "description": "opis2"},
                    "R3": {"partNumber": "kod3", "description": "opis3"},
                    "R4": {"partNumber": "kod4", "description": "opis4"},
                    "C1": {"partNumber": "kod5", "description": "opis5"},
                    "C2": {"partNumber": "kod5", "description": "opis5"},
                    "CN1": {"partNumber": "kod6", "description": "opis6"},
                    "CN2": {"partNumber": "kod7", "description": "opis7"},
                    "CN3": {"partNumber": "kod8", "description": "opis8"},
                    "Q1": {"partNumber": "kod9", "description": "opis9"}
                };
                partNumberExtractor.pnDict = pnDict;
                
                
                const iframe = globalInstancesMap.getPartNumberSearcherIframe();
                iframe.onload = () => {
                    iframe.contentWindow.postMessage({
                        type: "PN_DICT",
                        payload: pnDict
                    }, "*");
                };

                if (iframe.contentWindow && iframe.contentDocument.readyState === "complete"){
                    iframe.onload(); 
                }   

                return "demo.cad";
            });
    }
}