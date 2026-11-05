import { useEffect, useState } from 'react';
import { useBoardStore } from './store/boardStore';
import BoardCanvas from './canvas/BoardCanvas';

function App() {
  const setBoardData = useBoardStore((state) => state.setBoardData);
  const boardData = useBoardStore((state) => state.boardData);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMockData() {
      try {
        const response = await fetch('/mockBoard.json'); 
        if (!response.ok) {
          throw new Error('Nie udało się pobrać pliku mockBoard.json');
        }
        
        const data = await response.json();
        setBoardData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadMockData();
  }, [setBoardData]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-xl font-semibold">Ładowanie płytki...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-xl font-semibold text-red-500">Błąd: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden flex-col md:flex-row">
      <aside className="w-full md:w-80 border-r border-gray-200 bg-white p-4 flex-shrink-0 z-10 shadow-lg">
        <h1 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
          Navigator Menu
        </h1>
        {boardData ? (
           <p className="text-sm text-green-600 font-medium">Dane załadowane (Komponenty: {Object.keys(boardData.components).length})</p>
        ) : (
           <p className="text-sm text-yellow-600 font-medium">Oczekiwanie na dane...</p>
        )}
        
        <div className="mt-4">
            <p className="text-gray-500 text-xs italic">Miejsce na opcje (np. Show Outlines, Theme)</p>
        </div>
      </aside>

      <main className="flex-1 relative overflow-hidden bg-gray-50">
        <BoardCanvas /> 
      </main>
    </div>
  );
}

export default App;