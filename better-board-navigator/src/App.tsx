import { useEffect, useState, useMemo } from 'react';
import { useBoardStore } from './store/boardStore';
import BoardCanvas from './components/canvas/BoardCanvas'; 
import { 
  Upload, RotateCw, FlipHorizontal, Maximize, 
  Settings2, HelpCircle, Layers, Search, Cpu, List, X, PanelLeftClose, PanelLeftOpen, Sun, Moon,
  ChevronRight, ArrowLeft
} from 'lucide-react';

function App() {
  const { 
    boardData, setBoardData, isDarkMode, toggleDarkMode, 
    selectedComponents, selectComponents, clearSelection, 
    selectedNet, selectNet, triggerFocus,
    currentSide, setCurrentSide, isMirrored, setIsMirrored,
    inspectedComponent, setInspectedComponent
   } = useBoardStore();

  const [isLoading, setIsLoading] = useState(true);

  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'components' | 'nets'>('components');

  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  const selectedNames = Array.from(selectedComponents);
  const isPanelOpen = selectedNames.length > 0 || inspectedComponent !== null;

  const compToShow = inspectedComponent || (selectedNames.length === 1 ? selectedNames[0] : null);


  const handleComponentClick = (e: React.MouseEvent, compName: string) => {
    const comp = boardData?.components[compName];

    if (comp && comp.side !== currentSide) {
      setCurrentSide(comp.side);
      setIsMirrored(comp.side === 'B');
    }

    const isAlreadySelected = selectedComponents.has(compName);
    const isAlreadyInspected = inspectedComponent === compName;

    // ctrl + left click
    if (e.ctrlKey || e.metaKey) {
      if (isAlreadyInspected) setInspectedComponent(null); 
      selectComponents([compName], true);
      if (!isAlreadySelected) triggerFocus(compName);
    
      // left click
    } else {
      if (isAlreadyInspected) setInspectedComponent(null);
      else {
        setInspectedComponent(compName);
        triggerFocus(compName);
      }
    }
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (inspectedComponent) setInspectedComponent(null);
        else {
          clearSelection();
          selectNet(null);
        }; 
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection, inspectedComponent, setInspectedComponent]);


  useEffect(() => {
    async function loadMockData() {
      try {
        const res = await fetch('/mockBoard.json');
        if (res.ok) {
          const data = await res.json();
          setBoardData(data);
        }

      } catch (err) {
        console.error('Error parsing mockBoard.json', err);

      } finally {
        setIsLoading(false);
      }
    }

    loadMockData();
  }, [setBoardData]);


  const availableNets = useMemo(() => {
    if (!boardData) return [];

    const nets = new Set<string>();
    Object.values(boardData.components).forEach(comp => {
      if (comp.pins) {
        Object.values(comp.pins).forEach(pin => {
          if (pin.net) nets.add(pin.net);
        });
      }
    });

    return Array.from(nets).sort();
  }, [boardData]);


  const filteredComponents = useMemo(() => {
    if (!boardData) return [];

    const q = searchQuery.toLowerCase();
    return Object.keys(boardData.components)
      .filter(name => name.toLowerCase().includes(q))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [boardData, searchQuery]);

  const filteredNets = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return availableNets.filter(net => net.toLowerCase().includes(q));
  }, [availableNets, searchQuery])

  if (isLoading) {
    return (
      <div className={`flex h-screen w-screen items-center justify-center ${isDarkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-300 text-slate-700'}`}>
        <p className="text-xl animate-pulse flex items-center gap-3">
          <Layers className="animate-spin" /> Initializing 2D environment...
        </p>
      </div>
    );
  }

  const glassPanelClass = `absolute top-16 bottom-4 rounded-xl border shadow-lg flex flex-col transition-transform duration-300 z-10 backdrop-blur-xl overflow-hidden ` + 
    (isDarkMode ? 'bg-slate-900/85 border-slate-700 text-slate-300' : 'bg-white/95 border-slate-200 text-slate-700');

  const topBarBtnClass = "p-2 rounded-lg transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1";

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
      
      {/* LAYER 0: CANVAS - background */}
      <div className="absolute inset-0 z-0">
        <BoardCanvas />
      </div>

      {/* LAYER 1: FLOATING UI */}
      {/* TOP BAR - buttons */}
      <header className={`absolute top-0 left-0 right-0 h-12 px-4 flex items-center justify-between z-20 backdrop-blur-sm border-b shadow-sm ${isDarkMode ? 'bg-slate-900/80 border-slate-800 text-slate-200' : 'bg-slate-50/90 border-slate-300 text-slate-800'}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)} className={topBarBtnClass}>
            {isLeftPanelOpen ? <PanelLeftClose size={20}/> : <PanelLeftOpen size={20}/>}
          </button>
          <div className="font-bold text-lg flex items-center gap-2 tracking-tight">
            <span className="text-blue-500">Better</span> Board Navigator
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className={topBarBtnClass} title="Load File"><Upload size={18} /></button>
          
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-2"></div>

          <button 
            onClick={() => {
              const newSide = currentSide === 'T' ? 'B' : 'T';
              setCurrentSide(newSide);
              setIsMirrored(newSide === 'B');
            }} 
            className={topBarBtnClass} 
            title="Switch Side (Top/Bottom)"
          >
            <Layers size={18} className={currentSide === 'B' ? "text-amber-500" : "text-blue-500"}/>
            <span className="text-xs font-bold w-3">{currentSide}</span>
          </button>
          
          <button 
            onClick={() => setIsMirrored(!isMirrored)} 
            className={topBarBtnClass} 
            title="Flip Horizontally"
          >
            <FlipHorizontal size={18} className={isMirrored ? "text-blue-500" : ""} />
          </button>
          
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-2"></div>
          
          <button onClick={toggleDarkMode} className={topBarBtnClass} title="Toggle Theme">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className={topBarBtnClass} title="Settings"><Settings2 size={18} /></button>
          <button className={topBarBtnClass} title="Help"><HelpCircle size={18} /></button>
        </div>
      </header>


      {/* FLOATING LEFT PANEL - components and nets explorer */}
      <aside className={`${glassPanelClass} left-4 w-80`} style={{ transform: isLeftPanelOpen ? 'translateX(0)' : 'translateX(-120%)' }}>
        {/* Tabs */}
        <div className="flex border-b border-inherit shrink-0">
          <button onClick={() => setActiveTab('components')} className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'components' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-inherit opacity-70 hover:opacity-100'}`}>
            <Cpu size={16}/> Components
          </button>
          <button onClick={() => setActiveTab('nets')} className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'nets' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-inherit opacity-70 hover:opacity-100'}`}>
            <Layers size={16}/> Nets
          </button>
        </div>

        {/* Search bar */}
        <div className="p-3 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-md outline-none transition-all border ${
                isDarkMode 
                  ? 'bg-slate-950/50 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                  : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white hover:border-slate-300'
                }`
              }
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {activeTab === 'components' ? (
            <ul className="text-sm space-y-0.5">
              {filteredComponents.map(compName => {
                const isSelected = selectedComponents.has(compName);
                const isInspected = inspectedComponent === compName;

                let liClass = "px-3 py-1.5 rounded-md cursor-pointer flex justify-between items-center transition-all border ";
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
                  <li 
                    key={compName}
                    onClick={(e) => handleComponentClick(e, compName)}
                    className={liClass}
                  >
                    <span>{compName}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${boardData?.components[compName]?.side === 'T' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                      {boardData?.components[compName]?.side}
                    </span>
                  </li>
                );
              })}
              {filteredComponents.length === 0 && (
                <li className="px-3 py-2 text-center opacity-50 text-xs">Brak wyników</li>
              )}
            </ul>
          ) : (
            <ul className="text-sm space-y-0.5">
              {filteredNets.map(net => {
                const isSelected = selectedNet === net;
                return (
                  <li 
                    key={net}
                    onClick={() => selectNet(isSelected ? null : net)}
                    className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors text-sm flex items-center justify-between ${
                      isSelected
                        ? (isDarkMode 
                            ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30 font-medium' 
                            : 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 font-medium shadow-sm')
                        : (isDarkMode 
                            ? 'text-slate-300 hover:bg-slate-800 hover:text-white' 
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                    } ${isSelected ? 'border' : 'border border-transparent'}`}
                  >
                    {net}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>


      {/* FLOATING RIGHT PANEL - component inspector */}
      <aside className={`${glassPanelClass} right-4 w-72`} style={{ transform: isPanelOpen ? 'translateX(0)' : 'translateX(120%)' }}>
        {/* Case 1: stacked components clicked */}
        {selectedNames.length > 1 && !compToShow && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-3 border-b border-inherit shrink-0">
              <h2 className="text-sm font-bold text-amber-500">
                Zaznaczono: {selectedNames.length}
              </h2>
              <button onClick={clearSelection} className="opacity-60 hover:opacity-100">
                <X size={18}/>
              </button>
            </div>
            <div className="p-3 text-xs opacity-75">
              Kliknij "Pokaż piny", aby przejrzeć szczegóły bez utraty zaznaczenia na Canvasie.
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {selectedNames.map(name => (
                <div 
                  key={name} 
                  className={`group flex items-stretch w-full rounded-md border transition-all ${
                    isDarkMode 
                      ? 'bg-slate-800/50 border-slate-700 hover:border-slate-500' 
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <button 
                    onClick={() => {
                      setInspectedComponent(name);
                      triggerFocus(name); 
                    }}
                    className="flex-1 flex justify-between items-center text-left p-2.5 pl-3 transition-colors rounded-l-md hover:bg-blue-500/10 dark:hover:bg-slate-700/50"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-blue-500 block leading-tight">{name}</span>
                      <span className="text-xs opacity-60 mt-0.5">
                        Side: {boardData?.components[name]?.side}
                      </span>
                    </div>
                    
                    <ChevronRight 
                      size={16} 
                      className="text-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity -mr-1" 
                    />
                  </button>
                  
                  <div className={`w-px my-2 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}></div>

                  <button
                    onClick={() => selectComponents([name], true)} 
                    className={`px-3 flex items-center justify-center rounded-r-md transition-colors ${
                      isDarkMode 
                        ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10' 
                        : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'
                    }`}
                    title="Odznacz komponent"
                  >
                    <X size={14} className="stroke-[2.5]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Case 2: only 1 component clicked */}
        {compToShow && boardData && boardData.components[compToShow] && (
          <div className="flex flex-col h-full">
            <div className="flex flex-col p-3 border-b border-inherit shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedNames.length > 1 ? (
                    <button 
                      onClick={() => setInspectedComponent(null)} 
                      className={`p-1.5 -ml-1 rounded-md transition-colors ${
                        inspectedComponent ? 'text-cyan-500 hover:bg-cyan-500/15' : 'text-rose-500 hover:bg-rose-500/15'
                      }`}
                      title="Wróć do listy"
                    >
                      <ArrowLeft size={24} />
                    </button>
                  ) : (
                    <Cpu size={24} className={inspectedComponent ? "text-cyan-500 dark:text-cyan-400" : "text-rose-500 dark:text-rose-400"}/>
                  )}
                  <h2 className={`text-lg font-bold ${
                    inspectedComponent ? "text-cyan-500 dark:text-cyan-400" : "text-rose-500 dark:text-rose-400"
                  }`}>
                    {compToShow}
                  </h2>
                </div>

                <button onClick={clearSelection} className="opacity-60 hover:opacity-100 transition-opacity">
                  <X size={18}/>
                </button>
              </div>
              <div className="text-xs opacity-70 mt-1 flex flex-col gap-0.5">
                <span>Type: {boardData.components[compToShow].mountingType} | Side: {boardData.components[compToShow].side}</span>
                <span className="font-mono mt-1 text-blue-500 dark:text-blue-400">PN: [Oczekuje na moduł PDF...]</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className={`text-xs uppercase sticky top-0 ${isDarkMode ? 'bg-slate-900/95 text-slate-400' : 'bg-white/95 text-slate-500'}`}>
                  <tr><th className="px-4 py-2 font-medium">Pin</th><th className="px-4 py-2 font-medium">Net</th></tr>
                </thead>
                <tbody>
                  {boardData.components[compToShow].pins && Object.entries(boardData.components[compToShow].pins).map(([pinName, pin]) => (
                    <tr key={pinName} className={`border-b border-inherit ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                      <td className="px-4 py-2 font-mono font-medium">{pinName}</td>
                      <td className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-semibold">{pin.net || "N/C"}</td>
                    </tr>
                  ))}
                  {!boardData.components[compToShow].pins && (
                    <tr><td colSpan={2} className="px-4 py-4 text-center opacity-50 text-xs">Brak zdefiniowanych pinów</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </aside>

    </div>
  );
}

export default App;