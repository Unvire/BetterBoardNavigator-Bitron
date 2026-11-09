import { useEffect, useRef } from 'react';
import { useBoardStore } from '../../../store/boardStore';
import { X } from 'lucide-react';

export default function NetList({ items }: { items: string[] }) {
  const { 
    selectedNet, selectNet, boardData, isDarkMode, 
    currentSide, setCurrentSide, selectedComponents, inspectedComponent, 
    selectComponents, setInspectedComponent, triggerFocus, highlightedPrefix, setHighlightedPrefix
  } = useBoardStore();

  const selectedNetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedNet) {
      setTimeout(() => {
        selectedNetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [selectedNet]);

  return (
    <ul className="text-sm space-y-0.5">
      {items.map(net => {
        const isSelected = selectedNet === net;
        return (
          <div key={net} className="flex flex-col gap-0.5" ref={isSelected ? selectedNetRef : null}>
            <li 
              onClick={() => selectNet(isSelected ? null : net)}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-all text-sm flex items-center justify-between ${
                isSelected
                  ? (isDarkMode ? 'bg-fuchsia-900/80 text-fuchsia-300 border-fuchsia-500/50 font-bold shadow-md' : 'bg-fuchsia-100/95 text-fuchsia-800 border-fuchsia-300 font-bold shadow-md')
                  : (isDarkMode ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
              } ${isSelected ? 'border' : 'border border-transparent'}`}
            >
              <span className="truncate">{net}</span>
              {isSelected && (
                <button 
                  onClick={(e) => { e.stopPropagation(); selectNet(null); }}
                  className="opacity-60 hover:opacity-100 p-0.5 rounded-full hover:bg-fuchsia-500/20 ml-2 shrink-0"
                >
                  <X size={14}/>
                </button>
              )}
            </li>

            {isSelected && (
              <div className={`ml-3 my-1 pl-2 border-l-2 space-y-1 max-h-[50vh] overflow-y-auto pr-1 ${isDarkMode ? 'border-fuchsia-900/50' : 'border-fuchsia-200'}`}>
                {(() => {
                  const pinsInNet: { comp: string, pin: string }[] = [];
                  if (boardData?.components) {
                    Object.entries(boardData.components).forEach(([compName, comp]) => {
                      if (comp.pins) {
                        Object.entries(comp.pins).forEach(([pinName, pin]) => {
                          if (pin.net === net) pinsInNet.push({ comp: compName, pin: pinName });
                        });
                      }
                    });
                  }
                  
                  if (pinsInNet.length === 0) return <div className="text-xs opacity-50 px-2 py-1">Brak zdefiniowanych padów</div>;

                  return pinsInNet.sort((a, b) => a.comp.localeCompare(b.comp, undefined, { numeric: true })).map(({ comp, pin }, idx) => {
                    const isCompSelected = selectedComponents.has(comp);
                    const isCompInspected = inspectedComponent === comp;
                    
                    return (
                      <button
                        key={`${comp}-${pin}-${idx}`}
                        onClick={(e) => {
                          const targetComp = boardData?.components[comp];
                          if (targetComp && targetComp.side !== currentSide) {
                            setCurrentSide(targetComp.side);
                          }
                          if (e.ctrlKey || e.metaKey) {
                            if (inspectedComponent) setInspectedComponent(null);
                            if (highlightedPrefix) setHighlightedPrefix(null);
                            selectComponents([comp], true);
                          } else {
                            if (isCompInspected) setInspectedComponent(null);
                            else {
                              setInspectedComponent(comp);
                              if (!isCompSelected) triggerFocus(comp);
                            }
                          }
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                          isCompInspected
                            ? (isDarkMode ? 'bg-cyan-900/40 text-cyan-300 font-bold' : 'bg-cyan-100 text-cyan-800 font-bold')
                            : isCompSelected
                              ? (isDarkMode ? 'bg-rose-900/30 text-rose-300' : 'bg-rose-100 text-rose-700')
                              : (isDarkMode ? 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-900/20' : 'text-slate-500 hover:text-cyan-700 hover:bg-cyan-50')
                        }`}
                      >
                        <span className={`truncate ${isCompInspected || isCompSelected ? "font-bold" : "font-medium"}`}>{comp}</span>
                        <span className="opacity-70 font-mono shrink-0 ml-2">Pin: {pin}</span>
                      </button>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        );
      })}
    </ul>
  );
}