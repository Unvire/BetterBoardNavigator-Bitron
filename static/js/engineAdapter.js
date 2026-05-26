class EngineAdapter{
    static async resizeBoard(){
        const sideHandler = globalInstancesMap.sideHandler;

        EventHandler.setCanvasDimensions();
        const side = sideHandler.currentSide();
        await pyodide.runPythonAsync(`
            if engine:
                engine.changeScreenDimensionsInterface(SURFACE, [canvas.width, canvas.height], "${side}")
                pygame.display.flip()
        `);
    }

    static async rotateBoard(){
        const sideHandler = globalInstancesMap.sideHandler;

        const side = sideHandler.currentSide();
        await pyodide.runPythonAsync(`
            engine.rotateBoardInterface(SURFACE, isClockwise=True, side="${side}", angleDeg=90)
            pygame.display.flip()
        `);
    }

    static async findClickedComponents(x, y){        
        const sideHandler = globalInstancesMap.sideHandler;

        const side = sideHandler.currentSide();
        await pyodide.runPythonAsync(`
            clickedComponents = []
            if engine:
                clickedXY = [int("${x}"), int("${y}")]
                clickedComponents = engine.findComponentByClick(clickedXY, "${side}")
            clickedComponents = []
            if engine:
                clickedXY = [int("${x}"), int("${y}")]
                clickedComponents = engine.findComponentByClick(clickedXY, "${side}")
        `);
        return pyodide.globals.get("clickedComponents").toJs();
    }

    static async moveBoard(x, y){        
        const sideHandler = globalInstancesMap.sideHandler;

        const side = sideHandler.currentSide();
        await pyodide.runPythonAsync(`
            if engine:
                deltaVector = [int("${x}"), int("${y}")]
                engine.moveBoardInterface(SURFACE, deltaVector, "${side}")
                pygame.display.flip()
        `);
    }

    static async zoomInOut(event){        
        const sideHandler = globalInstancesMap.sideHandler;

        const x = event.offsetX; 
        const y = event.offsetY;
        const isZoomIn = event.deltaY < 0;
        
        const side = sideHandler.currentSide();
        await pyodide.runPythonAsync(`
            if engine:
                pointXY = [int("${x}"), int("${y}")]
                isScaleUp = "${isZoomIn}" == "true"
                engine.scaleUpDownInterface(SURFACE, isScaleUp=isScaleUp, pointXY=pointXY, side="${side}")
                pygame.display.flip()
        `);
    }

    static async changeSide(){
        const sideHandler = globalInstancesMap.sideHandler;

        const side = sideHandler.changeSide();
        await pyodide.runPythonAsync(`
            engine.changeSideInterface(SURFACE, "${side}")
            pygame.display.flip()
        `);
    }

    static async mirrorSide(){
        const sideHandler = globalInstancesMap.sideHandler;
        
        const side = sideHandler.currentSide();
        await pyodide.runPythonAsync(`
            engine.flipUnflipCurrentSideInterface(SURFACE, "${side}")
            pygame.display.flip()
        `);
    }

    static async toggleOutlines(){
        const sideHandler = globalInstancesMap.sideHandler;

        const side = sideHandler.currentSide();
        await pyodide.runPythonAsync(`
            engine.showHideOutlinesInterface(SURFACE, "${side}")
            pygame.display.flip()
        `);
    }

    static async toggleComponentNames(){
        const sideHandler = globalInstancesMap.sideHandler;

        const side = sideHandler.currentSide();
        await pyodide.runPythonAsync(`
            engine.showHideComponentNamesInterface(SURFACE, "${side}")
            pygame.display.flip()
        `);
    }

    static async resetView(){
        const sideHandler = globalInstancesMap.sideHandler;

        const side = sideHandler.currentSide();
        await pyodide.runPythonAsync(`
            engine.resetToDefaultViewInterface(SURFACE, "${side}")
            pygame.display.flip()
        `);
        WidgetAdapter.resetWidgets();
    }

    static async areaFromComponents(){
        const sideHandler = globalInstancesMap.sideHandler;

        const side = sideHandler.currentSide();
        await pyodide.runPythonAsync(`
            engine.useComponentAreaInterface(SURFACE, "${side}")
            pygame.display.flip()
        `);
        WidgetAdapter.resetWidgets();
    }

    static async clearMarkers(){
        const sideHandler = globalInstancesMap.sideHandler;

        const side = sideHandler.currentSide();
        await pyodide.runPythonAsync(`
            engine.clearFindComponentByNameInterface(SURFACE, "${side}")
            pygame.display.flip()
        `);
    }

    static async componentInScreenCenter(componentName){
        const sideHandler = globalInstancesMap.sideHandler;

        const side = await sideHandler.setComponentSideAsCurrentSide(componentName);
        await pyodide.runPythonAsync(`
            engine.componentInScreenCenterInterface(SURFACE, "${componentName}", "${side}")
            pygame.display.flip()
        `);
    }

    static async selectNet(netName){
        const sideHandler = globalInstancesMap.sideHandler;

        const side = sideHandler.currentSide();
        await pyodide.runPythonAsync(`
            engine.selectNetByNameInterface(SURFACE, "${netName}", "${side}")
            pygame.display.flip()
        `);
    }

    static async selectNetComponentByName(componentName){
        const sideHandler = globalInstancesMap.sideHandler;

        const side = await sideHandler.setComponentSideAsCurrentSide(componentName);
        await pyodide.runPythonAsync(`
            engine.selectNetComponentByNameInterface(SURFACE, "${componentName}", "${side}")
            pygame.display.flip()
        `);
        await EngineAdapter.componentInScreenCenter(componentName);
    }

    static async unselectNet(){
        const sideHandler = globalInstancesMap.sideHandler;

        const side = sideHandler.currentSide();
        await pyodide.runPythonAsync(`
            engine.unselectNetInterface(SURFACE, "${side}")
            pygame.display.flip()
        `);
    }

    static async showCommonPrefixComponents(prefix){
        const sideHandler = globalInstancesMap.sideHandler;
        
        const side = sideHandler.currentSide();
        await pyodide.runPythonAsync(`
            isPrefixExist = engine.checkIfPrefixExists("${prefix}")

            if isPrefixExist:
                engine.showCommonTypeComponentsInterface(SURFACE, "${prefix}", "${side}")
                pygame.display.flip()
        `);
        return pyodide.globals.get("isPrefixExist");
    }

    static async hideCommonPrefixComponents(){
        const sideHandler = globalInstancesMap.sideHandler;

        const side = sideHandler.currentSide();
        await pyodide.runPythonAsync(`
            engine.clearCommonTypeComponentsInterface(SURFACE, "${side}")
            pygame.display.flip()
        `);
    }

    static async findComponentByName(componentName){
        const sideHandler = globalInstancesMap.sideHandler;
        
        const componentSide = await sideHandler.getSideOfComponent(componentName);
        if (!componentSide){
            return false;
        }
        
        const side = await sideHandler.setComponentSideAsCurrentSide(componentName);
        await pyodide.runPythonAsync(`
            if "${isSelectionModeSingle}" == "true":
                engine.clearFindComponentByNameInterface(SURFACE, "${side}")
                
            engine.findComponentByNameInterface(SURFACE, "${componentName}", "${side}")
            pygame.display.flip()
        `);
        return true;
    }
}