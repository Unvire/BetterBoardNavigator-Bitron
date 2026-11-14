import React, { useState, useMemo } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { X, Search, Loader2, AlertTriangle, ChevronRight, Activity, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { traceabilityParser } from '../../utils/traceabilityParser';

type SortKey = 'result' | 'rawDate' | 'internalCode' | 'phase';

export default function TraceabilityModal() {
  const { t } = useTranslation();

  const { 
    isTraceabilityOpen, toggleTraceability, isDarkMode, 
    traceabilityApiRoot, setFailedComponents, selectComponents, setInspectedComponents, triggerFocus 
  } = useBoardStore();
  
  const [serialNumber, setSerialNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const [localFilter, setLocalFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);


  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const displayedData = useMemo(() => {
    let sortableItems = [...historyData];

    if (localFilter.trim() !== '') {
      const q = localFilter.toLowerCase();
      sortableItems = sortableItems.filter(item => 
        item.phase.toLowerCase().includes(q) || 
        item.machine.toLowerCase().includes(q) || 
        item.internalCode.toLowerCase().includes(q) ||
        item.result.toLowerCase().includes(q)
      );
    }

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return sortableItems;
  }, [historyData, sortConfig, localFilter]);


  const processApiData = (historyRaw: any[]) => {
    return historyRaw.filter((item: any) => item.testDate).map((item: any, idx: number) => {
      const rawDate = new Date(item.testDate).getTime();
      return {
        id: `hist-${idx}-${rawDate}`,
        result: String(item.result) === '1' || String(item.result).toLowerCase() === 'pass' ? 'Pass' : 'Fail',
        machine: item.machineName || item.phaseDescription,
        phase: item.processStepDescription || item.phaseDescription,
        date: new Date(item.testDate).toLocaleString(),
        rawDate, 
        internalCode: item.idPart || '-',
        measures: item.measures || []
      };
    }).reverse();
  };


  const handleSearch = async () => {
    if (!serialNumber.trim() || !traceabilityApiRoot) return;

    setIsLoading(true);
    setHistoryData([]);
    setExpandedRowId(null);

    try {
      const response = await fetch(`${traceabilityApiRoot}boardflowfull/history/${serialNumber}`);
      if (!response.ok) throw new Error('Błąd serwera API');
      const data = await response.json();
      const history = data?.payload?.history || [];
      setHistoryData(processApiData(history));
    } catch (err) {
      alert(t('traceability.error_fetching_data'));
    } finally {
      setIsLoading(false);
    }
  };


  const handleAnalyzeFailures = (measures: any[]) => {
    const failedItems = measures
      .filter(m => {
        const res = String(m.result).toLowerCase();
        return res.includes('fail') || res === '0' || res === 'false';
      })
      .map(m => String(m.item));

    const parsedComps = traceabilityParser.parse(failedItems);

    if (parsedComps.length > 0) {
      setFailedComponents(parsedComps); 
      selectComponents(parsedComps, true); 
      
      if (parsedComps.length === 1) {
        setInspectedComponents([parsedComps[0]]);
        triggerFocus(parsedComps[0]);
      }
      toggleTraceability(); 
    } else {
      alert(t('traceability.no_components_found'));
    }
  };


  if (!isTraceabilityOpen) return null;


  const renderSortableHeader = (label: string, sortKey: SortKey) => {
    const isActive = sortConfig?.key === sortKey;
    return (
      <th 
        className="px-4 py-3 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none group font-semibold text-slate-500 dark:text-slate-400"
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center justify-center gap-1.5">
          {label}
          <span className={`text-[10px] transition-opacity ${isActive ? 'opacity-100 text-blue-500' : 'opacity-0 group-hover:opacity-40'}`}>
            {isActive && sortConfig.direction === 'desc' ? '▼' : '▲'}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm transition-all" onClick={toggleTraceability}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-5xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
          isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 shrink-0 bg-inherit z-20">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="text-blue-500" /> {t('traceability.title')}
          </h2>
          <button onClick={toggleTraceability} className="p-1.5 rounded-md opacity-60 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* TOOLBAR */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 shrink-0 flex flex-col md:flex-row justify-between gap-4 bg-inherit z-20">
          
          {/* LEFT */}
          <div className="flex w-full md:w-auto gap-2">
            <input 
              type="text" 
              placeholder={t('traceability.sn_placeholder')}
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={`w-full md:w-64 px-4 py-2.5 rounded-lg outline-none transition-all border ${
                isDarkMode ? 'bg-slate-950 border-slate-700 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'
              }`}
            />
            <button 
              onClick={handleSearch}
              disabled={isLoading || !traceabilityApiRoot}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Search size={18} />}
              <span className="hidden sm:inline">{t('traceability.search_btn')}</span>
            </button>
          </div>

          {/* RIGHT */}
          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-1 md:w-56">
              <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-40" />
              <input 
                type="text" 
                placeholder={t('traceability.filter_placeholder')}
                value={localFilter}
                onChange={(e) => setLocalFilter(e.target.value)}
                disabled={historyData.length === 0}
                className={`w-full pl-9 pr-4 py-2.5 rounded-lg outline-none transition-all border ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700 focus:border-cyan-500' 
                    : 'bg-slate-100 border-slate-200 focus:border-cyan-500'
                } disabled:opacity-50 text-sm`}
              />
            </div>

          </div>
        </div>

        {/* RESULTS */}
        <div className="flex-1 overflow-y-auto relative bg-inherit">
          {!traceabilityApiRoot && historyData.length === 0 && (
             <div className="m-5 p-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg flex items-center gap-3">
               <AlertTriangle size={24} />
               <span className="font-medium">{t('traceability.missing_api_root')}</span>
             </div>
          )}
          
          {historyData.length > 0 && displayedData.length === 0 && (
             <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
               {t('traceability.no_filter_results')}
             </div>
          )}
          
          {displayedData.length > 0 && (
            <table className="w-full text-sm text-left border-collapse">
              <thead className={`text-xs uppercase sticky top-0 z-10 border-b ${
                isDarkMode ? 'bg-slate-900 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200'
              }`}>
                <tr>
                  <th className="w-12 px-2 py-3"></th>
                  {renderSortableHeader(t('traceability.table_main_status'), 'result')}
                  {renderSortableHeader(t('traceability.table_main_date'), 'rawDate')}
                  {renderSortableHeader(t('traceability.table_main_code'), 'internalCode')}
                  {renderSortableHeader(t('traceability.table_main_phase'), 'phase')}
                </tr>
              </thead>
              
              <tbody className="bg-inherit">
                {displayedData.map((row) => {
                  const isExpanded = expandedRowId === row.id;
                  const isFail = row.result === 'Fail';
                  const hasMeasures = row.measures && row.measures.length > 0;

                  return (
                    <React.Fragment key={row.id}>
                      {/* MAIN ROW */}
                      <tr 
                        onClick={() => hasMeasures && setExpandedRowId(isExpanded ? null : row.id)}
                        className={`group transition-colors border-b ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'} ${hasMeasures ? 'cursor-pointer' : ''} ${isExpanded ? (isDarkMode ? 'bg-slate-800/40' : 'bg-slate-50') : (isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50')}`}
                      >
                        <td className="px-2 py-3 text-center">
                          {hasMeasures && (
                            <ChevronRight size={18} className={`inline-block transition-transform duration-200 text-blue-500 dark:text-blue-400 ${isExpanded ? 'rotate-90 opacity-100' : 'opacity-40 group-hover:opacity-100'}`} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold border ${
                            isFail 
                              ? (isDarkMode ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-rose-300 bg-rose-50 text-rose-600') 
                              : (isDarkMode ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-emerald-300 bg-emerald-50 text-emerald-600')
                          }`}>
                            {row.result}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.date}</td>
                        <td className="px-4 py-3 text-center font-mono font-medium text-slate-700 dark:text-slate-300">{row.internalCode}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-700 dark:text-slate-200">{row.phase}</span> <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">[{row.machine}]</span>
                        </td>
                      </tr>

                      {/* MEASUREMENTS TABLE */}
                      {isExpanded && (
                        <tr className={`border-b ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                          <td colSpan={5} className="p-0">
                            <div className={`m-4 p-4 rounded-xl border shadow-sm ${isDarkMode ? 'border-slate-700/60 bg-slate-800/40' : 'border-slate-200/80 bg-slate-100/50'}`}>
                              
                              <div className="flex items-center justify-between mb-3">
                                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t('traceability.measures_title')}</h3>
                                {isFail && (
                                  <button 
                                    onClick={() => handleAnalyzeFailures(row.measures)}
                                    className="px-3 py-1.5 border border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white rounded-md text-xs font-bold transition-colors shadow-sm"
                                  >
                                    {t('traceability.show_on_board')}
                                  </button>
                                )}
                              </div>

                              <div className={`max-h-64 overflow-y-auto rounded border ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`}>
                                <table className={`w-full text-xs text-left ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                  <thead className={`uppercase sticky top-0 z-10 border-b ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-200 border-slate-300 text-slate-700'}`}>
                                    <tr>
                                      <th className="px-4 py-2.5 font-medium">{t('traceability.table_result')}</th>
                                      <th className="px-4 py-2.5 font-medium">{t('traceability.table_test')}</th>
                                      <th className="px-4 py-2.5 font-medium">{t('traceability.table_value')}</th>
                                      <th className="px-4 py-2.5 font-medium">{t('traceability.table_unit')}</th>
                                    </tr>
                                  </thead>
                                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                                    {row.measures.map((m: any, mIdx: number) => {
                                      const mFail = String(m.result).toLowerCase().includes('fail') || String(m.result) === '0';
                                      return (
                                        <tr key={mIdx} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}`}>
                                          <td className={`px-4 py-2 font-bold ${mFail ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{m.result}</td>
                                          <td className="px-4 py-2 font-mono text-slate-600 dark:text-slate-400">{m.item}</td>
                                          <td className="px-4 py-2">{m.measure}</td>
                                          <td className="px-4 py-2 text-slate-500">{m.unitMeasure}</td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}