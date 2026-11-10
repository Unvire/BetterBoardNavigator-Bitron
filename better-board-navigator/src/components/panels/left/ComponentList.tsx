import { useBoardStore } from '../../../store/boardStore';

export default function ComponentList({ items }: { items: string[] }) {
  const { 
    boardData, isDarkMode, selectedComponents, inspectedComponents,
    currentSide, setCurrentSide, selectComponents, triggerFocus, 
    setInspectedComponents, highlightedPrefix, setHighlightedPrefix
  } = useBoardStore();

  const handleComponentClick = (e: React.MouseEvent, compName: string) => {
    const comp = boardData?.components[compName];
    if (comp && comp.side !== currentSide) {
      setCurrentSide(comp.side);
    }

    const isAlreadySelected = selectedComponents.has(compName);
    const isAlreadyInspected = inspectedComponents.includes(compName);

    if (e.ctrlKey || e.metaKey) {
      if (inspectedComponents) setInspectedComponents([]); 
      if (highlightedPrefix) setHighlightedPrefix(null);
      
      selectComponents([compName], true);
      if (!isAlreadySelected) triggerFocus(compName);
    } else {
      if (isAlreadyInspected) setInspectedComponents([]);
      else {
        setInspectedComponents([compName]);
        triggerFocus(compName);
      }
    }
  };

  if (items.length === 0) {
    return <div className="px-3 py-2 text-center opacity-50 text-xs">Brak wyników</div>;
  }

  return (
    <ul className="text-sm space-y-0.5">
      {items.map(compName => {
        const isSelected = selectedComponents.has(compName);
        const isInspected = inspectedComponents.includes(compName);

        let liClass = "px-3 py-1.5 rounded-md cursor-pointer flex justify-between items-center transition-all border ";
        if (isInspected) {
          liClass += isDarkMode ? "border-cyan-500/50 bg-cyan-900/30 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "border-cyan-400 bg-cyan-50 text-cyan-700 font-bold shadow-sm";
        } else if (isSelected) {
          liClass += isDarkMode ? "border-transparent bg-blue-600/30 text-blue-400 font-medium" : "border-transparent bg-blue-200 text-blue-800 font-medium";
        } else {
          liClass += isDarkMode ? "border-transparent hover:bg-slate-800 text-slate-300" : "border-transparent hover:bg-slate-200/70 text-slate-700";
        }

        return (
          <li key={compName} onClick={(e) => handleComponentClick(e, compName)} className={liClass}>
            <span>{compName}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${boardData?.components[compName]?.side === 'T' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
              {boardData?.components[compName]?.side}
            </span>
          </li>
        );
      })}
    </ul>
  );
}