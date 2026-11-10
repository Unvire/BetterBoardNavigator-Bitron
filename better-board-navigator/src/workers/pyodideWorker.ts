interface PyodideFS {
  writeFile: (path: string, data: Uint8Array) => void;
  unlink: (path: string) => void;
}

interface PyodideInstance {
  loadPackage: (packages: string[]) => Promise<void>;
  runPythonAsync: (script: string) => Promise<string>;
  FS: PyodideFS;
}

let pyodide: PyodideInstance | null = null;
let lastUploadedFiles: string[] = []; 

async function initPyodide(): Promise<PyodideInstance> {
  if (pyodide) return pyodide;
  
  const pyodideUrl = `${location.origin}/pyodide/pyodide.mjs`;
  const pyodideModule = await import(/* @vite-ignore */ pyodideUrl);
  
  pyodide = await pyodideModule.loadPyodide({
    indexURL: '/pyodide/', 
  }) as PyodideInstance; 
  
  return pyodide;
}


self.onmessage = async (event: MessageEvent) => {
  const { type, files, companyType } = event.data;

  if (type === 'PROCESS_FILES') {
    try {
      self.postMessage({ type: 'STATUS', status: 'loading_pyodide' });
      const py = await initPyodide();
      self.postMessage({ type: 'STATUS', status: 'processing' });

      if (lastUploadedFiles.length > 0) {
        for (const fileName of lastUploadedFiles) {
          try {
            py.FS.unlink(`/${fileName}`);
            console.log(`[Pyodide Worker] Usunięto z RAM: ${fileName}`);
          } catch (err) {
            console.warn(`[Pyodide Worker] Nie udało się usunąć: ${fileName}`, err);
          }
        }
        lastUploadedFiles = [];
      }

      for (const file of files) {
        const buffer = await file.arrayBuffer();
        py.FS.writeFile(`/${file.name}`, new Uint8Array(buffer));
        lastUploadedFiles.push(file.name);
      }

      const fileNames = files.map((f: File) => f.name);
      const pythonScript = `
import json
def process():
    # Tu później wkleimy zminifikowany kod Twojego parsera CAD/TGZ/PDF
    return json.dumps({
        "status": "success",
        "mock": True,
        "company_type": "${companyType}",
        "parsed_files": ${JSON.stringify(fileNames)}
    })
process()
      `;

      const resultJsonStr = await py.runPythonAsync(pythonScript);
      const result = JSON.parse(resultJsonStr);

      self.postMessage({ type: 'RESULT', payload: result });

    } catch (err: any) {
      console.error("Błąd w workerze Pythona:", err);
      self.postMessage({ type: 'ERROR', message: err.message });
    }
  }
};