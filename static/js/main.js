function main(){
    LoadingScreen.showLoadingScreen();
    LoadingScreen.showLoadingDots();

    EventHandler.compensateUserDevicePixelRatio();


    document.addEventListener("DOMContentLoaded", async () => {
        _bindHtmlElements();
        _initWidgetClasses();
        
        await _initPyodide();

        _bindMouseAndKeyboardEvents();
        _bindLoadFilesEvents();
        _bindOnClickEvents();
    });
}


function _bindHtmlElements(){
    // buttons row
    globalInstancesMap.loadFilesButton = document.getElementById("load-files-button");
    globalInstancesMap.loadFilesInput = document.getElementById("load-files-input");

    globalInstancesMap.rotateButton = document.getElementById("rotate-button");
    globalInstancesMap.changeSideButton = document.getElementById("change-side-button");
    globalInstancesMap.mirrorSideButton = document.getElementById("mirror-side-button");
    globalInstancesMap.toggleOutlinesButton = document.getElementById("toggle-outlines-button");

    globalInstancesMap.resetViewButton = document.getElementById("default-view-button");    
    globalInstancesMap.areaFromComponentsButton = document.getElementById("components-area-button");

    globalInstancesMap.partNumberSearcherButton = document.getElementById("part-number-searcher-button");
    globalInstancesMap.partNumberSearcherIframe = document.getElementById("part-number-searcher-iframe");
    globalInstancesMap.boardHistoryButton = document.getElementById("board-history-button");
    globalInstancesMap.boardHistoryIframe = document.getElementById("board-history-iframe");

    globalInstancesMap.clearMarkersButton = document.getElementById("unselect-components-button");
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
    
    const modalHelp = new ModalHelp(
        globalInstancesMap.helpModalContainer, 
        globalInstancesMap.helpModalCloseSpan, 
        globalInstancesMap.helpModalHeader, 
        globalInstancesMap.showDemoBoardButton
    );
    modalHelp.eventParameter = loadedFileName;
    modalHelp.setButtonEvent(EventHandler.loadDemoFile);
    globalInstancesMap.modalHelp = modalHelp;

    const modalPartNumberSearcher = new ModalPartNumberSearcher(
        globalInstancesMap.partNumberModalContainer, 
        globalInstancesMap.partNumberModalCloseSpan, 
        globalInstancesMap.partNumberModalHeader
    );
    globalInstancesMap.modalPartNumberSearcher = modalPartNumberSearcher;

    const modalBoardHistory = new ModalBoardHistory(
        globalInstancesMap.boardHistoryModalContainer,
        globalInstancesMap.boardHistoryCloseSpan,
        globalInstancesMap.boardHistoryModalHeader,
        globalInstancesMap.boardHistoryShowFailsButton
    );
    globalInstancesMap.modalBoardHistory = modalBoardHistory;


    const allComponentsList = DynamicSelectableListAdapter.initDynamicSelectableList(globalInstancesMap.allComponentsContainer);
    globalInstancesMap.allComponentsList = allComponentsList;

    const markedComponentsList = DynamicSelectableListAdapter.initDynamicSelectableList(globalInstancesMap.markedComponentsContainer);
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

function _bindLoadFilesEvents(){
    globalInstancesMap.loadFilesButton.addEventListener("click", () => {
            globalInstancesMap.loadFilesInput.click();
    });
    globalInstancesMap.loadFilesInput.addEventListener("change", (event) => {
        const files = [...event.target.files];

        const cadFile = files.find(f =>
            /\.(cad|gcd|tgz|zip)$/i.test(f.name)
        );

        const pdfFile = files.find(f =>
            /\.pdf$/i.test(f.name)
        );


        if (!cadFile) {
            alert("Musisz wybrać plik ze schematem płytki");
            return;
        }

        EventHandler.loadCadFile(cadFile);
        if (pdfFile) {
            EventHandler.loadPdfFile(pdfFile);
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
    globalInstancesMap.clearMarkersButton.addEventListener("click", EngineAdapter.clearMarkers);
    globalInstancesMap.unselectNetButton.addEventListener("click", EventHandler.unselectNet);            
    globalInstancesMap.findComponentUsingNameButton.addEventListener("click", EventHandler.findComponentUsingName);
    globalInstancesMap.prefixComponentsButton.addEventListener("click", EventHandler.showCommonPrefixComponents);
    globalInstancesMap.unselectPrefixComponentsButton.addEventListener("click", EventHandler.hideCommonPrefixComponents);
    globalInstancesMap.helpButton.addEventListener("click", EventHandler.showHelpModalBox);
    globalInstancesMap.partNumberSearcherButton.addEventListener("click", EventHandler.showPartNumberSearcherModalBox);
    globalInstancesMap.boardHistoryButton.addEventListener("click", EventHandler.showBoardHistoryModalBox);
    
    globalInstancesMap.textModalInput.addEventListener("focus", () => {
        isTextModalInputFocused = true;
    });
    globalInstancesMap.textModalInput.addEventListener("blur", () => {
        isTextModalInputFocused = false;
        });
}