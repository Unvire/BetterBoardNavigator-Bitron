import { useMemo } from 'react';
import { useBoardStore } from '../../../store/boardStore';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PartNumberListProps {
  searchQuery: string;
}

export default function PartNumberList({ searchQuery }: PartNumberListProps) {
  const { t } = useTranslation();

  const { 
    partNumbers, 
    isDarkMode, 
    highlightedPartNumber, 
    setHighlightedPartNumber 
  } = useBoardStore();

  // [{ pn: "PN1", comps: ["R1", "R2"] }]
  const groupedBom = useMemo(() => {
    if (!partNumbers) return [];

    const map = new Map<string, string[]>();
    Object.entries(partNumbers).forEach(([comp, pn]) => {
      if (!map.has(pn)) map.set(pn, []);
      map.get(pn)!.push(comp);
    });

    const q = searchQuery.toLowerCase();
    
    return Array.from(map.entries())
      .map(([pn, comps]) => ({ pn, comps: comps.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })) }))
      .filter(({ pn, comps }) => 
        pn.toLowerCase().includes(q) || comps.some(c => c.toLowerCase().includes(q))
      )
      .sort((a, b) => a.pn.localeCompare(b.pn));
      
  }, [partNumbers, searchQuery]);

  if (!partNumbers) {
    return <div className="px-3 py-4 text-center opacity-50 text-xs">{t('leftpanel.bom_load_file')}</div>;
  }

  if (groupedBom.length === 0) {
    return <div className="px-3 py-2 text-center opacity-50 text-xs">{t('leftpanel.bom_no_data')}</div>;
  }

  return (
    <ul className="text-sm space-y-1">
      {groupedBom.map(({ pn, comps }) => {
        const isSelected = highlightedPartNumber === pn;

        return (
          <div key={pn} className="flex flex-col gap-0.5">
            <li 
              onClick={() => setHighlightedPartNumber(isSelected ? null : pn)}
              className={`px-3 py-2 rounded-md cursor-pointer transition-all flex items-start justify-between border ${
                isSelected
                  ? (isDarkMode ? 'bg-cyan-900/40 text-cyan-300 font-bold border-cyan-500/50 shadow-sm' : 'bg-cyan-50 text-cyan-800 font-bold border-cyan-300 shadow-sm')
                  : (isDarkMode ? 'border-transparent hover:bg-slate-800 text-slate-300' : 'border-transparent hover:bg-slate-200/70 text-slate-700')
              }`}
            >
              <div className="flex flex-col">
                <span className="font-mono">{pn}</span>
                <span className="text-[10px] opacity-60 mt-0.5 font-sans font-normal">
                  {t('leftpanel.bom_quantity')} {comps.length}
                </span>
              </div>
              
              {isSelected && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setHighlightedPartNumber(null); }}
                  className="opacity-60 hover:opacity-100 p-1 rounded hover:bg-cyan-500/20 shrink-0"
                >
                  <X size={14}/>
                </button>
              )}
            </li>

            {isSelected && (
              <div className={`ml-3 my-1 pl-2 border-l-2 space-y-1 ${isDarkMode ? 'border-cyan-900/50' : 'border-cyan-200'}`}>
                {comps.map(comp => (
                  <div key={comp} className="px-2 py-1 text-xs opacity-75 font-medium">
                    {comp}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </ul>
  );
}