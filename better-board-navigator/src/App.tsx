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
    currentSide, setCurrentSide, isMirrored, setIsMirrored } = useBoardStore();

  const [isLoading, setIsLoading] = useState(true);

  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'components' | 'nets'>('components');

  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  const selectedNames = Array.from(selectedComponents);
  const isPanelOpen = selectedNames.length > 0;
  
  const [detailedComp, setDetailedComp] = useState<string | null>(null);


  useEffect(() => {
    if (selectedNames.length === 0) setDetailedComp(null);
    if (detailedComp && !selectedNames.includes(detailedComp)) setDetailedComp(null);
  }, [selectedComponents, detailedComp]);

  const compToShow = detailedComp || (selectedNames.length === 1 ? selectedNames[0] : null);


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
      .sort();
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

  const glassPanelClass = `absolute top-16 bottom-4 rounded-xl border shadow-2xl flex flex-col transition-transform duration-300 z-10 backdrop-blur-md overflow-hidden ` + 
    (isDarkMode ? 'bg-slate-900/85 border-slate-700 text-slate-300' : 'bg-white/85 border-slate-200 text-slate-800');

  const topBarBtnClass = "p-2 rounded-lg transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1";

  const handleComponentClick = (compName: string) => {
    const comp = boardData?.components[compName];
    if (comp && comp.side !== currentSide) {
      setCurrentSide(comp.side);
      setIsMirrored(comp.side === 'B');
    }
    selectComponents([compName], false);
    triggerFocus(compName);
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${isDarkMode ? 'bg-slate-950' : 'bg-slate-300'}`}>
      
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
              className={`w-full pl-9 pr-3 py-1.5 text-sm rounded-md outline-none transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700 focus:border-blue-500' : 'bg-slate-100 border-slate-300 focus:border-blue-500'}`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {activeTab === 'components' ? (
            <ul className="text-sm space-y-0.5">
              {filteredComponents.map(compName => {
                const isSelected = selectedComponents.has(compName);
                return (
                  <li 
                    key={compName}
                    onClick={() => handleComponentClick(compName)}
                    className={`px-3 py-1.5 rounded-md cursor-pointer flex justify-between items-center transition-colors ${
                      isSelected 
                        ? (isDarkMode ? 'bg-blue-600/30 text-blue-400 font-medium' : 'bg-blue-200 text-blue-800 font-medium')
                        : (isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200/70 text-slate-700')
                    }`}
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
                    className={`px-3 py-1.5 rounded-md cursor-pointer font-semibold transition-colors ${
                      isSelected
                        ? 'bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/30'
                        : (isDarkMode ? 'text-indigo-400 hover:bg-slate-800' : 'text-indigo-700 hover:bg-slate-200/70')
                    }`}
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
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {selectedNames.map(name => (
                <button 
                  key={name}
                  onClick={() => setDetailedComp(name)}
                  className={`flex justify-between items-center w-full text-left p-3 rounded-md border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-blue-400'}`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-blue-500 block mb-1">{name}</span>
                    <span className="text-xs opacity-70">
                      Side: {boardData?.components[name]?.side}
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 opacity-60" />
                </button>
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
                      onClick={() => setDetailedComp(null)} 
                      className="p-1.5 -ml-1 rounded-md text-blue-500 hover:bg-blue-500/15 transition-colors"
                      title="Wróć do listy"
                    >
                      <ArrowLeft size={24} />
                    </button>
                  ) : (
                    <Cpu size={24} className="text-rose-500 dark:text-rose-400"/>
                  )}
                  <h2 className="text-lg font-bold text-rose-500 dark:text-rose-400">
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