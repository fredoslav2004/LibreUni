import { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Terminal, Copy, Check, Loader2, Image as ImageIcon, BookOpen, Code2 } from 'lucide-react';
import { highlightCode } from './SyntaxHighlighter';

interface CodeRunnerProps {
  code?: string;
  output?: string;
  title?: string;
  description?: string;
  language?: 'python' | 'javascript' | 'typescript' | 'c' | 'cpp' | 'git' | 'bash' | 'rust';
}

declare global {
  interface Window {
    loadPyodide: any;
    pyodideInstance: any;
  }
}

type RunnerTab = 'guide' | 'code' | 'output';

export default function CodeRunner({ code, output: initialOutput, title = "Interactive Lab", description, language }: CodeRunnerProps) {
  const defaultCode = code || '';
  const hasDescription = Boolean(description?.trim());
  const initialTab: RunnerTab = hasDescription ? 'guide' : 'code';
  const [currentCode, setCurrentCode] = useState(defaultCode);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [activeTab, setActiveTab] = useState<RunnerTab>(initialTab);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [plotImage, setPlotImage] = useState<string | null>(null);
  const [lastRunCode, setLastRunCode] = useState<string | null>(null);
  
  const pyodideRef = useRef<any>(null);

  const displayLanguage = language || 'python';
  const isBusy = isRunning || isInitializing;
  const outputIsStale = lastRunCode !== null && currentCode !== lastRunCode;
  const shouldRunOnOutput = lastRunCode === null || outputIsStale;

  const tabButtonClass = (tab: RunnerTab) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold uppercase transition-all ${
      activeTab === tab
        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
        : 'text-light-muted dark:text-dark-muted hover:bg-light-bg dark:hover:bg-dark-bg hover:text-light-text dark:hover:text-dark-text'
    }`;

  useEffect(() => {
    setCurrentCode(defaultCode);
    setLastRunCode(null);
  }, [defaultCode]);

  const updateLoading = (message: string, progress: number) => {
    setLoadingMessage(message);
    setLoadingProgress(progress);
  };

  const clearLoading = () => {
    setLoadingMessage('');
    setLoadingProgress(0);
  };

  const loadRequiredPackages = async (pyodide: any) => {
    // Load standard scientific libs if mentioned in code
    const libsToLoad: string[] = [];
    if (currentCode.includes('numpy')) libsToLoad.push('numpy');
    if (currentCode.includes('pandas')) libsToLoad.push('pandas');
    if (currentCode.includes('matplotlib')) libsToLoad.push('matplotlib');
    if (currentCode.includes('sympy')) libsToLoad.push('sympy');
    if (currentCode.includes('sklearn')) libsToLoad.push('scikit-learn');
    if (currentCode.includes('scipy')) libsToLoad.push('scipy');
    if (currentCode.includes('PIL') || currentCode.includes('pillow')) libsToLoad.push('pillow');

    if (libsToLoad.length > 0) {
      updateLoading(`Loading packages: ${libsToLoad.join(', ')}`, 46);
      await pyodide.loadPackage(libsToLoad);
    }

    // Some visualization helpers are pure Python and are best installed with micropip.
    if (currentCode.includes('seaborn') || currentCode.includes('load_dataset') || currentCode.includes('networkx')) {
      updateLoading("Installing browser Python packages", 68);
      await pyodide.loadPackage("micropip");
      await pyodide.runPythonAsync(`
import micropip
${currentCode.includes('seaborn') || currentCode.includes('load_dataset') ? "await micropip.install('seaborn')" : ""}
${currentCode.includes('networkx') ? "await micropip.install('networkx')" : ""}
await micropip.install('pyodide-http')
import pyodide_http
pyodide_http.patch_all()
      `);
    }
  };

  const initPyodide = async () => {
    if (window.pyodideInstance) {
      pyodideRef.current = window.pyodideInstance;
      return window.pyodideInstance;
    }

    setIsInitializing(true);
    updateLoading("Preparing Python runtime", 18);
    
    try {
      const pyodide = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v314.0.5/full/"
      });

      window.pyodideInstance = pyodide;
      pyodideRef.current = pyodide;
      setIsInitializing(false);
      return pyodide;
    } catch (err) {
      setConsoleOutput([`Error: ${err}`]);
      setShowTerminal(true);
      setActiveTab('output');
      setIsInitializing(false);
      throw err;
    }
  };

  const runCode = async () => {
    if (isRunning) return;
    setLastRunCode(currentCode);

    // JavaScript/TypeScript execution
    if (language === 'javascript' || language === 'typescript') {
      setIsRunning(true);
      setShowTerminal(true);
      setActiveTab('output');
      setPlotImage(null);
      setConsoleOutput([]);
      updateLoading("Running JavaScript", 60);

      const logs: string[] = [];
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;

      console.log = (...args) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
      };
      console.error = console.log;
      console.warn = console.log;

      try {
        // For TypeScript, we'd ideally transpile, but for simple snippets we can try to just run it
        // and catch syntax errors. Most examples will be valid JS anyway.
        const fn = new Function(currentCode);
        fn();
        
        setConsoleOutput([
          ...logs,
          "",
          "Process exited successfully"
        ]);
      } catch (err: any) {
        setConsoleOutput([...logs, "", `Error: ${err.message}`]);
      } finally {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
        setIsRunning(false);
        clearLoading();
      }
      return;
    }

    // ponytail: language prop drives execution; no content sniffing
    const isLegacy = language === 'c' || language === 'cpp' || language === 'git' || language === 'bash' || language === 'rust';

    if (isLegacy) {
      setShowTerminal(true);
      setActiveTab('output');
      setPlotImage(null);
      setIsRunning(true);
      const out = (initialOutput || "Process exited successfully.").replace(/\\n/g, '\n');
      const lines = out.split('\n');
      setConsoleOutput([
        ...lines,
        "", 
        "Process exited with status 0"
      ]);
      setIsRunning(false);
      return;
    }

    setIsRunning(true);
    setShowTerminal(true);
    setActiveTab('output');
    setPlotImage(null);
    setConsoleOutput([]);
    updateLoading("Running code", 30);
    const usesPythonVisuals = /matplotlib|seaborn|pyplot|plt\.|networkx|libreuni_visual|savefig|\.svg|\.png|\.jpg|\.jpeg/i.test(currentCode);

    try {
      const pyodide = pyodideRef.current || await initPyodide();
      await loadRequiredPackages(pyodide);

      if (usesPythonVisuals) {
        updateLoading("Preparing visualization support", 74);
        await pyodide.loadPackage(['matplotlib']);
      }
      
      // Setup stdout capture
      let outputLogs: string[] = [];
      pyodide.setStdout({
        batched: (str: string) => {
          outputLogs.push(str);
        }
      });

      await pyodide.runPythonAsync(`
import os
for _path in [
    "/tmp/libreuni-visual.svg",
    "/tmp/libreuni-visual.png",
    "/tmp/libreuni-visual.jpg",
    "/tmp/libreuni-visual.jpeg",
]:
    try:
        os.remove(_path)
    except FileNotFoundError:
        pass
      `);

      // Handle Python visual output, including Matplotlib/Seaborn/NetworkX diagrams.
      if (usesPythonVisuals) {
        await pyodide.runPythonAsync(`
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
plt.close('all')
        `);
      }

      await pyodide.runPythonAsync(currentCode);
      
      // Capture a generated visual if the code produced one. Authors can either
      // draw with matplotlib or write /tmp/libreuni-visual.{svg,png,jpg}.
      if (usesPythonVisuals) {
        updateLoading("Rendering visual output", 88);
        const plotB64 = await pyodide.runPythonAsync(`
import os
import io
import base64
_visual = ""
for _path, _mime in [
    ("/tmp/libreuni-visual.svg", "image/svg+xml"),
    ("/tmp/libreuni-visual.png", "image/png"),
    ("/tmp/libreuni-visual.jpg", "image/jpeg"),
    ("/tmp/libreuni-visual.jpeg", "image/jpeg"),
]:
    if os.path.exists(_path):
        with open(_path, "rb") as _file:
            _visual = "data:" + _mime + ";base64," + base64.b64encode(_file.read()).decode("utf-8")
        break
if not _visual and "libreuni_visual" in globals():
    _candidate = libreuni_visual
    if isinstance(_candidate, bytes):
        _visual = "data:image/png;base64," + base64.b64encode(_candidate).decode("utf-8")
    elif isinstance(_candidate, str):
        _visual = _candidate if _candidate.startswith("data:") else "data:image/svg+xml;base64," + base64.b64encode(_candidate.encode("utf-8")).decode("utf-8")
if not _visual and plt.get_fignums():
    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", dpi=144)
    buf.seek(0)
    _visual = "data:image/png;base64," + base64.b64encode(buf.read()).decode("utf-8")
_visual
        `);
        if (plotB64) {
          setPlotImage(plotB64);
        }
      }

      setConsoleOutput(prev => [
          ...prev,
          ...outputLogs,
          "", 
          "Process exited successfully"
      ]);
    } catch (err: any) {
      setConsoleOutput(prev => [...prev, "", `Error: ${err.message}`]);
    } finally {
      setIsRunning(false);
      setIsInitializing(false);
      clearLoading();
    }
  };

  const resetCode = () => {
    setCurrentCode(defaultCode);
    setConsoleOutput([]);
    setShowTerminal(false);
    setActiveTab(initialTab);
    setPlotImage(null);
    setLastRunCode(null);
    clearLoading();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openOutput = () => {
    setActiveTab('output');
    if (!isBusy && shouldRunOnOutput) {
      runCode();
    }
  };

  return (
    <div className="code-runner my-12 group">
      <div className="print-static-lab hidden">
        <div className="print-static-label">{title}</div>
        <pre className="print-static-code"><code>{defaultCode}</code></pre>
        {initialOutput && (
          <>
            <div className="print-static-subhead">Expected output</div>
            <pre className="print-static-output"><code>{initialOutput.replace(/\\n/g, '\n')}</code></pre>
          </>
        )}
      </div>

      <div className="bg-light-bg dark:bg-dark-surface rounded-lg overflow-hidden border border-light-border dark:border-dark-border shadow-xl transition-all duration-300 group-hover:border-primary/30">
        <div className="border-b border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-surface px-4 py-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={`${title} lab sections`}>
            {hasDescription && (
              <button type="button" role="tab" aria-selected={activeTab === 'guide'} className={tabButtonClass('guide')} onClick={() => setActiveTab('guide')}>
                <BookOpen size={14} />
                Topic
              </button>
            )}
            <button type="button" role="tab" aria-selected={activeTab === 'code'} className={tabButtonClass('code')} onClick={() => setActiveTab('code')}>
              <Code2 size={14} />
              Code
            </button>
            <button type="button" role="tab" aria-selected={activeTab === 'output'} className={tabButtonClass('output')} onClick={openOutput}>
              {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Terminal size={14} />}
              {outputIsStale ? "Output *" : "Output"}
            </button>
          </div>
        </div>

        {loadingMessage && (
          <div className="border-b border-light-border dark:border-dark-border bg-primary/5 px-5 sm:px-6 py-3" role="status" aria-live="polite">
            <div className="mb-2 flex items-center justify-between gap-4 text-xs font-bold text-primary">
              <span>{loadingMessage}</span>
              <span>{Math.max(10, Math.min(96, loadingProgress))}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-md bg-primary/15">
              <div
                className="h-full rounded-md bg-primary transition-all duration-500"
                style={{ width: `${Math.max(10, Math.min(96, loadingProgress))}%` }}
              />
            </div>
          </div>
        )}

        <div className="min-h-[460px]">
          {hasDescription && activeTab === 'guide' && (
            <section className="px-5 py-8 sm:px-8" role="tabpanel">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase text-primary">
                  {displayLanguage}
                </div>
                <h4 className="mb-3 text-xl font-black text-light-text dark:text-dark-text">{title}</h4>
                <p className="mb-5 text-sm leading-7 text-light-muted dark:text-dark-muted">
                  {description || "Read the code, make a small change, then run it and inspect the output. Runtime setup messages stay outside the terminal so the result remains focused on what the program prints."}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {['Inspect the idea', 'Edit the program', 'Run and compare'].map((step, index) => (
                    <div key={step} className="rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-bg/40 p-4">
                      <div className="mb-2 text-xs font-black uppercase text-primary">Step {index + 1}</div>
                      <div className="text-sm font-bold text-light-text dark:text-dark-text">{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'code' && (
          <div className="flex h-[600px] flex-col bg-light-bg dark:bg-dark-surface/50" role="tabpanel">
            <div className="flex items-center justify-between gap-3 border-b border-light-border bg-light-bg/70 px-4 py-2.5 dark:border-dark-border dark:bg-dark-bg/25">
              <div className="font-mono text-xs font-bold uppercase text-light-muted dark:text-dark-muted">
                {displayLanguage}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={copyCode}
                  aria-label="Copy code"
                  title="Copy Code"
                  className="rounded-md border border-transparent p-2 text-light-muted transition-colors hover:border-light-border hover:bg-light-surface hover:text-primary dark:text-dark-muted dark:hover:border-dark-border dark:hover:bg-dark-bg"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
                <button
                  onClick={resetCode}
                  aria-label="Reset code"
                  title="Reset Code"
                  className="rounded-md border border-transparent p-2 text-light-muted transition-colors hover:border-light-border hover:bg-light-surface hover:text-rose-500 dark:text-dark-muted dark:hover:border-dark-border dark:hover:bg-dark-bg"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>
            <div className="relative flex-1 group/editor overflow-auto">
              <div className="relative min-h-full" style={{ minWidth: 'max-content', width: '100%' }}>
                <textarea
                  value={currentCode}
                  onChange={(e) => setCurrentCode(e.target.value)}
                  aria-label={`${title} code editor`}
                  className="absolute inset-0 w-full h-full pt-[30px] pb-[30px] pr-[30px] pl-[64px] font-mono text-[15px] leading-[25px] bg-transparent text-transparent caret-primary resize-none focus:outline-none z-10 selection:bg-primary/30 overflow-hidden whitespace-pre"
                  spellCheck="false"
                  style={{ fontVariantLigatures: 'none', caretColor: 'var(--primary)' }}
                />
                <div className="p-[30px] font-mono text-[15px] leading-[25px] pointer-events-none hl-default">
                  {currentCode.split('\n').map((line, i) => (
                      <div key={i} className="flex gap-[20px] group/line min-h-[25px]">
                          <span className="text-light-muted dark:text-dark-muted select-none text-right w-[14px] opacity-25 inline-block font-mono text-xs">{i + 1}</span>
                          <span dangerouslySetInnerHTML={{ __html: highlightCode(line) || '&nbsp;' }} className="whitespace-pre" />
                      </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          )}

          {activeTab === 'output' && (
          <div className="min-h-[460px] bg-light-surface p-4 dark:bg-dark-bg sm:p-6" role="tabpanel">
             <div className="overflow-hidden rounded-lg border border-slate-300/80 bg-slate-950 shadow-2xl shadow-slate-950/10 dark:border-slate-700">
               <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3">
                 <div className="flex min-w-0 items-center gap-3">
                   <div className="flex gap-1.5">
                     <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                     <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                     <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                   </div>
                   <span className="truncate font-mono text-[11px] font-bold uppercase text-slate-300">
                     libreuni:{displayLanguage}:stdout
                   </span>
                 </div>
                 <button
                   onClick={runCode}
                   disabled={isBusy}
                   aria-label="Rerun code"
                   title="Rerun Code"
                   className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-slate-100 transition-colors hover:border-primary/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                 >
                   {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
                   {isBusy ? "Running" : "Rerun"}
                 </button>
               </div>

               <div className="border-b border-slate-800 bg-slate-900/70 px-4 py-2 font-mono text-[11px] text-slate-400">
                 <span className="text-primary">$</span> run {displayLanguage}
                 {outputIsStale && <span className="ml-3 text-amber-300">modified since last run</span>}
               </div>

               <div className="min-h-[330px] overflow-auto px-4 py-4 font-mono text-[13px] leading-6 text-slate-100 [font-variant-numeric:tabular-nums]">
                {!showTerminal && !isBusy && (
                  <div className="text-slate-400">
                    Opening this tab runs the code and prints output here.
                  </div>
                )}
                {showTerminal && consoleOutput.length === 0 && !plotImage && isBusy && (
                  <div className="text-slate-400">
                    Waiting for program output...
                  </div>
                )}
                {consoleOutput.map((line, i) => {
                  const isError = line.startsWith('Error');
                  const isExit = line.startsWith('Process exited');
                  return (
                    <div key={i} className={`grid min-h-[24px] grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-l border-transparent ${isError ? 'text-rose-300' : isExit ? 'text-sky-300' : 'text-emerald-200'}`}>
                      <span className="select-none text-right text-[11px] text-slate-600">{line ? i + 1 : ""}</span>
                      <span className="whitespace-pre-wrap break-words">{line || " "}</span>
                    </div>
                  );
                })}
                
                {plotImage && (
                  <div className="mt-6 rounded-md overflow-hidden border border-slate-700 bg-slate-900 p-4 group/plot">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase">
                            <ImageIcon size={12} />
                            Generated Visual
                        </div>
                    </div>
                    <img src={plotImage} alt="Python generated visual output" className="w-full h-auto rounded-md shadow-2xl transition-transform group-hover:scale-[1.02]" />
                  </div>
                )}
               </div>
             </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
