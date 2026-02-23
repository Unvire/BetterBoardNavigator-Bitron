function main(){
    LoadingScreen.showLoadingScreen();
    LoadingScreen.showLoadingDots();

    EventHandler.compensateUserDevicePixelRatio();


    document.addEventListener("DOMContentLoaded", async () => {
        _bindHtmlElements();
        _initWidgetClasses();
        
        pyodide = await loadPyodide();
        await PythonConfigurator.configurePythonPath(pyodide);                      
        await PythonConfigurator.loadPygame(pyodide);            
        await PythonConfigurator.loadLocalModules(pyodide);

        pyodide.canvas.setCanvas2D(canvas);
        EventHandler.setCanvasDimensions();
        
        globalInstancesMap.loadFileButton.disabled = false;
        globalInstancesMap.helpButton.disabled = false;

        /* EVENTS */
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

        globalInstancesMap.loadFileButton.addEventListener("click", () => {
            globalInstancesMap.loadFileInput.click();
        });
        globalInstancesMap.loadFileInput.addEventListener("change", (event) => {
            globalInstancesMap.loadedFileName = EventHandler.loadFile(event, loadedFileName);
        });

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
        
        globalInstancesMap.textModalInput.addEventListener("focus", () => {
            isTextModalInputFocused = true;
        });
        globalInstancesMap.textModalInput.addEventListener("blur", () => {
            isTextModalInputFocused = false;
        });
    });
}


function _bindHtmlElements(){
    globalInstancesMap.canvas = document.getElementById("canvas");
    globalInstancesMap.canvasParent = document.getElementById("item-center");
    globalInstancesMap.loadFileButton = document.getElementById("load-file-button");
    globalInstancesMap.loadFileInput = document.getElementById("load-file-input");
    globalInstancesMap.changeSideButton = document.getElementById("change-side-button");
    globalInstancesMap.rotateButton = document.getElementById("rotate-button");
    globalInstancesMap.mirrorSideButton = document.getElementById("mirror-side-button");
    globalInstancesMap.toggleOutlinesButton = document.getElementById("toggle-outlines-button");
    globalInstancesMap.resetViewButton = document.getElementById("default-view-button");    
    globalInstancesMap.areaFromComponentsButton = document.getElementById("components-area-button");
    globalInstancesMap.clickedComponentContainer = document.getElementById("clicked-components");
    globalInstancesMap.allComponentsContainer = document.getElementById("scrollable-all-components-list");
    globalInstancesMap.preserveComponentMarkersButton = document.getElementById("toggle-leave-markers-button");
    globalInstancesMap.clearMarkersButton = document.getElementById("unselect-components-button");
    globalInstancesMap.markedComponentsContainer = document.getElementById("scrollable-marked-components-list");
    globalInstancesMap.pinoutTableContainer = document.getElementById("pinout-table");
    globalInstancesMap.netTreeviewContainer = document.getElementById("net-treeview");
    globalInstancesMap.unselectNetButton = document.getElementById("unselect-net-button");
    globalInstancesMap.currentSideSpan = document.getElementById("current-side-span");
    globalInstancesMap.findComponentUsingNameButton = document.getElementById("find-component-by-name-button");
    globalInstancesMap.prefixComponentsButton = document.getElementById("prefix-components-button");
    globalInstancesMap.unselectPrefixComponentsButton = document.getElementById("unselect-prefix-components-button");
    globalInstancesMap.commonPrefixSpan = document.getElementById("common-prefix-span");
    globalInstancesMap.selectedComponentSpan = document.getElementById("selected-component-span");
    globalInstancesMap.helpButton = document.getElementById("help-button");

    globalInstancesMap.textModalContainer = document.getElementById("text-modal");
    globalInstancesMap.textModalCloseSpan = document.getElementById("text-modal-close-span");
    globalInstancesMap.textModalPromptHeader = document.getElementById("text-modal-header");
    globalInstancesMap.textModalInput = document.getElementById("text-modal-input");
    globalInstancesMap.textModalSubmitButton = document.getElementById("text-modal-submit-text");

    globalInstancesMap.helpModalContainer = document.getElementById("help-modal");
    globalInstancesMap.helpModalCloseSpan = document.getElementById("help-modal-close-span");
    globalInstancesMap.helpModalHeader = document.getElementById("help-modal-header");
    globalInstancesMap.showDemoBoardButton = document.getElementById("show-demo-board-button");
}

function _initWidgetClasses(){
    const modalSubmit = new ModalSubmit(globalInstancesMap.textModalContainer, globalInstancesMap.textModalCloseSpan, 
        globalInstancesMap.textModalPromptHeader, globalInstancesMap.textModalInput, globalInstancesMap.textModalSubmitButton);
    globalInstancesMap.modalSubmit = modalSubmit;
    
    const modalHelp = new ModalHelp(globalInstancesMap.helpModalContainer, globalInstancesMap.helpModalCloseSpan, 
        globalInstancesMap.helpModalHeader, globalInstancesMap.showDemoBoardButton);
    modalHelp.eventParameter = loadedFileName;
    modalHelp.setButtonEvent(EventHandler.loadDemoFile);
    globalInstancesMap.modalHelp = modalHelp;


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
}