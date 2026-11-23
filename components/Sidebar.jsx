"use client";

import { FolderKanban, LayoutDashboard, Network, Plus, X } from "lucide-react";
import { recentProjects } from "@/lib/agents";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "new", label: "New Analysis", icon: Plus },
];

export default function Sidebar({
  activeView,
  activeProjectId,
  onNavigate,
  onSelectProject,
  open,
  onClose,
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-white/8 bg-[#141318] px-4 py-5 transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <Network size={18} strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-medium tracking-tight text-zinc-50">
                MindMesh
              </p>
              <p className="text-[11px] tracking-wide text-zinc-500">
                Multi-agent workspace
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-zinc-100 md:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-violet-500/15 text-violet-100"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                }`}
              >
                <Icon size={16} strokeWidth={1.75} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 px-2">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-medium tracking-[0.16em] text-zinc-500 uppercase">
            <FolderKanban size={12} />
            Recent projects
          </p>
          <ul className="space-y-1">
            {recentProjects.map((project) => {
              const active = activeProjectId === project.id;
              return (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => onSelectProject(project)}
                    className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors ${
                      active
                        ? "bg-white/6 text-zinc-100"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                    }`}
                  >
                    <span className="block text-sm">{project.title}</span>
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      {project.detail}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mt-auto px-3 pt-8 text-xs leading-5 text-zinc-600">
          Interface preview. Agent responses are sample text until the model is
          connected.
        </p>
      </aside>
    </>
  );
}
