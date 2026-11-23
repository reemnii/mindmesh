"use client";

import { Compass, Scale, Search, Sparkles } from "lucide-react";

const icons = {
  Search,
  Compass,
  Sparkles,
  Scale,
};

function label(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function OutputValue({ value }) {
  if (Array.isArray(value)) {
    return value.length ? <ol className="mt-1 list-decimal space-y-3 pl-5 marker:text-violet-300/60">{value.map((item, index) => <li key={index} className="pl-1"><OutputValue value={item} /></li>)}</ol> : <p className="mt-1 text-zinc-500">No material corrections identified.</p>;
  }
  if (value && typeof value === "object") {
    return <dl className="space-y-2 rounded-lg bg-black/15 p-3">{Object.entries(value).map(([key, item]) => <div key={key}><dt className="text-xs font-medium text-violet-300">{label(key)}</dt><dd className="mt-1"><OutputValue value={item} /></dd></div>)}</dl>;
  }
  return <p className="whitespace-pre-line">{value}</p>;
}

export default function AgentCard({ agent, output, status }) {
  const Icon = icons[agent.icon];

  return (
    <article className="flex min-h-[280px] flex-col rounded-2xl border border-white/8 bg-[#1b1a22] p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/12 text-violet-300">
          <Icon size={18} strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="text-sm font-medium text-zinc-50">{agent.name}</h3>
          <p className="mt-1 text-xs text-violet-300" aria-live="polite">{status}</p>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            {agent.description}
          </p>
        </div>
      </div>

      <div className="mt-5 flex-1 rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-3">
        {output ? (
          <div className="space-y-4 text-sm leading-6 text-zinc-300">
            {Object.entries(output).map(([key, value]) => <div key={key}><h4 className="font-medium text-zinc-100">{label(key)}</h4><div className="mt-1"><OutputValue value={value} /></div></div>)}
          </div>
        ) : (
          <p className="text-sm leading-6 text-zinc-500">
            This agent’s reading will appear here after an analysis.
          </p>
        )}
      </div>
    </article>
  );
}
