import { useState, useEffect } from "react";
import { useScript } from "usehooks-ts";

const PYODIDE_VERSION = "0.26.3";

declare global {
  interface Global {
    //@ts-ignore
    loadPyodide: (options: { indexURL: string }) => Promise<any>;
  }
}

interface Pyodide {
  //@ts-ignore
  runPython: (code: string) => any;
  globals: {
    //@ts-ignore
    get: (name: string) => any;
  };
  // Add other Pyodide methods as needed
}

export default function usePythonRunner() {
  const [pyodide, setPyodide] = useState<Pyodide | null>(null);
  const pyodideScriptStatus = useScript(
    `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`
  );

  useEffect(() => {
    if (pyodideScriptStatus === "ready" && !pyodide) {
      (async () => {
        //@ts-ignore
        const loadedPyodide = await (globalThis as any).loadPyodide({
          indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
        });
        setPyodide(loadedPyodide);
      })();
    }
  }, [pyodideScriptStatus, pyodide]);

  return { pyodide };
}
