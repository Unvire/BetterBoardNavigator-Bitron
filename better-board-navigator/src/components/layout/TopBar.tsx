import { useBoardStore } from '../../store/boardStore';
import { 
  Upload, FlipHorizontal, RotateCw, RotateCcw, Settings2, HelpCircle, 
  Layers, PanelLeftClose, PanelLeftOpen, Sun, Moon
} from 'lucide-react';

interface TopBarProps {
  isLeftPanelOpen: boolean;
  toggleLeftPanel: () => void;
}

export default function TopBar({ isLeftPanelOpen, toggleLeftPanel }: TopBarProps) {
  const { 
    currentSide, setCurrentSide, 
    mirrorState, toggleMirror, 
    rotation, setRotation,
    isDarkMode, toggleDarkMode 
  } = useBoardStore();

  const topBarBtnClass = "p-2 rounded-lg transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1";

  return (
    <header className={`absolute top-0 left-0 right-0 h-12 px-4 flex items-center justify-between z-20 backdrop-blur-sm border-b shadow-sm ${isDarkMode ? 'bg-slate-900/80 border-slate-800 text-slate-200' : 'bg-slate-50/90 border-slate-300 text-slate-800'}`}>
      <div className="flex items-center gap-4">
        <button onClick={toggleLeftPanel} className={topBarBtnClass}>
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
          }} 
          className={topBarBtnClass} 
          title="Switch Side (Top/Bottom)"
        >
          <Layers size={18} className={currentSide === 'B' ? "text-amber-500" : "text-blue-500"}/>
          <span className="text-xs font-bold w-3">{currentSide}</span>
        </button>
        
        <button onClick={toggleMirror} className={topBarBtnClass} title="Flip Horizontally">
          <FlipHorizontal size={18} className={mirrorState[currentSide] ? "text-blue-500" : ""} />
        </button>

        <button onClick={() => setRotation(rotation === 0 ? 270 : rotation - 90)} className={topBarBtnClass} title="Rotate Left">
          <RotateCcw size={18} />
        </button>

        <button onClick={() => setRotation(rotation + 90)} className={topBarBtnClass} title="Rotate Right">
          <RotateCw size={18} />
        </button>
        
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-2"></div>
        
        <button onClick={toggleDarkMode} className={topBarBtnClass} title="Toggle Theme">
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className={topBarBtnClass} title="Settings"><Settings2 size={18} /></button>
        <button className={topBarBtnClass} title="Help"><HelpCircle size={18} /></button>
      </div>
    </header>
  );
}