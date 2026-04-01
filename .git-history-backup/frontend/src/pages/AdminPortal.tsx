import { Activity, Database, Network, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import AdminShell from "../components/AdminShell";

const modules = [
  {
    title: "系统健康监测",
    description: "查看 API、PostgreSQL、Redis、MinIO、Neo4j、Ollama、视觉模型、TTS、ASR 的运行状态。",
    href: "/admin/health",
    icon: Activity
  },
  {
    title: "知识库内容",
    description: "以数据库管理视角维护当前 RAG 知识条目，支持新增、编辑、删除与检索。",
    href: "/admin/knowledge",
    icon: Database
  },
  {
    title: "知识图谱",
    description: "网状展示景点、民族、节庆、非遗、礼仪等关系，并支持关系数据维护。",
    href: "/admin/graph",
    icon: Network
  }
];

export default function AdminPortal() {
  return (
    <AdminShell title="管理端控制台" subtitle="LinguaSpace Admin">
      <section className="border-b border-slate-200/70 bg-white">
        <div className="mx-auto w-[min(1240px,calc(100%-28px))] py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.22em] text-cyan-700">Admin Console</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">简洁科技风管理中枢</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                管理端已拆分为独立页面，用于系统运行监测、知识库维护和文化知识图谱治理。所有数据均通过后端 API 读取或写入。
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-[8px] border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
              <ShieldCheck className="h-5 w-5" />
              单机演示环境
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-[min(1240px,calc(100%-28px))] gap-4 py-8 md:grid-cols-3">
        {modules.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} to={item.href} className="group rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg">
              <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-slate-950 text-cyan-300">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">{item.description}</p>
              <span className="mt-5 inline-flex text-sm font-semibold text-cyan-700 group-hover:text-cyan-600">进入模块</span>
            </Link>
          );
        })}
      </section>
    </AdminShell>
  );
}
