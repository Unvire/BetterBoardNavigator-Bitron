class CadFileLoader{
    static openAndLoadCadFile(pyodide, file) {
        const fileName = `/${file.name}`;
        const reader = new FileReader();

        const lang = document.documentElement.lang;
        const loadingMessage = translationsDict[lang]?.["js-loading-screen-in-progress"] || "Przetwarzanie schematu";
        LoadingScreen.setLoadingScreenMessage(loadingMessage);
        LoadingScreen.showLoadingDots();

        reader.onload = (event) => {
            const fileContent = event.target.result;
            pyodide.FS.writeFile(fileName, new Uint8Array(fileContent));
            
            const sideHandler = globalInstancesMap.sideHandler;
            const side = sideHandler.currentSide();

            pyodide.runPython(`
                from boardWrapper import BoardWrapper
                from pygameDrawBoard import DrawBoardEngine

                cadFileName = "${fileName}"

                wrapper = BoardWrapper(canvas.width, canvas.height)
                wrapper.loadAndSetBoardFromFilePath(cadFileName)
                boardInstance = wrapper.normalizeBoard()

                pygame.init()
                pygame.display.set_caption("Better Board Navigator")

                SURFACE = pygame.display.set_mode((canvas.width, canvas.height))

                engine = DrawBoardEngine(canvas.width, canvas.height)
                engine.setBoardData(boardInstance)

                allComponents = engine.getComponents()
                netsDict = engine.getNets()

                engine.drawChunksAndBlitInterface(SURFACE, "${side}")
                pygame.display.flip()

                mostCommonPrefix = engine.getMostCommonPrefix()
            `);
            const allComponents = pyodide.globals.get("allComponents").toJs();
            DynamicSelectableListAdapter.generateList(globalInstancesMap.allComponentsList, allComponents, DynamicSelectableListAdapter.selectItemFromListEvent, "single");

            const netsMap = pyodide.globals.get("netsDict").toJs();
            TreeViewAdapter.generateTreeView(netsMap);
            
            mostCommonPrefix = pyodide.globals.get("mostCommonPrefix");

            WidgetAdapter.resetWidgets();

            const toggleOutlinesButton = globalInstancesMap.toggleOutlinesButton;
            toggleOutlinesButton.classList.add("button-selected");

            LoadingScreen.hideLoadingDots();
            LoadingScreen.hideLoadingScreen();
        }
        reader.readAsArrayBuffer(file);
    }

    static removePreviousFileFromFS(pyodide, fileName){
        const pydodideFiles = pyodide.FS.readdir("/");
        if (pydodideFiles.includes(fileName)){
            pyodide.FS.unlink(`/${fileName}`);
        }
    }
}
