import { useState, Fragment } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { X, Search, Loader2, AlertTriangle, ChevronRight, Activity, FileJson } from 'lucide-react';
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

  const processApiData = (historyRaw: any[]) => {
    return historyRaw.filter((item: any) => item.testDate).map((item: any) => (
      {
        result: String(item.result) === '1' || String(item.result).toLowerCase() === 'pass' ? 'Pass' : 'Fail',
        machine: item.machineName || item.phaseDescription,
        phase: item.processStepDescription || item.phaseDescription,
        date: new Date(item.testDate).toLocaleString(),
        internalCode: item.idPart || '-',
        measures: item.measures || []
      }
    )).reverse();
  };

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

  /////////////////////////////
  const handleLoadMockData = async () => {
    setIsLoading(true);
    setHistoryData([]);
    setExpandedRowIndex(null);

    try {
      const response = await fetch('/mock-nexyM-history.json');
      if (!response.ok) throw new Error('Nie znaleziono pliku');
      const data = await response.json();
      const history = data?.payload?.history || (Array.isArray(data) ? data : []);
      
      if (history.length === 0) {
        alert(t('traceability.mock_empty', 'Plik JSON jest pusty.'));
        return;
      }
      setHistoryData(processApiData(history));
    } catch (err) {
      alert(t('traceability.error_parsing_mock', 'Błąd podczas wczytywania lokalnego JSONa.'));
    } finally {
      setIsLoading(false);
    }
  };
  //////////////////////////

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm transition-all" onClick={toggleTraceability}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-5xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
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
              isDarkMode ? 'bg-slate-950 border-slate-700 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'
            }`}
          />
          <button 
            onClick={handleSearch}
            disabled={isLoading || !traceabilityApiRoot}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Search size={18} />}
            <span className="hidden sm:inline">{t('traceability.search_btn', 'Szukaj')}</span>
          </button>

          <div className="w-px bg-slate-300 dark:bg-slate-700 mx-1 my-1"></div>
          
          {/* DEV v */}
          <button 
            onClick={handleLoadMockData}
            disabled={isLoading}
            className={`px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors border ${
              isDarkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600'
            } disabled:opacity-50`}
            title={t('traceability.load_mock_tooltip', 'Wczytaj plik mock-history.json (Dev)')}
          >
            <FileJson size={18} />
          </button>
          {/* DEV ^ */}

        </div>

        {/* WYNIKI - PRAWDZIWA TABELA Z NAGŁÓWKAMI */}
        <div className="flex-1 overflow-y-auto relative">
          {!traceabilityApiRoot && historyData.length === 0 && (
             <div className="m-5 p-4 bg-amber-500/20 text-amber-600 rounded-lg flex items-center gap-3">
               <AlertTriangle size={24} />
               <span>{t('traceability.missing_api_root')}</span>
             </div>
          )}
          
          {historyData.length > 0 && (
            <table className="w-full text-sm text-left">
              <thead className={`text-xs uppercase sticky top-0 z-10 shadow-sm ${isDarkMode ? 'bg-slate-900/95 text-slate-400 border-b border-slate-700' : 'bg-white/95 text-slate-500 border-b border-slate-200'}`}>
                <tr>
                  <th className="w-8 px-2 py-3"></th>
                  <th className="px-4 py-3">{t('traceability.table_main_status')}</th>
                  <th className="px-4 py-3">{t('traceability.table_main_date')}</th>
                  <th className="px-4 py-3">{t('traceability.table_main_code')}</th>
                  <th className="px-4 py-3">{t('traceability.table_main_phase')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit border-b border-inherit">
                {historyData.map((row, idx) => {
                  const isExpanded = expandedRowIndex === idx;
                  const isFail = row.result === 'Fail';
                  const hasMeasures = row.measures && row.measures.length > 0;

                  return (
                    <Fragment key={idx}>
                      <tr 
                        onClick={() => hasMeasures && setExpandedRowIndex(isExpanded ? null : idx)}
                        className={`transition-colors ${hasMeasures ? 'cursor-pointer' : ''} ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-2 py-3 text-center">
                          {hasMeasures && <ChevronRight size={16} className={`inline-block transition-transform duration-200 opacity-50 ${isExpanded ? 'rotate-90' : ''}`} />}
                        </td>
                        <td className="px-4 py-3">
                          {/* SUBTELNE, NOWOCZESNE BADGES PASS/FAIL */}
                          <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold border ${
                            isFail 
                              ? (isDarkMode ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-rose-300 bg-rose-50 text-rose-600') 
                              : (isDarkMode ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-emerald-300 bg-emerald-50 text-emerald-600')
                          }`}>
                            {row.result}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs opacity-80 whitespace-nowrap">{row.date}</td>
                        <td className="px-4 py-3 font-mono font-semibold">{row.internalCode}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold">{row.phase}</span> <span className="opacity-50 font-normal ml-1">[{row.machine}]</span>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className={isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50/50'}>
                          <td colSpan={5} className="p-0">
                            <div className={`m-4 p-4 border rounded-lg shadow-inner ${isDarkMode ? 'border-slate-700 bg-slate-950/50' : 'border-slate-300 bg-white'}`}>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold opacity-75">{t('traceability.measures_title', 'Szczegóły pomiarów')}</h3>
                                {isFail && (
                                  <button 
                                    onClick={() => handleAnalyzeFailures(row.measures)}
                                    className="px-3 py-1.5 border border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white rounded-md text-xs font-bold transition-colors"
                                  >
                                    {t('traceability.show_on_board', 'Pokaż błędy na płytce')}
                                  </button>
                                )}
                              </div>
                              <div className="max-h-64 overflow-y-auto border rounded-md border-inherit">
                                <table className="w-full text-xs text-left">
                                  <thead className={`uppercase sticky top-0 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                    <tr>
                                      <th className="px-3 py-2">{t('traceability.table_result', 'Wynik')}</th>
                                      <th className="px-3 py-2">{t('traceability.table_test', 'Test')}</th>
                                      <th className="px-3 py-2">{t('traceability.table_value', 'Wartość')}</th>
                                      <th className="px-3 py-2">{t('traceability.table_unit', 'Jednostka')}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-inherit">
                                    {row.measures.map((m: any, mIdx: number) => {
                                      const mFail = String(m.result).toLowerCase().includes('fail') || String(m.result) === '0';
                                      return (
                                        <tr key={mIdx} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                                          <td className={`px-3 py-1.5 font-bold ${mFail ? 'text-rose-500' : 'text-emerald-500'}`}>{m.result}</td>
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
                          </td>
                        </tr>
                      )}
                    </Fragment>
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