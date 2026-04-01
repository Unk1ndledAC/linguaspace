import { Activity, Database, Home, Network } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "总览", href: "/admin", icon: Home },
  { label: "健康监测", href: "/admin/health", icon: Activity },
  { label: "知识库", href: "/admin/knowledge", icon: Database },
  { label: "知识图谱", href: "/admin/graph", icon: Network }
];

export default function AdminShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 w-[min(1240px,calc(100%-28px))] flex-col justify-center gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-lg font-semibold tracking-tight">LinguaSpace 管理端</div>
            <div className="text-xs text-slate-500">{subtitle}</div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === "/admin"}
                  className={({ isActive }) =>
                    `inline-flex h-10 items-center gap-2 rounded-[8px] border px-3 text-sm font-medium transition ${
                      isActive ? "border-cyan-300 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950"
                    }`
                  }
                  title={item.label}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>
      <div className="border-b border-slate-200 bg-slate-950">
        <div className="mx-auto flex w-[min(1240px,calc(100%-28px))] items-center justify-between py-4 text-white">
          <h1 className="text-lg font-semibold">{title}</h1>
          <span className="text-xs text-cyan-200">API: {import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"}</span>
        </div>
      </div>
      {children}
    </main>
  );
}
