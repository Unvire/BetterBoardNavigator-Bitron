class PythonConfigurator{
    static async configurePythonPath(pyodide){
        await pyodide.runPythonAsync(`
            import sys
            sys.path.append('/')

            engine = None

            from js import document
            canvas = document.getElementById('canvas')
        `);
    }

    static async loadPygame(pyodide){
        await pyodide.loadPackage("micropip");
        const micropip = pyodide.pyimport("micropip");
        await micropip.install("pygame-ce");
        
        await pyodide.runPythonAsync(`
            import pygame
        `);
    }

    static async loadLocalModules(pyodide) {
        async function copyModuleToVirtualMemory(pyodide, moduleName){
            const baseURL = window.location.href;
            
            const response = await fetch(baseURL + `static/python/${moduleName}.py`);
            const moduleCode = await response.text();
            pyodide.FS.writeFile(`/${moduleName}.py`, moduleCode);
        }

        const modulesList = ['geometryObjects', 'abstractShape', 'pin', 'component', 'board', 'unlzw3', 
                            'camcadLoader', 'gencadLoader', 'odbPlusPlusLoader', 'visecadLoader',
                            'loaderSelectorFactory','boardWrapper', 'pygameDrawBoard']
        
        for (const moduleName of modulesList) {
            await copyModuleToVirtualMemory(pyodide, moduleName);
        }

        LoadingScreen.hideLoadingDots();
        LoadingScreen.setLoadingScreenMessage("Application initialized. Load a schematic file!")
    }
}
