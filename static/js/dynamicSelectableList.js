class AbstractDynamicList{
    constructor(parentContainer){
        this.parentContainer = parentContainer;
        this.selectionFunction = null;
        this.elements = [];
        this.callbackEventFunction = null;
        this.children = null;
    }

    set elementsList(list){
        this.elements = list;
    }

    set eventCallbackFuntion(eventFunction){
        this.callbackEventFunction = eventFunction;
    }

    set selectionMode(mode){
        this.selectionFunction = this.selectionModesMap[mode];
    }
    
    _bindOnClickEvent(itemDiv){
        this.selectionFunction(itemDiv);
        if (this.callbackEventFunction){
            this.callbackEventFunction(itemDiv);
        }
    }

    generateList(){
        this.clearList()

        this.elements.forEach(el => {
            const itemDiv = document.createElement("div");
            itemDiv.setAttribute("data-key", el);

            const itemChildParagraph = document.createElement("p");
            itemChildParagraph.innerText = el;
            
            itemDiv.appendChild(itemChildParagraph);
            this.parentContainer.appendChild(itemDiv);
            itemDiv.addEventListener("click", () => this._bindOnClickEvent(itemDiv));
        });

        this.children = this.parentContainer.querySelectorAll("div");
    }

    clearList(){
        this.parentContainer.innerHTML = "";
    }
}

class AllComponentDynamicSelectableList extends AbstractDynamicList{
    constructor(parentContainer){
        super(parentContainer);
        
        this.selectionModesMap = {"single": this.#singleSelectionMode, "multiple":this.#multipleSelectionMode};   
    }

    #singleSelectionMode(itemDiv){
        this.unselectAllItems();
        itemDiv.classList.add("selected");
    }

    #multipleSelectionMode(itemDiv){
        if (itemDiv.classList.contains("selected")){
            itemDiv.classList.remove("selected");
        } else {
            itemDiv.classList.add("selected");
        }
    }

    unselectAllItems(){
        this.children.forEach(el => el.classList.remove("selected"));
    }

    async selectItemByName(name){
        let potentialDiv = await this.parentContainer.querySelector(`div[data-key="${name}"]`);
        if (potentialDiv){
            this.selectionFunction(potentialDiv);
        }
    }

    get selectedItems(){
        selectedItems = [];
        this.children.forEach(el => {
            if (el.classList.contains("selected")){
                this.selectedItems.push(el);
            }
        });
        return this.selectedItems;
    }
}

class MarkedComponentSelectableList extends AbstractDynamicList{
    constructor(parentContainer){
        super(parentContainer);

        this.selectionModesMap = {"no": this.#noSelectionMode};   
    }

    #noSelectionMode(itemDiv){
    }
}