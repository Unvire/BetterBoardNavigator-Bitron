class EventHandler{
    static async compensateUserDevicePixelRatio(){
        const dpr = window.devicePixelRatio;
        const dynamicVH = dpr * 100;

        document.body.style.zoom = `${Math.floor(1 / dpr * 100)}%`;
        document.documentElement.style.setProperty("--GRID-CONTAINER-HEIGHT", dynamicVH + "vh");
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

    static async loadCadFile(loadedFileName){
        const partNumberSearcherIframe = globalInstancesMap.partNumberSearcherIframe;
        const partNumberSearcherButton = globalInstancesMap.partNumberSearcherButton;

        CadFileLoader.removePreviousFileFromFS(pyodide, loadedFileName);
        await CadFileLoader.openAndLoadCadFile(pyodide, loadedFileName);
        EventHandler.enableButtons();
        
        isPdfFileLoaded = false;
        partNumberSearcherButton.disabled = true;

        const targetOrigin = window.location.origin;
        partNumberSearcherIframe.contentWindow.postMessage({
                type: "PN_DICT",
                payload: {}
            }, targetOrigin);

        return loadedFileName.name;
    }

    static async loadPdfFile(loadedFileName){
        const partNumberExtractor = globalInstancesMap.partNumberExtractor;
        const partNumberSearcherButton = globalInstancesMap.partNumberSearcherButton;
        const iframe = globalInstancesMap.partNumberSearcherIframe;
        
        const pnDict = await partNumberExtractor.getPartNumbers(loadedFileName);
        const targetOrigin = window.location.origin;

        if (Object.keys(pnDict).length === 0) {
            const lang = document.documentElement.lang;
            const noPNsInFileMessage = translationsDict[lang]?.["js-no-part-numbers-in-pdf-alert"] || "W pliku PDF nie ma tabel z part numberami!";

            partNumberSearcherButton.disabled = true;
            isPdfFileLoaded = false;
            alert(noPNsInFileMessage);
        } else {
            partNumberSearcherButton.disabled = false;
            isPdfFileLoaded = true;
            iframe.contentWindow.postMessage({
                type: "PN_DICT",
                payload: pnDict
            }, targetOrigin);
        }
    }

    static enableButtons(){
        globalInstancesMap.changeSideButton.disabled = false;
        globalInstancesMap.rotateButton.disabled = false;
        globalInstancesMap.mirrorSideButton.disabled = false;
        globalInstancesMap.toggleOutlinesButton.disabled = false;
        globalInstancesMap.toggleComponentNamesButton.disabled = false;
        globalInstancesMap.resetViewButton.disabled = false;
        globalInstancesMap.areaFromComponentsButton.disabled = false;
        globalInstancesMap.preserveComponentMarkersButton.disabled = false;
        globalInstancesMap.unselectNetButton.disabled = false;
        globalInstancesMap.findComponentUsingNameButton.disabled = false;
        globalInstancesMap.prefixComponentsButton.disabled = false;
        globalInstancesMap.unselectPrefixComponentsButton.disabled = false;
        globalInstancesMap.boardHistoryShowFailsButton.disabled = false;
        globalInstancesMap.unselectAllComponentsButton.disabled = false;
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

    static async toggleComponentNames(){
        const toggleComponentNamesButton = globalInstancesMap.toggleComponentNamesButton;

        await EngineAdapter.toggleComponentNames();
        EventHandler.toggleButton(toggleComponentNamesButton);
    }

    static async unselectNet(){
        await EngineAdapter.unselectNet();
        WidgetAdapter.resetSelectedNet();
    }

    static findComponentUsingName(){
        const modalSubmit = globalInstancesMap.modalSubmit;
        const lang = document.documentElement.lang;
        const componentNameText = translationsDict[lang]?.["js-find-component-by-name-modal-title"] || "Nazwa komponentu";

        InputModalBoxAdapter.generateModalBox(modalSubmit, componentNameText, InputModalBoxAdapter.getComponentNameFromInput);
    }
    
    static showCommonPrefixComponents(){
        const modalSubmit = globalInstancesMap.modalSubmit;
        const lang = document.documentElement.lang;
        const componentNameText = translationsDict[lang]?.["js-find-prefix-modal-title"] || "Wspólny prefix";

        InputModalBoxAdapter.generateModalBox(modalSubmit, componentNameText, InputModalBoxAdapter.getCommonPrefixFromInput);
    }
    
    static async hideCommonPrefixComponents(){
        const commonPrefixSpan = globalInstancesMap.commonPrefixSpan;
        
        await EngineAdapter.hideCommonPrefixComponents();
        commonPrefixSpan.innerText = "";
    }

    static async toggleOutlines(){
        const toggleOutlinesButton = globalInstancesMap.toggleOutlinesButton;

        await EngineAdapter.toggleOutlines();
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
        const lang = document.documentElement.lang;
        const modalHelp = globalInstancesMap.modalHelp;
        const modalHeaderText = translationsDict[lang]?.["js-help-modal-title"] || "Better Board Navigator - pomoc";
        
        modalHelp.setHeader(modalHeaderText);
        SimpleModalAdapter.generateModalBox(modalHelp);
    }

    static showPartNumberSearcherModalBox(){
        const lang = document.documentElement.lang;
        const modalPartNumberSearcher = globalInstancesMap.modalPartNumberSearcher;
        const modalHeaderText = translationsDict[lang]?.["js-part-number-searcher-modal-title"] || "Wyszukiwarka part number";

        modalPartNumberSearcher.setHeader(modalHeaderText);
        SimpleModalAdapter.generateModalBox(modalPartNumberSearcher);
    }

    static loadDemoFile(loadedFileName){
        fetch("./static/cad_files/demo.cad")
            .then(response => response.blob())
            .then(async blob => {           // async blob needs to be refactored in the future...
                const demofile = new File([blob], "demo.cad", {type: "application/octet-stream"});
                await EventHandler.loadCadFile(demofile);
                
                globalInstancesMap.partNumberSearcherButton.disabled = false;
                isPdfFileLoaded = true;

                const targetOrigin = window.location.origin;


                /* MOCK DATA FOR PN SEARCHER */    
                const partNumberExtractor = globalInstancesMap.partNumberExtractor;
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
                
                const partNumberIframe = globalInstancesMap.partNumberSearcherIframe;
                partNumberIframe.onload = () => {
                    partNumberIframe.contentWindow.postMessage({
                        type: "PN_DICT",
                        payload: pnDict
                    }, targetOrigin);
                };

                if (partNumberIframe.contentWindow && partNumberIframe.contentDocument.readyState === "complete"){
                    partNumberIframe.onload(); 
                }


                /* MOCK DATA (after processing) FOR HISTORY VIEWER */    
                const historyDict =  [
                    {	
                        "processResult": 1,
                        "testDate": 1614579662,
                        "phaseDescription": "TEST 1",
                        "machineName": "MACHINE 1",
                        "serialNumber": "123456789",
                        "internalCode": "product 1",
                        "measures": [
                            { "result": "pass", "item": "test result" }
                        ]
                    }, {
                        "processResult": 0,
                        "testDate": 1614608462,
                        "phaseDescription": "TEST 1",
                        "machineName": "MACHINE 1",
                        "serialNumber": "123456789",
                        "internalCode": "product 1",
                        "measures": [
                            { "result": "fail", "item": "C1", "measure": "10",  "unitMeasure": "uF" },
                            { "result": "fail", "item": "C2", "measure": "15",  "unitMeasure": "nF" },
                            { "result": "na",   "item": "Q1" },
                            { "result": "fail", "item": "R1", "measure": "12",  "unitMeasure": "Ohm"  },
                            { "result": "fail", "item": "R2", "measure": "10",  "unitMeasure": "kOhm" },
                            { "result": "fail", "item": "R3", "measure": "7",   "unitMeasure": "kOhm" },
                            { "result": "fail", "item": "R4", "measure": "1",   "unitMeasure": "kOhm" }
                        ]
                    }	
                ];

                const historyIframe = globalInstancesMap.boardHistoryIframe;
                historyIframe.contentWindow.postMessage({ 
                        type: "MOCK_HISTORY",
                        payload: historyDict 
                    }, 
                targetOrigin);
                    
                
                return "demo.cad";
            });
    }

    static changeLanguage(selectedLanguage){
        document.documentElement.lang = selectedLanguage;

        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (translationsDict[selectedLanguage]?.[key]) {
                el.innerText = translationsDict[selectedLanguage][key];
            }
        });

        if (typeof pyodide !== "undefined") {
            const loadingSuccessMessage = translationsDict[selectedLanguage]["js-loading-screen-success"]
            globalInstancesMap.loadingScreenText.textContent = loadingSuccessMessage;
        }


        const targetOrigin = window.location.origin;
        const lang = document.documentElement.lang;
        globalInstancesMap.partNumberSearcherIframe.contentWindow.postMessage({
            type: "CHANGE_LANGUAGE",
            payload: lang
        }, targetOrigin);
        globalInstancesMap.boardHistoryIframe.contentWindow.postMessage({
            type: "CHANGE_LANGUAGE",
            payload: lang
        }, targetOrigin);
    }
}