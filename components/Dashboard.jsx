"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, Sparkles } from "lucide-react";
import { agents } from "@/lib/agents";
import AgentCard from "@/components/AgentCard";
import ReportPanel from "@/components/ReportPanel";
import Sidebar from "@/components/Sidebar";

const HISTORY_KEY = "mindmesh.recent-searches.v1";

export default function Dashboard() {
  const [recentSearches, setRecentSearches] = useState([]);
  const [storageError, setStorageError] = useState(null);
  const history = useRef([]);
  const [activeView, setActiveView] = useState("dashboard");
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [problem, setProblem] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const activeRequest = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      history.current = Array.isArray(saved) ? saved.filter((entry) =>
        entry && typeof entry.id === "string" && typeof entry.problem === "string" &&
        entry.analysis && typeof entry.analysis.outputs === "object" && entry.analysis.outputs !== null
      ).slice(0, 30) : [];
      // Restore browser storage after hydration, when localStorage is available.
      setRecentSearches(history.current);
    } catch {
      setStorageError("Saved searches could not be loaded from this browser.");
    }
    return () => activeRequest.current?.abort();
  }, []);

  function saveSearch(brief, savedAnalysis, savedError) {
    const entry = {
      id: crypto.randomUUID(),
      problem: brief,
      analysis: savedAnalysis,
      error: savedError,
      createdAt: new Date().toISOString(),
    };
    const updated = [entry, ...history.current].slice(0, 30);
    history.current = updated;
    setRecentSearches(updated);
    setActiveProjectId(entry.id);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      setStorageError(null);
    } catch {
      setStorageError("This search is available for this session, but could not be saved in this browser. Storage may be full or disabled.");
    }
  }

  function cancelAnalysis() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setRunning(false);
    setError(null);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function startNewAnalysis() {
    cancelAnalysis();
    setActiveView("new");
    setActiveProjectId(null);
    setProblem("");
    setAnalysis(null);
    setRunning(false);
    closeMenu();
  }

  function handleNavigate(view) {
    if (view === "new") {
      startNewAnalysis();
      return;
    }
    setActiveView("dashboard");
    closeMenu();
  }

  function handleSelectProject(project) {
    cancelAnalysis();
    setActiveView("dashboard");
    setActiveProjectId(project.id);
    setProblem(project.problem);
    setAnalysis(project.analysis || null);
    setError(project.error || null);
    closeMenu();
  }

  async function handleAnalyze() {
    if (running) return;
    const brief = problem.trim();
    if (!brief) { setError({ message: "Describe your problem before starting an analysis." }); return; }
    const controller = new AbortController();
    activeRequest.current = controller;
    setError(null);
    setAnalysis(null);
    setActiveProjectId(null);
    setRunning(true);
    setActiveView("dashboard");
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ problem: brief }), signal: controller.signal });
      const result = await response.json();
      if (activeRequest.current !== controller) return;
      const savedAnalysis = { outputs: result.outputs || {}, report: result.report || null, provider: result.provider, model: result.model };
      const savedError = response.ok ? null : result.error || { message: "Analysis failed. Please retry." };
      setAnalysis(savedAnalysis);
      setError(savedError);
      if (response.ok || Object.keys(savedAnalysis.outputs).length > 0 || savedAnalysis.report) {
        saveSearch(brief, savedAnalysis, savedError);
      }
    } catch (failure) {
      if (activeRequest.current === controller && failure.name !== "AbortError") setError({ message: "Could not reach the analysis service. Check your connection and retry." });
    } finally {
      if (activeRequest.current === controller) { setRunning(false); activeRequest.current = null; }
    }
  }

  return (
    <div className="min-h-screen bg-[#121116] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.16),transparent_55%)]" />
      <div className="relative flex min-h-screen">
        <Sidebar
          recentSearches={recentSearches}
          activeView={activeView}
          activeProjectId={activeProjectId}
          onNavigate={handleNavigate}
          onSelectProject={handleSelectProject}
          open={menuOpen}
          onClose={closeMenu}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-white/8 px-4 py-3 md:hidden">
            <button
              type="button"
              className="rounded-lg p-2 text-zinc-300 hover:bg-white/5"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
            <span className="text-sm font-medium">MindMesh</span>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
            <p className="text-[11px] font-medium tracking-[0.2em] text-violet-300/90 uppercase">
              MindMesh
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-medium tracking-tight text-zinc-50 sm:text-5xl">
              Think beyond one perspective.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              Specialized agents work the same problem from different seats.
              Research, strategy, invention, and criticism stay visible, then
              fold into one report you can actually use.
            </p>

            <section className="mt-10 rounded-3xl border border-white/8 bg-[#1b1a22]/90 p-4 shadow-none sm:p-6">
              <label
                htmlFor="challenge"
                className="block px-1 text-sm font-medium text-zinc-200"
              >
                Describe the challenge
              </label>
              <textarea
                id="challenge"
                value={problem}
                maxLength={10000}
                disabled={running}
                onChange={(event) => setProblem(event.target.value)}
                placeholder="What decision, tension, or question should the agents take apart?"
                className="mt-3 min-h-40 w-full resize-y rounded-2xl border border-white/8 bg-[#121116] px-4 py-4 text-sm leading-7 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-400/50"
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="px-1 text-xs text-zinc-500">
                  {running
                    ? "Running Research, Strategy, Creative, Critic, then synthesis. This may take a few minutes."
                    : "Your problem is sent to the configured AI provider. Up to 10,000 characters."}
                </p>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={running}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-400 disabled:cursor-wait disabled:opacity-70"
                >
                  <Sparkles size={16} strokeWidth={1.75} />
                  {running ? "Analyzing…" : "Analyze with MindMesh"}
                </button>
              </div>
              {analysis?.provider && <p className="mt-3 text-xs text-zinc-400">Provider: {analysis.provider === "groq" ? "Groq" : "Gemini"} · Model: {analysis.model}</p>}
              {storageError && <p role="status" className="mt-3 text-xs text-amber-300">{storageError}</p>}
              {error && (
                <div role="alert" className="mt-4 space-y-2 text-sm text-red-300">
                  <p>{error.stage ? `${error.stage[0].toUpperCase()}${error.stage.slice(1)} could not finish: ` : ""}{error.message}</p>
                  {error.providerMessage && <p className="break-words text-xs text-zinc-400">{analysis?.provider === "groq" ? "Groq" : "Provider"}{error.providerHttpStatus ? ` HTTP ${error.providerHttpStatus}` : ""}{error.providerCode ? ` (${error.providerCode})` : ""}: {error.providerMessage}</p>}
                  {error.retryAfterSeconds && <p>Please wait at least {error.retryAfterSeconds} {error.retryAfterSeconds === 1 ? "second" : "seconds"} before retrying.</p>}
                  {Object.keys(analysis?.outputs || {}).length > 0 && <p>Completed agent outputs are still available below.</p>}
                  {error.stage && error.stage !== "report" && <p>Later stages were not run.</p>}
                </div>
              )}
            </section>

            <section className="mt-8">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium text-zinc-50">Agents</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Four seats on the same problem. Each keeps its own output.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {agents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    output={analysis?.outputs[agent.id]}
                    status={analysis?.outputs[agent.id] ? "Completed" : error?.stage === agent.id ? "Failed" : running ? "Awaiting results" : error?.stage ? "Not run" : "Ready"}
                  />
                ))}
              </div>
            </section>

            <div className="mt-4">
              <ReportPanel report={analysis?.report} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
