import { useState, useEffect } from "react";
import { useScript } from "usehooks-ts";

const PYODIDE_VERSION = "0.26.3";

// Type for Python primitive return values
type PyodidePrimitive = string | number | boolean | null | undefined;

// Type for Python array-like return values
type PyodideArray = Array<PyodidePrimitive | PyodideArray | PyodideObject>;

// Type for Python object-like return values
interface PyodideObject {
  [key: string]: PyodidePrimitive | PyodideArray | PyodideObject;
}

// Type for all possible Python return values
type PyodideValue = PyodidePrimitive | PyodideArray | PyodideObject;

// Type for global variable names and their expected return types
interface GlobalVarTypes {
  'test_output': string;
  'syntax_valid': boolean;
  'error_message': string;
  [key: string]: PyodideValue;
}

// Interface for Pyodide globals with typed get method
interface PyodideGlobals {
  get<K extends keyof GlobalVarTypes>(name: K): Promise<GlobalVarTypes[K]>;
  set(name: string, value: PyodideValue): void;
}

// Interface for the Pyodide instance
interface Pyodide {
  runPython(code: string): PyodideValue;
  globals: PyodideGlobals;
  version: string;
  loadPackage(names: string | string[]): Promise<void>;
  runAsync(code: string): Promise<PyodideValue>;
}

// Interface for Pyodide loading options
interface PyodideLoadOptions {
  indexURL: string;
  stdout?: (text: string) => void;
  stderr?: (text: string) => void;
}

// Type for the global loadPyodide function
type LoadPyodide = (options: PyodideLoadOptions) => Promise<Pyodide>;

declare global {
  interface Window {
    loadPyodide: LoadPyodide;
  }
}

export default function usePythonRunner() {
  const [pyodide, setPyodide] = useState<Pyodide | null>(null);
  const pyodideScriptStatus = useScript(
    `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`
  );

  useEffect(() => {
    if (pyodideScriptStatus === "ready" && !pyodide) {
      (async () => {
        try {
          if (!window.loadPyodide) {
            throw new Error("Pyodide failed to load properly");
          }
          
          const loadedPyodide = await window.loadPyodide({
            indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
            stdout: (text: string) => console.log("Python stdout:", text),
            stderr: (text: string) => console.error("Python stderr:", text)
          });
          
          setPyodide(loadedPyodide);
        } catch (error) {
          console.error("Failed to initialize Pyodide:", error);
        }
      })();
    }
  }, [pyodideScriptStatus, pyodide]);

  return { pyodide };
}