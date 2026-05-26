class SideHandler{
    constructor(){
        this.isSideBottom = true;
        this.sideMap = {true: "B", false: "T"};
    }

    currentSide(){
        return this.sideMap[this.isSideBottom];
    }

    changeSide(){            
        this.isSideBottom = !(this.isSideBottom);

        const currentSideSpan = globalInstancesMap.currentSideSpan;
        currentSideSpan.innerText = this.currentSide();
        
        return this.currentSide();
    }

    async getSideOfComponent(componentName){
        await pyodide.runPythonAsync(`
            componentSide = engine.getSideOfComponent("${componentName}")
        `);
        return pyodide.globals.get("componentSide");
    }

    async setComponentSideAsCurrentSide(componentName){
        const componentSide = await this.getSideOfComponent(componentName);
        if (componentSide != this.currentSide()){
            return this.changeSide();
        }
        return this.currentSide();
    }
}