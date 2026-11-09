import { useBoardStore } from '../../../store/boardStore';
import MultiSelectView from './MultiSelectView';
import InspectorView from './InspectorView';

export default function RightPanel() {
  const { selectedComponents, inspectedComponent, isDarkMode } = useBoardStore();
  
  const selectedNames = Array.from(selectedComponents);
  const isPanelOpen = selectedNames.length > 0 || inspectedComponent !== null;
  const compToShow = inspectedComponent || (selectedNames.length === 1 ? selectedNames[0] : null);

  const glassPanelClass = `absolute top-16 bottom-4 right-4 w-72 rounded-xl border shadow-lg flex flex-col transition-transform duration-300 z-10 backdrop-blur-xl overflow-hidden ${
    isDarkMode ? 'bg-slate-900/85 border-slate-700 text-slate-300' : 'bg-white/95 border-slate-200 text-slate-700'
  }`;

  return (
    <aside className={glassPanelClass} style={{ transform: isPanelOpen ? 'translateX(0)' : 'translateX(120%)' }}>
      {selectedNames.length > 1 && !compToShow && (
        <MultiSelectView selectedNames={selectedNames} />
      )}
      
      {compToShow && (
        <InspectorView compName={compToShow} isMultiSelected={selectedNames.length > 1} />
      )}
    </aside>
  );
}