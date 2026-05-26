async function main(){   
    EventHandler.compensateUserDevicePixelRatio();

    document.addEventListener("DOMContentLoaded", async () => { 
        _bindHtmlElements();

        LoadingScreen.showLoadingScreen();
        LoadingScreen.showLoadingDots();

        const TRACEBILITY_URL = await loadServerIP();
        _bindBoardHistoryOnLoadEvent(TRACEBILITY_URL);

        await _loadTranslations();
        await _initPyodide();
            
        _initWidgetClasses();
        _bindIframeResponseEvent();
        _bindMouseAndKeyboardEvents();
        await _bindLoadFilesEvents();
        _bindOnClickEvents();
    });
}

async function loadServerIP() {
    try {
        const response = await fetch("config/traceabilityIP.txt");
        if (!response.ok) throw new Error("Brak pliku IP");
        
        const ip = (await response.text()).trim();
        return ip;

    } catch (error) {
        const lang = document.documentElement.lang;
        const alertMessage = translationsDict[lang]?.["js-no-ip-adress-alert"] || "Błąd wczytywania IP:";

        console.error(alertMessage, error);
        return "";
    }
}

function _bindHtmlElements(){
    // buttons row
    globalInstancesMap.loadFilesButton = document.getElementById("load-files-button");
    globalInstancesMap.loadFilesInput = document.getElementById("load-files-input");

    globalInstancesMap.rotateButton = document.getElementById("rotate-button");
    globalInstancesMap.changeSideButton = document.getElementById("change-side-button");
    globalInstancesMap.mirrorSideButton = document.getElementById("mirror-side-button");
    globalInstancesMap.toggleOutlinesButton = document.getElementById("toggle-outlines-button");
    globalInstancesMap.toggleComponentNamesButton = document.getElementById("toggle-component-names-button");

    globalInstancesMap.resetViewButton = document.getElementById("default-view-button");    
    globalInstancesMap.areaFromComponentsButton = document.getElementById("components-area-button");

    globalInstancesMap.partNumberSearcherButton = document.getElementById("part-number-searcher-button");
    globalInstancesMap.partNumberSearcherIframe = document.getElementById("part-number-searcher-iframe");
    globalInstancesMap.boardHistoryButton = document.getElementById("board-history-button");
    globalInstancesMap.boardHistoryIframe = document.getElementById("board-history-iframe");

    globalInstancesMap.unselectNetButton = document.getElementById("unselect-net-button");

    globalInstancesMap.prefixComponentsButton = document.getElementById("prefix-components-button");
    globalInstancesMap.unselectPrefixComponentsButton = document.getElementById("unselect-prefix-components-button");

    globalInstancesMap.helpButton = document.getElementById("help-button");

    // left top
    globalInstancesMap.currentSideSpan = document.getElementById("current-side-span");
    globalInstancesMap.commonPrefixSpan = document.getElementById("common-prefix-span");
    globalInstancesMap.partNumberSpan = document.getElementById("part-number-span");
    globalInstancesMap.partNumberComponentNameSpan = document.getElementById("part-number-component-name-span");

    // left middle
    globalInstancesMap.allComponentsContainer = document.getElementById("scrollable-all-components-list");
    globalInstancesMap.findComponentUsingNameButton = document.getElementById("find-component-by-name-button");
    globalInstancesMap.preserveComponentMarkersButton = document.getElementById("toggle-leave-markers-button");

    // left bottom
    globalInstancesMap.markedComponentsContainer = document.getElementById("scrollable-marked-components-list");
    globalInstancesMap.unselectAllComponentsButton = document.getElementById("unselect-all-components-button");

    // middle
    globalInstancesMap.canvas = document.getElementById("canvas");
    globalInstancesMap.canvasParent = document.getElementById("item-center");

    // right top
    globalInstancesMap.clickedComponentContainer = document.getElementById("clicked-components");
    
    // right middle
    globalInstancesMap.pinoutTableContainer = document.getElementById("pinout-table");    
    globalInstancesMap.selectedComponentSpan = document.getElementById("selected-component-span");

    // right bottom
    globalInstancesMap.netTreeviewContainer = document.getElementById("net-treeview");

    // modal box with input field and button
    globalInstancesMap.textModalContainer = document.getElementById("text-modal");
    globalInstancesMap.textModalCloseSpan = document.getElementById("text-modal-close-span");
    globalInstancesMap.textModalPromptHeader = document.getElementById("text-modal-header");
    globalInstancesMap.textModalInput = document.getElementById("text-modal-input");
    globalInstancesMap.textModalSubmitButton = document.getElementById("text-modal-submit-text-button");

    // help modal box
    globalInstancesMap.helpModalContainer = document.getElementById("help-modal");
    globalInstancesMap.helpModalCloseSpan = document.getElementById("help-modal-close-span");
    globalInstancesMap.helpModalHeader = document.getElementById("help-modal-header");
    globalInstancesMap.showDemoBoardButton = document.getElementById("show-demo-board-button");

    // part number searcher modal box
    globalInstancesMap.partNumberModalContainer = document.getElementById("part-number-searcher-modal");
    globalInstancesMap.partNumberModalCloseSpan = document.getElementById("part-number-searcher-modal-close-span");
    globalInstancesMap.partNumberModalHeader = document.getElementById("part-number-searcher-modal-header");

    // board history modal box
    globalInstancesMap.boardHistoryModalContainer = document.getElementById("board-history-modal");
    globalInstancesMap.boardHistoryCloseSpan = document.getElementById("board-history-modal-close-span");
    globalInstancesMap.boardHistoryModalHeader = document.getElementById("board-history-modal-header");
    globalInstancesMap.boardHistoryShowFailsButton = document.getElementById("board-history-show-fails-button");

    // language changer
    globalInstancesMap.languagePickerContainer = document.getElementById("language-picker-container");
    globalInstancesMap.languagePickerButton = document.getElementById("language-picker-button");
    globalInstancesMap.languagePickerBadgeSpan = document.getElementById("language-picker-badge-span");
    globalInstancesMap.languagePickerCurrentLanguageSpan = document.getElementById("language-picker-current-language-span");
    globalInstancesMap.languagePickerMenu = document.getElementById("language-picker-menu");

    // loading screen
    globalInstancesMap.loadingScreenContainer = document.getElementById("loading-screen");
    globalInstancesMap.loadingScreenDots = document.getElementById("loading-dots");
    globalInstancesMap.loadingScreenText = document.getElementById("loading-text");
}

function _bindBoardHistoryOnLoadEvent(tracebilityRootUrl){
    globalInstancesMap.boardHistoryIframe.onload = () => {
        BoardHistoryAdapter.passTracebilityUrlToIframe(tracebilityRootUrl);
    };
}

async function _loadTranslations(){
    const response = await fetch("config/lang.json");
    translationsDict = await response.json();
}


function _initWidgetClasses(){
    const modalSubmit = new ModalSubmit(
        globalInstancesMap.textModalContainer, 
        globalInstancesMap.textModalCloseSpan, 
        globalInstancesMap.textModalPromptHeader, 
        globalInstancesMap.textModalInput, 
        globalInstancesMap.textModalSubmitButton
    );
    globalInstancesMap.modalSubmit = modalSubmit;
    
    const modalHelp = new ButtonModal(
        globalInstancesMap.helpModalContainer, 
        globalInstancesMap.helpModalCloseSpan, 
        globalInstancesMap.helpModalHeader, 
        globalInstancesMap.showDemoBoardButton
    );
    globalInstancesMap.modalHelp = modalHelp;

    const modalPartNumberSearcher = new ModalBox(
        globalInstancesMap.partNumberModalContainer, 
        globalInstancesMap.partNumberModalCloseSpan, 
        globalInstancesMap.partNumberModalHeader
    );
    globalInstancesMap.modalPartNumberSearcher = modalPartNumberSearcher;

    const modalBoardHistory = new ButtonModal(
        globalInstancesMap.boardHistoryModalContainer,
        globalInstancesMap.boardHistoryCloseSpan,
        globalInstancesMap.boardHistoryModalHeader,
        globalInstancesMap.boardHistoryShowFailsButton
    );
    globalInstancesMap.modalBoardHistory = modalBoardHistory;

    
    const allComponentsList = new AllComponentDynamicSelectableList(globalInstancesMap.allComponentsContainer);
    globalInstancesMap.allComponentsList = allComponentsList;

    const markedComponentsList = new MarkedComponentSelectableList(globalInstancesMap.markedComponentsContainer);
    globalInstancesMap.markedComponentsList = markedComponentsList;


    const pinoutTable = PinoutTableAdapter.initPinoutTable(globalInstancesMap.pinoutTableContainer);
    pinoutTable.generateTable();
    globalInstancesMap.pinoutTable = pinoutTable;


    const netsTreeview = TreeViewAdapter.initTreeView(globalInstancesMap.netTreeviewContainer);
    globalInstancesMap.netsTreeview = netsTreeview;


    const clickedComponentSpanList = SpanListAdapter.initSpanList(globalInstancesMap.clickedComponentContainer);
    globalInstancesMap.clickedComponentSpanList = clickedComponentSpanList;


    const sideHandler = new SideHandler();
    globalInstancesMap.sideHandler = sideHandler;

    const partNumberExtractor = new PartNumberPDFExtractor();
    globalInstancesMap.partNumberExtractor = partNumberExtractor;

    const languageChanger = new LanguageChanger(
        globalInstancesMap.languagePickerContainer,
        globalInstancesMap.languagePickerButton,
        globalInstancesMap.languagePickerMenu,
        globalInstancesMap.languagePickerBadgeSpan,
        globalInstancesMap.languagePickerCurrentLanguageSpan,
        EventHandler.changeLanguage
    )
}

async function _initPyodide(){
    pyodide = await loadPyodide();
    await PythonConfigurator.configurePythonPath(pyodide);                      
    await PythonConfigurator.loadPygame(pyodide);            
    await PythonConfigurator.loadLocalModules(pyodide);

    pyodide.canvas.setCanvas2D(canvas);
    EventHandler.setCanvasDimensions();
    
    globalInstancesMap.loadFilesButton.disabled = false;
    globalInstancesMap.helpButton.disabled = false;
    globalInstancesMap.boardHistoryButton.disabled = false;
}

function _bindMouseAndKeyboardEvents(){
    document.addEventListener("click", () => {
        globalInstancesMap.languagePickerMenu.classList.remove("show");
    });

    window.addEventListener("resize", EventHandler.windowResize);

        window.addEventListener("keydown", (event) =>{
        EventHandler.keyDown(event, isTextModalInputFocused);
        
        // allow for text field events
        if (isTextModalInputFocused || EventHandler.isTextFieldEvent(event)){
            return;
        }

        // do not pass keydown event to pygame SDL
        event.stopImmediatePropagation();
    }, true); 

    window.addEventListener("keyup", (event) => {
        // do not pass keydown event to pygame SDL
        event.stopImmediatePropagation();
    }, true);            


    globalInstancesMap.canvas.addEventListener("mousedown", MouseEventHandler.mouseDownEvent);
    globalInstancesMap.canvas.addEventListener("mouseup", MouseEventHandler.mouseUpEvent);       
    globalInstancesMap.canvas.addEventListener("mousemove", MouseEventHandler.mouseMoveEvent);
    globalInstancesMap.canvas.addEventListener("wheel", EngineAdapter.zoomInOut);
}

function _bindIframeResponseEvent(){
    const targetOrigin = window.location.origin;

    window.addEventListener("message", (event) => {
        if (event.origin !== targetOrigin) return;

        if (event.data.type === "DATA_RESPONSE") {
            const receivedData = event.data.payload;
            BoardHistoryAdapter.showFailedComponents(receivedData);
        }
    });
}

function _bindLoadFilesEvents(){
    globalInstancesMap.loadFilesButton.addEventListener("click", () => {
            globalInstancesMap.loadFilesInput.click();
    });
    globalInstancesMap.loadFilesInput.addEventListener("change", async (event) => {
        const files = [...event.target.files];

        const cadFile = files.find(f =>
            /\.(cad|gcd|tgz|zip)$/i.test(f.name)
        );

        const pdfFile = files.find(f =>
            /\.pdf$/i.test(f.name)
        );


        if (!cadFile) {
            const lang = document.documentElement.lang;
            const noCadFileMessage = translationsDict[lang]?.["js-no-cad-file-selected-alert"] || "Musisz wybrać plik ze schematem płytki";

            alert(noCadFileMessage);
            return;
        }

        await EventHandler.loadCadFile(cadFile);
        if (pdfFile) {
            await EventHandler.loadPdfFile(pdfFile);
        }
    });
}

function _bindOnClickEvents(){
    globalInstancesMap.changeSideButton.addEventListener("click", EngineAdapter.changeSide);
    globalInstancesMap.rotateButton.addEventListener("click", EngineAdapter.rotateBoard);
    globalInstancesMap.mirrorSideButton.addEventListener("click", EngineAdapter.mirrorSide);
    globalInstancesMap.toggleOutlinesButton.addEventListener("click", EventHandler.toggleOutlines);
    globalInstancesMap.resetViewButton.addEventListener("click", EngineAdapter.resetView);
    globalInstancesMap.areaFromComponentsButton.addEventListener("click", EngineAdapter.areaFromComponents);
    globalInstancesMap.preserveComponentMarkersButton.addEventListener("click", () => {
        isSelectionModeSingle = EventHandler.preserveComponentMarkers(isSelectionModeSingle);
    });
    globalInstancesMap.toggleComponentNamesButton.addEventListener("click", EventHandler.toggleComponentNames);
    globalInstancesMap.unselectNetButton.addEventListener("click", EventHandler.unselectNet);            
    globalInstancesMap.findComponentUsingNameButton.addEventListener("click", EventHandler.findComponentUsingName);
    globalInstancesMap.prefixComponentsButton.addEventListener("click", EventHandler.showCommonPrefixComponents);
    globalInstancesMap.unselectPrefixComponentsButton.addEventListener("click", EventHandler.hideCommonPrefixComponents);
    globalInstancesMap.helpButton.addEventListener("click", EventHandler.showHelpModalBox);
    globalInstancesMap.partNumberSearcherButton.addEventListener("click", EventHandler.showPartNumberSearcherModalBox);
    globalInstancesMap.boardHistoryButton.addEventListener("click", BoardHistoryAdapter.showModalBox);
    globalInstancesMap.boardHistoryShowFailsButton.addEventListener("click", BoardHistoryAdapter.getMeasurementsJsonRequest);
    globalInstancesMap.unselectAllComponentsButton.addEventListener("click", WidgetAdapter.resetSelectedComponentsWidgets);

    globalInstancesMap.showDemoBoardButton.addEventListener("click", () => {
        EventHandler.loadDemoFile(loadedFileName);
    });
    
    globalInstancesMap.textModalInput.addEventListener("focus", () => {
        isTextModalInputFocused = true;
    });
    globalInstancesMap.textModalInput.addEventListener("blur", () => {
        isTextModalInputFocused = false;
    });

    globalInstancesMap.languagePickerButton.addEventListener("click", (e) => {
        e.stopPropagation();
        globalInstancesMap.languagePickerMenu.classList.toggle("show");
    });
}