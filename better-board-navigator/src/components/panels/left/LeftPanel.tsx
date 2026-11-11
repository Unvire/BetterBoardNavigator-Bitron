import { useState, useMemo } from 'react';
import { useBoardStore } from '../../../store/boardStore';
import { Search, Cpu, Layers, Shapes, Database } from 'lucide-react';
import ComponentList from './ComponentList';
import NetList from './NetList';
import GroupList from './GroupList';
import { useTranslation } from 'react-i18next';
import PartNumberList from './PartNumberList';

export default function LeftPanel() {
  const { t } = useTranslation();
  const { boardData, isDarkMode, isLeftPanelOpen } = useBoardStore();
  const [activeTab, setActiveTab] = useState<'components' | 'nets' | 'groups' | 'bom'>('components');
  const [searchQuery, setSearchQuery] = useState('');


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
    <aside className={glassPanelClass} style={{ transform: isLeftPanelOpen ? 'translateX(0)' : 'translateX(-120%)' }}>
      
      {/* Panels */}
      <div className="flex border-b border-inherit shrink-0">
        <button 
          onClick={() => setActiveTab('components')} 
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors 
            ${activeTab === 'components' 
            ? 'text-blue-500 border-b-2 border-blue-500' 
            : 'opacity-60 hover:opacity-100'}`}
        >
          <Cpu size={16}/> {t('leftpanel.tab_components')}
        </button>
        <button 
          onClick={() => setActiveTab('nets')} 
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors 
            ${activeTab === 'nets' 
              ? 'text-blue-500 border-b-2 border-blue-500' 
              : 'opacity-60 hover:opacity-100'}`}
        >
          <Layers size={16}/> {t('leftpanel.tab_nets')}
        </button>
        <button 
          onClick={() => setActiveTab('groups')} 
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors 
            ${activeTab === 'groups' 
              ? 'text-blue-500 border-b-2 border-blue-500' 
              : 'opacity-60 hover:opacity-100'}`}
          >
          <Shapes size={16}/> {t('leftpanel.tab_groups')}
        </button>
        <button 
          onClick={() => setActiveTab('bom')} 
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors 
            ${activeTab === 'bom' 
              ? 'text-cyan-500 border-b-2 border-cyan-500' 
              : 'opacity-60 hover:opacity-100'}`}
          >
          <Database size={16}/> {t('leftpanel.tab_groups')}
        </button>
      </div>

      {/* Searchbox */}
      <div className="p-3 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${t('leftpanel.search')}...`}
            className={`w-full pl-9 pr-3 py-2 text-sm rounded-md outline-none transition-all border ${
              isDarkMode 
                ? 'bg-slate-950/50 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-slate-300'
            }`}
          />
        </div>
      </div>

      {/* Lists (components) */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'components' && <ComponentList items={filteredComponents} />}
        {activeTab === 'nets' && <NetList items={filteredNets} />}
        {activeTab === 'groups' && <GroupList searchQuery={searchQuery} />}
        {activeTab === 'bom' && <PartNumberList searchQuery={searchQuery} />}
      </div>
    </aside>
  );
}