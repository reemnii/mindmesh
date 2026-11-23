"use client";

import { Compass, Scale, Search, Sparkles } from "lucide-react";

const icons = {
  Search,
  Compass,
  Sparkles,
  Scale,
};

export default function AgentCard({ agent, output }) {
  const Icon = icons[agent.icon];

  return (
    <article className="flex min-h-[280px] flex-col rounded-2xl border border-white/8 bg-[#1b1a22] p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/12 text-violet-300">
          <Icon size={18} strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="text-sm font-medium text-zinc-50">{agent.name}</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            {agent.description}
          </p>
        </div>
      </div>

      <div className="mt-5 flex-1 rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-3">
        {output ? (
          <p className="text-sm leading-6 whitespace-pre-line text-zinc-300">
            {output}
          </p>
        ) : (
          <p className="text-sm leading-6 text-zinc-500">
            This agent’s reading will appear here after an analysis.
          </p>
        )}
      </div>
    </article>
  );
}
