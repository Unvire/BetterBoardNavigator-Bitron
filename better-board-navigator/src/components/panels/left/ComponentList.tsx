import { useBoardStore } from '../../../store/boardStore';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ComponentListProps {
  visibleItems: string[];
  hiddenItems: string[];
}


export default function ComponentList({ visibleItems, hiddenItems }: ComponentListProps) {
  const { t } = useTranslation();

  const { 
    boardData, isDarkMode, selectedComponents, inspectedComponents,
    currentSide, setCurrentSide, selectComponents, triggerFocus, 
    setInspectedComponents, highlightedPrefix, setHighlightedPrefix,
    partNumbers, hiddenComponents, toggleComponentVisibility 
  } = useBoardStore();

  const handleComponentClick = (e: React.MouseEvent, compName: string) => {
    const comp = boardData?.components[compName];
    if (comp && comp.side !== currentSide) {
      setCurrentSide(comp.side);
    }

    const isAlreadySelected = selectedComponents.has(compName);
    const isAlreadyInspected = inspectedComponents.includes(compName);

    if (e.ctrlKey || e.metaKey) {
      if (inspectedComponents.length > 0) setInspectedComponents([]); 
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

  const renderItem = (compName: string, forceHiddenStyle: boolean = false) => {
    const isSelected = selectedComponents.has(compName);
    const isInspected = inspectedComponents.includes(compName);
    const isHidden = hiddenComponents.has(compName) || forceHiddenStyle;

    let liClass = "px-3 py-1.5 rounded-md cursor-pointer transition-all border group flex items-center justify-between gap-2 ";
    if (isHidden) liClass += "opacity-50 ";

    if (isInspected) {
      liClass += isDarkMode 
        ? "border-cyan-500/50 bg-cyan-900/30 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]" 
        : "border-cyan-400 bg-cyan-50 text-cyan-700 font-bold shadow-sm";
    } else if (isSelected) {
      liClass += isDarkMode 
        ? "border-transparent bg-blue-600/30 text-blue-400 font-medium" 
        : "border-transparent bg-blue-200 text-blue-800 font-medium";
    } else {
      liClass += isDarkMode 
        ? "border-transparent hover:bg-slate-800 text-slate-300" 
        : "border-transparent hover:bg-slate-200/70 text-slate-700";
    }

    return (
      <li key={compName} onClick={(e) => handleComponentClick(e, compName)} className={liClass}>
        
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`font-semibold truncate ${isHidden ? "line-through opacity-70" : ""}`}>
            {compName}
          </span>
          {partNumbers?.[compName] && (
            <span className="text-[11px] opacity-50 font-mono shrink-0">
              {partNumbers[compName]}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleComponentVisibility(compName);
            }}
            className={`p-1 rounded-md transition-colors ${
              isHidden 
                ? 'text-rose-500 bg-rose-500/10' 
                : 'opacity-0 group-hover:opacity-100 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
            title={isHidden ? t('leftpanel.show_comp') : t('leftpanel.hide_comp')}
          >
            {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>

          <span className={`text-xs px-1.5 py-0.5 rounded ${boardData?.components[compName]?.side === 'T' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
            {boardData?.components[compName]?.side}
          </span>
        </div>
      </li>
    );
  };

  if (visibleItems.length === 0 && hiddenItems.length === 0) {
    return <div className="px-3 py-2 text-center opacity-50 text-xs">{t('leftpanel.no_data')}</div>;
  }

  return (
    <div className="flex flex-col h-full">
      
      <ul className="text-sm space-y-0.5 flex-1">
        {visibleItems.map(compName => renderItem(compName))}
      </ul>

      {hiddenItems.length > 0 && (
        <div className="mt-4 pt-2 border-t border-inherit shrink-0">
          <details className="group/details">
            <summary className="text-xs font-bold opacity-60 cursor-pointer p-2 hover:opacity-100 flex items-center justify-between outline-none">
              <span>{t('leftpanel.hidden_label')}: ({hiddenItems.length})</span>
            </summary>
            <ul className="mt-1 space-y-0.5">
              {hiddenItems.map(compName => renderItem(compName, true))}
            </ul>
          </details>
        </div>
      )}

    </div>
  );
}