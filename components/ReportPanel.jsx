"use client";

import { FileText } from "lucide-react";

export default function ReportPanel({ report }) {
  return (
    <section className="rounded-2xl border border-white/8 bg-[#1b1a22] p-6 md:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/12 text-violet-300">
          <FileText size={18} strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="text-base font-medium text-zinc-50">
            Consolidated report
          </h2>
          <p className="text-sm text-zinc-500">
            Reserved for the synthesis of all four agents.
          </p>
        </div>
      </div>

      {report ? (
        <div className="mt-6 grid gap-6 md:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-5">
            <div>
              <p className="text-[11px] tracking-[0.16em] text-violet-300/80 uppercase">
                Shared reading
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-300">
                {report.reading}
              </p>
            </div>
            <div>
              <p className="text-[11px] tracking-[0.16em] text-violet-300/80 uppercase">
                Recommended path
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-300">{report.path}</p>
            </div>
          </div>
          <div className="rounded-xl bg-black/25 p-4">
            <p className="text-[11px] tracking-[0.16em] text-zinc-500 uppercase">
              Still open
            </p>
            <ul className="mt-3 space-y-3">
              {report.questions.map((question) => (
                <li
                  key={question}
                  className="border-l border-violet-400/40 pl-3 text-sm leading-6 text-zinc-300"
                >
                  {question}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-white/10 bg-black/20 px-5 py-8">
          <p className="max-w-xl text-sm leading-7 text-zinc-500">
            The final report will gather the shared reading, the recommended
            path, and the questions the agents still disagree on.
          </p>
        </div>
      )}
    </section>
  );
}
