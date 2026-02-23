class EventHandler{
    static compensateUserDevicePixelRatio(){
        const dpr = window.devicePixelRatio;
        const dynamicVH = dpr * 100;

        document.body.style.zoom = `${Math.floor(1 / dpr * 100)}%`;
        document.documentElement.style.setProperty('--GRID-CONTAINER-HEIGHT', dynamicVH + 'vh');
    }

    static keyDown(event, isTextModalInputFocused){
        if (isTextModalInputFocused){
            const textModalInput = globalInstancesMap.textModalInput;
            const textModalSubmitButton = globalInstancesMap.textModalSubmitButton;
            
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

    static isTextFieldEvent(event) {
        const target = event.target;
        const tag = (target?.tagName || "").toLowerCase();
        return tag === "input" || tag === "textarea" || target?.isContentEditable;
    }

    static async windowResize(){
        const RESCALE_AFTER_MS = 15;
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(EngineAdapter.resizeBoard, RESCALE_AFTER_MS);
    }

    static setCanvasDimensions(){
        const canvas = globalInstancesMap.canvas;
        const canvasParent = globalInstancesMap.canvasParent;

        canvas.width = canvasParent.clientWidth;
        canvas.height = canvasParent.clientHeight;
    }

    static loadFile(event, loadedFileName){
        const file = event.target.files[0];
        if (file) {
            CadFileLoader.removePreviousFileFromFS(pyodide, loadedFileName);
            CadFileLoader.openAndLoadCadFile(pyodide, file);
            EventHandler.enableButtons();
            return file.name;
        }
    }

    static enableButtons(){
        globalInstancesMap.changeSideButton.disabled = false;
        globalInstancesMap.rotateButton.disabled = false;
        globalInstancesMap.mirrorSideButton.disabled = false;
        globalInstancesMap.toggleOutlinesButton.disabled = false;
        globalInstancesMap.resetViewButton.disabled = false;
        globalInstancesMap.areaFromComponentsButton.disabled = false;
        globalInstancesMap.preserveComponentMarkersButton.disabled = false;
        globalInstancesMap.clearMarkersButton.disabled = false;
        globalInstancesMap.unselectNetButton.disabled = false;
        globalInstancesMap.findComponentUsingNameButton.disabled = false;
        globalInstancesMap.prefixComponentsButton.disabled = false;
        globalInstancesMap.unselectPrefixComponentsButton.disabled = false;
    }

    static preserveComponentMarkers(isSelectionModeSingle){
        const allComponentsList = globalInstancesMap.allComponentsList;
        const preserveComponentMarkersButton = globalInstancesMap.preserveComponentMarkersButton;
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
        const modalSubmit = globalInstancesMap.modalSubmit;
        InputModalBoxAdapter.generateModalBox(modalSubmit, "Nazwa komponentu", InputModalBoxAdapter.getComponentNameFromInput);
    }
    
    static showCommonPrefixComponents(){
        const modalSubmit = globalInstancesMap.modalSubmit;
        InputModalBoxAdapter.generateModalBox(modalSubmit, "Prefix", InputModalBoxAdapter.getCommonPrefixFromInput);
    }
    
    static hideCommonPrefixComponents(){
        const commonPrefixSpan = globalInstancesMap.commonPrefixSpan;
        
        EngineAdapter.hideCommonPrefixComponents();
        commonPrefixSpan.innerText = "";
    }

    static toggleOutlines(){
        const toggleOutlinesButton = globalInstancesMap.toggleOutlinesButton;

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
        const modalHelp = globalInstancesMap.modalHelp;
        HelpModalAdapter.generateModalBox(modalHelp)
    }

    static loadDemoFile(loadedFileName){
        fetch("./static/cad_files/demo.cad")
            .then(response => response.blob())
            .then(blob => {
                const demofile = new File([blob], "demo.cad", {type: "application/octet-stream"});
                EventHandler.loadCadFile(demofile);
                
                
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