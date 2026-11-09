import { useBoardStore } from '../../store/boardStore';
import { 
  Upload, FlipHorizontal, RotateCw, RotateCcw, Settings2, HelpCircle, 
  Layers, PanelLeftClose, PanelLeftOpen, Sun, Moon, Type 
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
    showLabels, toggleLabels,
    isDarkMode, toggleDarkMode 
  } = useBoardStore();

  
  const actionBtnClass = `p-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 font-medium text-sm
    ${isDarkMode 
      ? 'hover:bg-slate-700/80 text-slate-300 hover:text-white' 
      : 'hover:bg-slate-200/80 text-slate-600 hover:text-slate-900'}`;


  const toolGroupClass = `flex items-center p-1 rounded-xl border shadow-sm transition-colors
    ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-200/50 border-slate-300/50'}`;

  return (
    <header className={`absolute top-0 left-0 right-0 h-14 px-4 flex items-center justify-between z-20 backdrop-blur-md border-b shadow-sm transition-colors ${isDarkMode ? 'bg-slate-900/85 border-slate-800 text-slate-200' : 'bg-slate-50/90 border-slate-200 text-slate-800'}`}>
      
      {/* 1. LEFT: UI & Branding */}
      <div className="flex items-center gap-4 flex-1">
        <button onClick={toggleLeftPanel} className={actionBtnClass} title="Toggle Sidebar [B]">
          {isLeftPanelOpen ? <PanelLeftClose size={22}/> : <PanelLeftOpen size={22}/>}
        </button>
        <div className="font-bold text-lg flex items-center gap-2 tracking-tight select-none cursor-default">
          <span className="text-blue-500">Better</span> Board Navigator
        </div>
      </div>

      {/* 2. MIDDLE - TOOLS*/}
      <div className="flex items-center justify-center gap-4 flex-1">
        <div className={toolGroupClass}>
          <button 
            onClick={() => setCurrentSide(currentSide === 'T' ? 'B' : 'T')} 
            className={`${actionBtnClass} w-16`} 
            title="Switch Side [Space]"
          >
            <Layers size={20} className={currentSide === 'B' ? "text-amber-500" : "text-blue-500"}/>
            <span className="font-bold">{currentSide}</span>
          </button>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-2"></div>
          
          <button onClick={toggleMirror} className={actionBtnClass} title="Flip Horizontally [F]">
            <FlipHorizontal size={20} className={mirrorState[currentSide] ? "text-blue-500" : "opacity-70"} />
          </button>
        </div>

        <div className={toolGroupClass}>
          <button onClick={() => setRotation(rotation === 0 ? 270 : rotation - 90)} className={actionBtnClass} title="Rotate Left [Shift+R]">
            <RotateCcw size={20} className="opacity-70" />
          </button>

          <button onClick={() => setRotation(rotation + 90)} className={actionBtnClass} title="Rotate Right [R]">
            <RotateCw size={20} className="opacity-70" />
          </button>
        </div>

        <div className={toolGroupClass}>
          <button onClick={toggleLabels} className={actionBtnClass} title="Toggle Component Labels [L]">
            <Type size={20} className={showLabels ? "text-blue-500" : "opacity-70"} />
          </button>
        </div>
      </div>

      {/* 3. RIGHT - GLOBAL SETTINGS AND FILE LOADER*/}
      <div className="flex items-center justify-end gap-1 flex-1">
        <button className={actionBtnClass} title="Load File [Ctrl+O]">
          <Upload size={20} />
        </button>
        
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-2"></div>
        
        <button onClick={toggleDarkMode} className={actionBtnClass} title="Toggle Theme [T]">
          {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
        </button>
        <button className={actionBtnClass} title="Settings">
          <Settings2 size={20} />
        </button>
        <button className={actionBtnClass} title="Help">
          <HelpCircle size={20} />
        </button>
      </div>

    </header>
  );
}