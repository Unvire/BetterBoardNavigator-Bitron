class MouseEventHandler{
    static mouseUpEvent(){
        isMousePressed = false;
    }

    static async mouseDownEvent(event){
        isMousePressed = true;
        isMouseClickedFirstTime = true;
            
        const x = event.offsetX; 
        const y = event.offsetY;
        
        let clickedComponents = await EngineAdapter.findClickedComponents(x, y, isSelectionModeSingle);
        SpanListAdapter.generateSpanList(clickedComponents);
    }

    static async mouseMoveEvent(event){
        if (isMousePressed){
            if (!isMouseClickedFirstTime){
                const x = event.movementX; 
                const y = event.movementY;
                await EngineAdapter.moveBoard(x, y);
            } else {
                isMouseClickedFirstTime = false;
            }
        }
    }
}