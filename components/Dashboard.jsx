"use client";

import { useState } from "react";
import { Menu, Sparkles } from "lucide-react";
import { agents } from "@/lib/agents";
import { buildPreviewAnalysis } from "@/lib/previewAnalysis";
import AgentCard from "@/components/AgentCard";
import ReportPanel from "@/components/ReportPanel";
import Sidebar from "@/components/Sidebar";

const sampleProblem =
  "A research group wants help turning a difficult question into a decision. They have conflicting notes, a short deadline, and no interest in a generic summary that erases disagreement.";

export default function Dashboard() {
  const [activeView, setActiveView] = useState("dashboard");
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [problem, setProblem] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [running, setRunning] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  function startNewAnalysis() {
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
    setActiveView("dashboard");
    setActiveProjectId(project.id);
    setProblem(project.problem);
    setAnalysis(null);
    closeMenu();
  }

  function handleAnalyze() {
    const brief = problem.trim() || sampleProblem;
    if (!problem.trim()) setProblem(sampleProblem);
    setRunning(true);
    setActiveView("dashboard");
    window.setTimeout(() => {
      setAnalysis(buildPreviewAnalysis(brief));
      setRunning(false);
    }, 450);
  }

  return (
    <div className="min-h-screen bg-[#121116] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.16),transparent_55%)]" />
      <div className="relative flex min-h-screen">
        <Sidebar
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
                onChange={(event) => setProblem(event.target.value)}
                placeholder="What decision, tension, or question should the agents take apart?"
                className="mt-3 min-h-40 w-full resize-y rounded-2xl border border-white/8 bg-[#121116] px-4 py-4 text-sm leading-7 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-400/50"
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="px-1 text-xs text-zinc-500">
                  {running
                    ? "Preparing a sample reading for the layout."
                    : "Analysis stays local for now. This button previews the layout with sample output."}
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
