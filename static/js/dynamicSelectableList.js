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
            const itemDiv = this._createItemNode(el);
            this.parentContainer.appendChild(itemDiv);
        });

        this.children = this.parentContainer.querySelectorAll("div");
    }

    includes(element){
        return this.elements.includes(element);
    }

    clearList(){
        this.parentContainer.innerHTML = "";
    }

    _createItemNode(el) {
        const itemDiv = document.createElement("div");
        itemDiv.setAttribute("data-key", el);

        const itemChildParagraph = document.createElement("p");
        itemChildParagraph.innerText = el;
        
        itemDiv.appendChild(itemChildParagraph);
        itemDiv.addEventListener("click", () => this._bindOnClickEvent(itemDiv));
        
        return itemDiv;
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
        if (!itemDiv.classList.contains("selected")){
            itemDiv.classList.add("selected");
        }
    }

    unselectAllItems(){
        this.children.forEach(el => el.classList.remove("selected"));
    }

    selectItemByName(name){
        let potentialDiv = this.parentContainer.querySelector(`div[data-key="${name}"]`);
        if (potentialDiv){
            this.selectionFunction(potentialDiv);
        }
    }

    unselectItemByName(name) {
        const item = this.parentContainer.querySelector(`div[data-key="${name}"]`);
            if (item) {
                item.classList.remove("selected");
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
        this.onCloseIconClick = null;  
    }

    #noSelectionMode(itemDiv){
    }

    _createItemNode(el) {
        const itemDiv = super._createItemNode(el);
        itemDiv.classList.add("flex-list-item");

        const closeSpan = document.createElement("span");
        closeSpan.className = "close";
        closeSpan.innerHTML = "&times;";

        closeSpan.addEventListener("click", (event) => {
            event.stopPropagation();

            const value = el;
            if (this.onCloseIconClick) {
                this.onCloseIconClick(value);
            }
        });

        itemDiv.appendChild(closeSpan);
        return itemDiv;
    }
}