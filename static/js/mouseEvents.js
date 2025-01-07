let isMousePressed = false;
let isMouseClickedFirstTime = false;
let isFindComponentByClickActive = true;
let isSelectionModeSingle = true;

function mouseUpEvent(){
    isMousePressed = false;
}

function mouseDownEvent(event){
    isMousePressed = true;
    isMouseClickedFirstTime = true;
    
    if (isFindComponentByClickActive){        
        const x = event.offsetX; 
        const y = event.offsetY;
        
        let clickedComponents = EngineAdapter.findClickedComponents(x, y, isSelectionModeSingle);
        SpanListAdapter.generateSpanList(clickedComponents);
    }
}

async function mouseMoveEvent(event){
    if (isMousePressed){
        if (!isMouseClickedFirstTime){
            const x = event.movementX; 
            const y = event.movementY;
            EngineAdapter.moveBoard(x, y);
        } else {
            isMouseClickedFirstTime = false;
        }
    }
}

function toggleFindComponentByClickEvent(){
    isFindComponentByClickActive = !isFindComponentByClickActive;
    EventHandler.toggleButton(toggleFindComponentByClickButton);
}