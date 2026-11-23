"use client";

import { FileText, Flag, Scale, ShieldCheck, Target, Wallet } from "lucide-react";

function Items({ items }) {
  return <ul className="space-y-3">{items.map((item, index) => (
    <li key={index} className="flex gap-3 text-sm leading-7 text-zinc-300">
      <span aria-hidden="true" className="mt-3 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
      <span className="min-w-0 break-words">{item}</span>
    </li>
  ))}</ul>;
}

function ReportSection({ id, title, number, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 rounded-2xl border border-white/8 bg-black/10 p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="font-mono text-xs text-violet-400/80">{number}</span>
        <h3 id={`${id}-title`} className="text-base font-medium tracking-tight text-zinc-100">{title}</h3>
      </div>
      {children}
    </section>
  );
}

const navigation = [
  ["report-diagnosis", "Diagnosis"], ["report-evidence", "Evidence"],
  ["report-solution", "Solution"], ["report-roadmap", "Roadmap"],
  ["report-budget", "Resources"], ["report-risks", "Risks & ethics"],
  ["report-metrics", "Metrics"], ["report-critic", "Critical review"],
];

export default function ReportPanel({ report }) {
  return (
    <section aria-labelledby="consolidated-report-title" className="overflow-hidden rounded-3xl border border-violet-400/15 bg-[#1b1a22]">
      <div className="border-b border-white/8 bg-gradient-to-br from-violet-500/12 via-transparent to-transparent p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-500/10 text-violet-300"><FileText size={20} strokeWidth={1.5} /></span>
          <div>
            <p className="text-[10px] font-medium tracking-[0.2em] text-violet-300 uppercase">MindMesh · Decision brief</p>
            <h2 id="consolidated-report-title" className="mt-2 text-2xl font-medium tracking-tight text-zinc-50">Consolidated report</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">Four perspectives, one considered plan. The original agent outputs remain available above.</p>
          </div>
        </div>
      </div>

      {!report?.executiveSummary ? (
        <div className="p-6 sm:p-8">
          <p className="max-w-xl text-sm leading-7 text-zinc-400">{report ? "This report uses an earlier format. Run a new analysis to generate the expanded report; your original agent outputs remain above." : "Your report will connect the diagnosis to a recommended solution, phased roadmap, resources, risks, and proposed success measures after all four agents complete."}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-500">{["Clear evidence", "Practical roadmap", "Critical review"].map((label) => <span key={label} className="rounded-full border border-white/8 px-3 py-1.5">{label}</span>)}</div>
        </div>
      ) : (
        <div className="space-y-5 p-4 sm:p-6 md:p-8">
          <section aria-labelledby="report-summary-title" className="rounded-2xl border border-violet-400/20 bg-violet-500/5 p-5 sm:p-6">
            <p className="text-[10px] font-medium tracking-[0.18em] text-violet-300 uppercase">The decision at a glance</p>
            <h3 id="report-summary-title" className="mt-2 text-xl font-medium text-zinc-100">Executive summary</h3>
            <p className="mt-4 text-sm leading-8 text-zinc-300">{report.executiveSummary}</p>
          </section>

          <nav aria-label="Report sections" className="flex flex-wrap gap-2 pb-1">
            {navigation.map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-full border border-white/8 px-3 py-2 text-xs text-zinc-400 transition hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-violet-200 focus-visible:outline-2 focus-visible:outline-violet-400">{label}</a>)}
          </nav>

          <div className="grid gap-5 lg:grid-cols-2">
            <ReportSection id="report-diagnosis" title="Problem diagnosis" number="01"><p className="text-sm leading-7 text-zinc-300">{report.problemDiagnosis}</p></ReportSection>
            <ReportSection id="report-research" title="Key research findings" number="02"><Items items={report.keyResearchFindings} /></ReportSection>
          </div>

          <ReportSection id="report-evidence" title="What we know, and what needs validation" number="03">
            <p className="mb-5 text-xs leading-6 text-zinc-500">Agent agreement is not independent verification. Supplied context, evidence, assumptions, and future targets are kept distinct.</p>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["Verified information", report.evidence.verifiedInformation, "No independently verified information was supplied. These agents did not perform external research."],
                ["User-provided context", report.evidence.providedInformation, null],
                ["Assumptions to test", report.evidence.assumptions, null],
                ["Proposed targets", report.evidence.proposedTargets, null],
              ].map(([title, items, empty]) => <div key={title} className="rounded-xl border border-white/6 bg-black/15 p-4"><h4 className="mb-3 text-xs font-medium tracking-wide text-violet-200">{title}</h4>{items.length ? <Items items={items} /> : <p className="text-sm leading-6 text-zinc-500">{empty}</p>}</div>)}
            </div>
          </ReportSection>

          <ReportSection id="report-solution" title="Recommended solution" number="04">
            <div className="flex items-start gap-4"><Flag className="mt-1 shrink-0 text-violet-300" size={19} /><p className="text-sm leading-8 text-zinc-300">{report.recommendedSolution}</p></div>
          </ReportSection>

          <ReportSection id="report-alternatives" title="Alternative innovative approaches" number="05"><Items items={report.alternativeApproaches} /></ReportSection>

          <ReportSection id="report-roadmap" title="Implementation roadmap" number="06">
            <p className="mb-6 text-xs text-zinc-500">Proposed phases and timeframes · validate before committing</p>
            <ol>
              {report.implementationRoadmap.map((phase, index) => <li key={index} className="relative ml-3 border-l border-violet-400/20 pb-7 pl-7 last:border-transparent last:pb-0">
                <span aria-hidden="true" className="absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-violet-400/30 bg-[#262032] font-mono text-[10px] text-violet-200">{index + 1}</span>
                <div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-medium text-zinc-100">{phase.phase}</h4><span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] text-violet-300">{phase.timeframe}</span></div>
                <p className="mt-2 text-xs text-zinc-500">Responsible role: {phase.owner}</p>
                <div className="mt-3"><Items items={phase.actions} /></div>
                <p className="mt-3 rounded-lg border border-white/6 bg-black/15 px-3 py-2 text-xs leading-6 text-zinc-400"><span className="font-medium text-violet-200">Milestone / decision gate: </span>{phase.milestone}</p>
              </li>)}
            </ol>
          </ReportSection>

          <ReportSection id="report-budget" title="Required resources & budget categories" number="07">
            <p className="mb-5 flex items-start gap-2 text-xs leading-6 text-zinc-500"><Wallet size={15} className="mt-1 shrink-0" />Planning estimates require validation. Amounts below are not verified supplier quotes unless supplied evidence establishes otherwise.</p>
            <div className="overflow-x-auto rounded-xl border border-white/8">
              <table className="w-full min-w-[580px] text-left text-sm">
                <caption className="sr-only">Resources, estimated costs, and the basis of each estimate</caption>
                <thead className="bg-white/3 text-xs text-zinc-400"><tr>{["Category", "Resources", "Estimate / allowance", "Basis & validation"].map((label) => <th key={label} scope="col" className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
                <tbody className="divide-y divide-white/6">{report.resourcesAndBudget.map((item, index) => <tr key={index} className="align-top"><th scope="row" className="px-4 py-4 font-medium text-zinc-200">{item.category}</th><td className="px-4 py-4 leading-6 text-zinc-400">{item.resources}</td><td className="px-4 py-4 leading-6 text-violet-200">{item.estimate}</td><td className="px-4 py-4 leading-6 text-zinc-500">{item.basis}</td></tr>)}</tbody>
              </table>
            </div>
          </ReportSection>

          <ReportSection id="report-risks" title="Risks & mitigation measures" number="08">
            <div className="grid gap-3 md:grid-cols-2">{report.risksAndMitigations.map((item, index) => <div key={index} className="rounded-xl border border-white/6 bg-black/15 p-4"><h4 className="text-sm font-medium leading-6 text-zinc-200">{item.risk}</h4><p className="mt-3 text-sm leading-7 text-zinc-400"><span className="text-violet-300">Mitigation: </span>{item.mitigation}</p></div>)}</div>
          </ReportSection>

          <ReportSection id="report-ethics" title="Ethical & privacy considerations" number="09">
            <div className="mb-4 flex items-center gap-2 text-xs text-violet-300"><ShieldCheck size={15} />Safeguards to build into the solution</div><Items items={report.ethicalAndPrivacyConsiderations} />
          </ReportSection>

          <ReportSection id="report-metrics" title="Success metrics" number="10">
            <p className="mb-5 flex items-center gap-2 text-xs leading-6 text-zinc-500"><Target size={15} />Targets are proposals, not measured results.</p>
            <div className="grid gap-3 md:grid-cols-2">{report.successMetrics.map((item, index) => <div key={index} className="rounded-xl border border-white/8 bg-black/15 p-4"><h4 className="text-sm font-medium text-zinc-100">{item.metric}</h4><dl className="mt-4 space-y-3 text-xs leading-6"><div><dt className="text-zinc-500">Baseline</dt><dd className="text-zinc-400">{item.baseline}</dd></div><div className="rounded-lg bg-violet-500/8 px-3 py-2"><dt className="font-medium text-violet-300">Proposed target</dt><dd className="text-zinc-200">{item.proposedTarget}</dd></div><div><dt className="text-zinc-500">Measurement</dt><dd className="text-zinc-400">{item.measurement}</dd></div></dl></div>)}</div>
          </ReportSection>

          <ReportSection id="report-tradeoffs" title="Contradictions & unresolved tradeoffs" number="11">
            {report.contradictionsAndTradeoffs.length ? <div className="space-y-4">{report.contradictionsAndTradeoffs.map((item, index) => <div key={index} className="border-l-2 border-violet-400/30 pl-4 text-sm leading-7"><h4 className="font-medium text-zinc-200">{item.issue}</h4><p className="mt-2 text-zinc-400"><span className="text-violet-300">Resolution: </span>{item.resolution}</p><p className="mt-2 text-zinc-400"><span className="text-zinc-300">Remaining tradeoff / validation: </span>{item.remainingTradeoff}</p></div>)}</div> : <p className="text-sm leading-7 text-zinc-400">No material contradictions or unresolved tradeoffs were identified in this synthesis.</p>}
          </ReportSection>

          <ReportSection id="report-critic" title="Critic's final recommendations" number="12">
            <div className="mb-4 flex items-center gap-2 text-xs text-violet-300"><Scale size={15} />Corrections and checks to carry into implementation</div><Items items={report.criticRecommendations} />
          </ReportSection>
        </div>
      )}
    </section>
  );
}
