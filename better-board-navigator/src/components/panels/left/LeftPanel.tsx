import { useState, useMemo, useEffect } from 'react';
import { useBoardStore } from '../../../store/boardStore';
import { Search, Cpu, Layers } from 'lucide-react';
import ComponentList from './ComponentList';
import NetList from './NetList';

export default function LeftPanel({ isOpen }: { isOpen: boolean }) {
  const { boardData, isDarkMode, selectedNet } = useBoardStore();
  const [activeTab, setActiveTab] = useState<'components' | 'nets'>('components');
  const [searchQuery, setSearchQuery] = useState('');

  
  useEffect(() => {
    if (selectedNet && activeTab !== 'nets') setActiveTab('nets');
  }, [selectedNet, activeTab]);

  const glassPanelClass = `absolute top-16 bottom-4 left-4 w-80 rounded-xl border shadow-lg flex flex-col transition-transform duration-300 z-10 backdrop-blur-xl overflow-hidden ${
    isDarkMode ? 'bg-slate-900/85 border-slate-700 text-slate-300' : 'bg-white/95 border-slate-200 text-slate-700'
  }`;

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
  }, [availableNets, searchQuery]);


  return (
    <aside className={glassPanelClass} style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-120%)' }}>
      <div className="flex border-b border-inherit shrink-0">
        <button onClick={() => setActiveTab('components')} className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'components' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-inherit opacity-70 hover:opacity-100'}`}>
          <Cpu size={16}/> Components
        </button>
        <button onClick={() => setActiveTab('nets')} className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'nets' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-inherit opacity-70 hover:opacity-100'}`}>
          <Layers size={16}/> Nets
        </button>
      </div>

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
                ? 'bg-slate-950/50 border-slate-700 focus:border-blue-500 focus:ring-1' 
                : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-1 hover:border-slate-300'
            }`}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'components' 
          ? <ComponentList items={filteredComponents} /> 
          : <NetList items={filteredNets} />
        }
      </div>
    </aside>
  );
}