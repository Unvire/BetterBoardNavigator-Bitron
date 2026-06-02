class CadFileLoader{
    static async openAndLoadCadFile(pyodide, file){
        const fileName = `/${file.name}`;
        
        const lang = document.documentElement.lang;
        const loadingMessage = translationsDict[lang]?.["js-loading-screen-in-progress"] || "Przetwarzanie schematu";
        LoadingScreen.setLoadingScreenMessage(loadingMessage);
        LoadingScreen.showLoadingDots();

        try {
            const fileContent = await file.arrayBuffer();

            pyodide.FS.writeFile(fileName, new Uint8Array(fileContent));
            
            const sideHandler = globalInstancesMap.sideHandler;
            const side = sideHandler.currentSide();

            
            await pyodide.runPythonAsync(`
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

            const allComponentsProxy = pyodide.globals.get("allComponents");
            const allComponents = allComponentsProxy.toJs();
            allComponentsProxy.destroy();

            DynamicSelectableListAdapter.generateList(globalInstancesMap.allComponentsList, allComponents, DynamicSelectableListAdapter.selectItemFromListEvent, "single");

            const netsMapProxy = pyodide.globals.get("netsDict");
            const netsMap = netsMapProxy.toJs();
            netsMapProxy.destroy();
            TreeViewAdapter.generateTreeView(netsMap);
            
            mostCommonPrefix = pyodide.globals.get("mostCommonPrefix");

            WidgetAdapter.resetWidgets();

            const toggleOutlinesButton = globalInstancesMap.toggleOutlinesButton;
            toggleOutlinesButton.classList.add("button-selected");

        } catch (error) {
            const lang = document.documentElement.lang;
            const alertMessage = translationsDict[lang]?.["js-no-ip-adress-alert"] || "Błąd podczas przetwarzania pliku CAD przez Pyodide:";

            console.error(alertMessage, error);

        } finally {
            LoadingScreen.hideLoadingDots();
            LoadingScreen.hideLoadingScreen();
        }
    }

    static removeAllCadFilesFromFS(pyodide) {
        const pydodideFiles = pyodide.FS.readdir("/");
        
        pydodideFiles.forEach(fileName => {
            if (/\.(cad|gcd|tgz|zip)$/i.test(fileName)) {
                try {
                    pyodide.FS.unlink(`/${fileName}`);
                } catch (error) {
                    console.warn(`Removing file ${fileName} from Virtual File System error:`, error);
                }
            }
        });
    }
}
