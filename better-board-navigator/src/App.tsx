import { useEffect, useState } from 'react';
import { useBoardStore } from './store/boardStore';
import BoardCanvas from './components/canvas/BoardCanvas'; 
import TopBar from './components/layout/TopBar';
import LeftPanel from './components/panels/left/LeftPanel';
import RightPanel from './components/panels/right/RightPanel';
import { Layers } from 'lucide-react';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTranslation } from 'react-i18next';


function App() {
  const { t } = useTranslation();
  const { 
    setBoardData, isDarkMode, 
    clearSelection, selectNet, 
    inspectedComponent, setInspectedComponent
  } = useBoardStore();

  const [isLoading, setIsLoading] = useState(true);


  useKeyboardShortcuts();


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (inspectedComponent) setInspectedComponent(null);
        else {
          clearSelection();
          selectNet(null);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection, inspectedComponent, setInspectedComponent, selectNet]);

  
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
      <div className={`flex h-screen w-screen items-center justify-center ${isDarkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-300 text-slate-700'}`}>
        <p className="text-xl animate-pulse flex items-center gap-3">
          <Layers className="animate-spin" /> {`${t('init_screen.init_message')}`}
        </p>
      </div>
    );
  }


  return (
    <div className={`relative w-screen h-screen overflow-hidden ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
      {/* LAYER 0: CANVAS - background */}
      <div className="absolute inset-0 z-0">
        <BoardCanvas />
      </div>

      {/* LAYER 1: FLOATING UI */}
      <TopBar/>
      <LeftPanel/>
      <RightPanel />
    </div>
  );
}

export default App;