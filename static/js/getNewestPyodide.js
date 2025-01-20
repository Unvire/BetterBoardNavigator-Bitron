async function loadLatestPyodide() {
    try {
      const response = await fetch("https://api.github.com/repos/pyodide/pyodide/releases/latest");
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      const latestVersion = data.tag_name;

      const pyodideUrl = `https://cdn.jsdelivr.net/pyodide/v${latestVersion}/full/pyodide.js`;
      const script = document.createElement("script");
      script.src = pyodideUrl;
      script.onerror = () => {
        alert("Error with downloaded pyodide.");
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error("Error loading Pyodide:", error);
    }
  }