import { useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { X, Search, Loader2, AlertTriangle, ChevronRight, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { traceabilityParser } from '../../utils/traceabilityParser';


export default function TraceabilityModal() {
  const { t } = useTranslation();

  const { 
    isTraceabilityOpen, toggleTraceability, isDarkMode, 
    traceabilityApiRoot, setFailedComponents, selectComponents, setInspectedComponents, triggerFocus 
  } = useBoardStore();

  const [serialNumber, setSerialNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);


  if (!isTraceabilityOpen) return null;

  const handleSearch = async () => {
    if (!serialNumber.trim() || !traceabilityApiRoot) return;
    
    setIsLoading(true);
    setHistoryData([]);
    setExpandedRowIndex(null);

    try {
      const response = await fetch(`${traceabilityApiRoot}boardflowfull/history/${serialNumber}`);
      if (!response.ok) throw new Error('Traceability API error');
      const data = await response.json();
      
      const history = data?.payload?.history || [];
      const processed = history.filter((item: any) => item.testDate).map((item: any) => ({
        result: item.result === '1' ? 'Pass' : 'Fail',
        machine: item.phaseDescription,
        phase: item.processStepDescription,
        date: new Date(item.testDate).toLocaleString(),
        measures: item.measures || []
      }));
      
      setHistoryData(processed.reverse()); // display from newest
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

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm transition-all" onClick={toggleTraceability}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
          isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-inherit shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="text-rose-500" /> {t('traceability.title')}
          </h2>
          <button onClick={toggleTraceability} className="p-1.5 rounded-md opacity-60 hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* TOOLBAR */}
        <div className="p-5 border-b border-inherit shrink-0 flex gap-3">
          <input 
            type="text" 
            placeholder={t('traceability.sn_placeholder')}
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className={`flex-1 px-4 py-2.5 rounded-lg outline-none transition-all border ${
              isDarkMode ? 'bg-slate-950 border-slate-700 focus:border-rose-500' : 'bg-slate-50 border-slate-200 focus:border-rose-500'
            }`}
          />
          <button 
            onClick={handleSearch}
            disabled={isLoading || !traceabilityApiRoot}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Search size={18} />}
            {t('traceability.search_btn')}
          </button>
        </div>

        {/* RESULTS */}
        <div className="flex-1 overflow-y-auto p-5">
          {!traceabilityApiRoot && (
            <div className="p-4 bg-amber-500/20 text-amber-600 rounded-lg flex items-center gap-3">
              <AlertTriangle size={24} />
              <span>{t('traceability.missing_api_root')}</span>
            </div>
          )}
          
          {historyData.length > 0 && (
            <div className="space-y-2">
              {historyData.map((row, idx) => {
                const isExpanded = expandedRowIndex === idx;
                const isFail = row.result === 'Fail';
                const hasMeasures = row.measures && row.measures.length > 0;

                return (
                  <div key={idx} className={`border rounded-lg overflow-hidden transition-colors ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                    
                    <div 
                      onClick={() => hasMeasures && setExpandedRowIndex(isExpanded ? null : idx)}
                      className={`flex items-center p-3 gap-4 ${hasMeasures ? 'cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50' : ''}`}
                    >
                      <div className="shrink-0 pt-0.5">
                        <ChevronRight size={18} className={`transition-transform duration-200 opacity-50 ${isExpanded ? 'rotate-90' : ''} ${!hasMeasures ? 'invisible' : ''}`}/>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-bold ${isFail ? 'bg-rose-500/20 text-rose-600' : 'bg-green-500/20 text-green-600'}`}>
                        {row.result}
                      </div>
                      <div className="flex-1 text-sm font-semibold truncate">{row.phase} <span className="opacity-50 font-normal">[{row.machine}]</span></div>
                      <div className="text-xs opacity-60 font-mono">{row.date}</div>
                    </div>

                    {/* Measurements table */}
                    {isExpanded && (
                      <div className={`p-4 border-t ${isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-300 bg-white'}`}>
                         <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold opacity-75">{t('traceability.measures_title')}</h3>
                            {isFail && (
                              <button 
                                onClick={() => handleAnalyzeFailures(row.measures)}
                                className="px-3 py-1.5 bg-rose-600/20 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white rounded-md text-xs font-bold transition-colors"
                              >
                                {t('traceability.show_on_board')}
                              </button>
                            )}
                         </div>
                         <div className="max-h-64 overflow-y-auto border rounded-md border-inherit">
                            <table className="w-full text-xs text-left">
                              <thead className={`uppercase sticky top-0 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <tr>
                                  <th className="px-3 py-2">{t('traceability.table_result')}</th>
                                  <th className="px-3 py-2">{t('traceability.table_test')}</th>
                                  <th className="px-3 py-2">{t('traceability.table_value')}</th>
                                  <th className="px-3 py-2">{t('traceability.table_unit')}</th>
                                </tr>
                              </thead>
                            <tbody className="divide-y divide-inherit">
                              {row.measures.map((m: any, mIdx: number) => {
                                const mFail = String(m.result).toLowerCase().includes('fail') || m.result === '0';
                                return (
                                <tr key={mIdx} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                                  <td className={`px-3 py-1.5 font-bold ${mFail ? 'text-rose-500' : 'text-green-500'}`}>{m.result}</td>
                                  <td className="px-3 py-1.5 font-mono">{m.item}</td>
                                  <td className="px-3 py-1.5">{m.measure}</td>
                                  <td className="px-3 py-1.5">{m.unitMeasure}</td>
                                </tr>
                                )
                               })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}