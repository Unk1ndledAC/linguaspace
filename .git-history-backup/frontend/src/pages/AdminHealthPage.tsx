import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, RefreshCw } from "lucide-react";
import AdminShell from "../components/AdminShell";
import { api, type HealthResponse } from "../lib/api";

function statusLabel(ok: boolean | null | undefined) {
  if (ok === true) return { text: "正常", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 };
  if (ok === false) return { text: "异常", className: "border-rose-200 bg-rose-50 text-rose-700", icon: AlertTriangle };
  return { text: "未知", className: "border-slate-200 bg-slate-100 text-slate-600", icon: CircleDashed };
}

export default function AdminHealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const healthPayload = await api.health();
      setHealth(healthPayload);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const components = useMemo(() => Object.entries(health?.components ?? {}), [health]);

  return (
    <AdminShell title="系统健康监测" subtitle="Health Monitor">
      <section className="mx-auto w-[min(1240px,calc(100%-28px))] py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.22em] text-cyan-700">Runtime</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">系统 / 框架状态卡片</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">每个依赖组件独立展示，便于快速判断本机部署是否完整可用。</p>
          </div>
          <button onClick={() => void refresh()} className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {components.map(([name, component]) => {
            const status = statusLabel(component.ok);
            const Icon = status.icon;
            return (
              <article key={name} className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[.16em] text-slate-400">component</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-[8px] border px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {status.text}
                  </span>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  {Object.entries(component).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-3 border-t border-slate-100 pt-2">
                      <dt className="text-slate-500">{key}</dt>
                      <dd className="max-w-[65%] truncate text-right font-medium text-slate-800">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            );
          })}
        </div>
      </section>
    </AdminShell>
  );
}
