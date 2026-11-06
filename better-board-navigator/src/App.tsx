import { useEffect, useState } from 'react';
import { useBoardStore } from './store/boardStore';
import BoardCanvas from './components/canvas/BoardCanvas'; 
import { 
  Upload, RotateCw, FlipHorizontal, Maximize, 
  Settings2, HelpCircle, Layers, Search, Cpu, List, X, PanelLeftClose, PanelLeftOpen, Sun, Moon
} from 'lucide-react';

function App() {
  const { boardData, setBoardData, isDarkMode, toggleDarkMode, 
    selectedComponents, selectComponents } = useBoardStore();
  const [isLoading, setIsLoading] = useState(true);

  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'components' | 'nets'>('components');

  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  const selectedNames = Array.from(selectedComponents);
  const isPanelOpen = selectedNames.length > 0;

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

  if (isLoading) {
    return (
      <div className={`flex h-screen w-screen items-center justify-center ${isDarkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
        <p className="text-xl animate-pulse flex items-center gap-3">
          <Layers className="animate-spin" /> Initializing 2D environment...
        </p>
      </div>
    );
  }

  const glassPanelClass = `absolute top-16 bottom-4 rounded-xl border shadow-2xl flex flex-col transition-transform duration-300 z-10 backdrop-blur-md overflow-hidden ` + 
    (isDarkMode ? 'bg-slate-900/85 border-slate-700 text-slate-300' : 'bg-white/85 border-slate-200 text-slate-800');

  const topBarBtnClass = "p-2 rounded-lg transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300";

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
      
      {/* LAYER 0: CANVAS - background */}
      <div className="absolute inset-0 z-0">
        <BoardCanvas />
      </div>

      {/* LAYER 1: FLOATING UI */}
      {/* TOP BAR - buttons */}
      <header className={`absolute top-0 left-0 right-0 h-12 px-4 flex items-center justify-between z-20 backdrop-blur-sm border-b shadow-sm ${isDarkMode ? 'bg-slate-900/80 border-slate-800 text-slate-200' : 'bg-white/80 border-slate-200 text-slate-800'}`}>
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
          <button className={topBarBtnClass} title="Rotate Board"><RotateCw size={18} /></button>
          <button className={topBarBtnClass} title="Flip Side"><FlipHorizontal size={18} /></button>
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-2"></div>
          <button onClick={toggleDarkMode} className={topBarBtnClass} title="Toggle Theme">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className={topBarBtnClass} title="Settings"><Settings2 size={18} /></button>
          <button className={topBarBtnClass} title="Help"><HelpCircle size={18} /></button>
        </div>
      </header>


      {/* FLOATING LEFT PANEL - components and nets explorer */}
      <aside 
        className={`${glassPanelClass} left-4 w-80`}
        style={{ transform: isLeftPanelOpen ? 'translateX(0)' : 'translateX(-120%)' }}
      >
        {/* Tabs */}
        <div className="flex border-b border-inherit shrink-0">
          <button 
            onClick={() => setActiveTab('components')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'components' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-inherit opacity-70 hover:opacity-100'}`}
          >
            <Cpu size={16}/> Components
          </button>
          <button 
            onClick={() => setActiveTab('nets')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'nets' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-inherit opacity-70 hover:opacity-100'}`}
          >
            <Layers size={16}/> Nets
          </button>
        </div>

        {/* Search bar */}
        <div className="p-3 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`}
              className={`w-full pl-9 pr-3 py-1.5 text-sm rounded-md outline-none transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700 focus:border-blue-500' : 'bg-slate-100 border-slate-300 focus:border-blue-500'}`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {activeTab === 'components' ? (
            <ul className="text-sm space-y-0.5">
              <li className={`px-3 py-1.5 rounded-md cursor-pointer ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}>C1 (SMD)</li>
              <li className={`px-3 py-1.5 rounded-md cursor-pointer ${isDarkMode ? 'bg-blue-600/30 text-blue-400 font-medium' : 'bg-blue-100 text-blue-700 font-medium'}`}>R1 (TH)</li>
              <li className={`px-3 py-1.5 rounded-md cursor-pointer ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}>R2 (TH)</li>
            </ul>
          ) : (
            <ul className="text-sm space-y-0.5">
              <li className={`px-3 py-1.5 rounded-md cursor-pointer font-semibold ${isDarkMode ? 'text-indigo-400 hover:bg-slate-800' : 'text-indigo-600 hover:bg-slate-200'}`}>+5V</li>
              <li className={`px-3 py-1.5 rounded-md cursor-pointer font-semibold ${isDarkMode ? 'text-indigo-400 hover:bg-slate-800' : 'text-indigo-600 hover:bg-slate-200'}`}>GND</li>
            </ul>
          )}
        </div>
      </aside>


      {/* FLOATING RIGHT PANEL - component inspector */}
      <aside 
        className={`${glassPanelClass} right-4 w-72`}
        style={{ transform: isPanelOpen ? 'translateX(0)' : 'translateX(120%)' }}
      >
        {/* Case 1: stacked components clicked */}
        {selectedNames.length > 1 && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-3 border-b border-inherit shrink-0">
              <h2 className="text-sm font-bold text-amber-500">
                Znaleziono {selectedNames.length} elementy
              </h2>
              <button onClick={() => selectComponents([])} className="opacity-60 hover:opacity-100">
                <X size={18}/>
              </button>
            </div>
            <div className="p-3 text-xs opacity-75">
              Kliknij w konkretny komponent, aby zobaczyć jego detale:
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {selectedNames.map(name => (
                <button 
                  key={name}
                  onClick={() => selectComponents([name])}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-blue-400'}`}
                >
                  <span className="font-bold text-blue-500 block mb-1">{name}</span>
                  <span className="text-xs opacity-70">
                    Type: {boardData?.components[name]?.mountingType} | Side: {boardData?.components[name]?.side}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Case 2: only 1 component clicked */}
        {selectedNames.length === 1 && boardData && boardData.components[selectedNames[0]] && (
          <div className="flex flex-col h-full">
            <div className="flex flex-col p-3 border-b border-inherit shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold flex items-center gap-2 text-rose-500 dark:text-rose-400">
                  <Cpu size={18}/> {selectedNames[0]}
                </h2>
                <button onClick={() => selectComponents([])} className="opacity-60 hover:opacity-100 transition-opacity">
                  <X size={18}/>
                </button>
              </div>
              <div className="text-xs opacity-70 mt-1 flex flex-col gap-0.5">
                <span>Type: {boardData.components[selectedNames[0]].mountingType} | Side: {boardData.components[selectedNames[0]].side}</span>
                <span className="font-mono mt-1 text-blue-500 dark:text-blue-400">PN: [Oczekuje na moduł PDF...]</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className={`text-xs uppercase sticky top-0 ${isDarkMode ? 'bg-slate-900/95 text-slate-400' : 'bg-white/95 text-slate-500'}`}>
                  <tr><th className="px-4 py-2 font-medium">Pin</th><th className="px-4 py-2 font-medium">Net</th></tr>
                </thead>
                <tbody>
                  {boardData.components[selectedNames[0]].pins && Object.entries(boardData.components[selectedNames[0]].pins).map(([pinName, pin]) => (
                    <tr key={pinName} className={`border-b border-inherit ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                      <td className="px-4 py-2 font-mono font-medium">{pinName}</td>
                      <td className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-semibold">{pin.net || "N/C"}</td>
                    </tr>
                  ))}
                  {!boardData.components[selectedNames[0]].pins && (
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