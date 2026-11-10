import { useEffect, useRef, useState, useCallback } from 'react';
import { useBoardStore } from '../store/boardStore';
import type { BoardData } from '../types/board';

export type WorkerStatus = 'idle' | 'loading_pyodide' | 'processing' | 'error';

export function useBoardWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<WorkerStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const setBoardData = useBoardStore((state) => state.setBoardData);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/pyodideWorker.ts', import.meta.url), {
      type: 'module' 
    });

    workerRef.current.onmessage = (event) => {
      const { type, status, payload, message } = event.data;

      if (type === 'STATUS') {
        setStatus(status);

      } else if (type === 'RESULT') {
        setStatus('idle');

        if (payload.boardData) {
          setBoardData(payload.boardData as BoardData);
        } else {
          console.error("[React Główny Wątek] Python nie zwrócił klucza 'boardData'!", payload);
        }
      } else if (type === 'ERROR') {
        setStatus('error');
        setError(message);
        console.error("[React Główny Wątek] Błąd z Workera:", message);
      }
    };

    workerRef.current.onerror = (error) => {
      console.error(`[React Główny Wątek] KRYTYCZNY BŁĄD WORKERA:`, error.message);
      setStatus('error');
    };

    workerRef.current.onmessageerror = (error) => {
      console.error("[React Główny Wątek] Błąd deserializacji wiadomości od Workera!", error);
      setStatus('error');
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [setBoardData]);

  
  const processFiles = useCallback((files: FileList, companyType: string = 'DEFAULT') => {
    if (workerRef.current && (status === 'idle' || status === 'error')) {
      setStatus('loading_pyodide');
      setError(null);
      
      console.log("[React Główny Wątek] Wysyłam pliki do Workera.");
      workerRef.current.postMessage({ 
        type: 'PROCESS_FILES', 
        files: Array.from(files),
        companyType 
      });
    }
  }, [status]);

  return { status, error, processFiles };
}