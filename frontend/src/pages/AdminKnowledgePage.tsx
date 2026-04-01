import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import AdminShell from "../components/AdminShell";
import { api, type Source } from "../lib/api";

const emptyForm = { id: "", title: "", tags: "", content: "" };

export default function AdminKnowledgePage() {
  const [items, setItems] = useState<Source[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const payload = query.trim() ? await api.searchKnowledge(query, 30) : await api.listKnowledge();
      setItems(payload.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const mode = form.id ? "编辑知识条目" : "新增知识条目";
  const tagList = useMemo(() => form.tags.split(",").map((item) => item.trim()).filter(Boolean), [form.tags]);

  async function submit() {
    if (!form.title.trim() || !form.content.trim()) return;
    if (form.id) await api.updateKnowledge(form.id, form.title, form.content, tagList);
    else await api.addKnowledge(form.title, form.content, tagList);
    setForm(emptyForm);
    await refresh();
  }

  async function remove(id: string) {
    await api.deleteKnowledge(id);
    await refresh();
  }

  function edit(item: Source) {
    setForm({ id: item.id, title: item.title, tags: item.tags.join(","), content: item.snippet });
  }

  return (
    <AdminShell title="知识库内容" subtitle="Knowledge Database">
      <section className="mx-auto w-[min(1240px,calc(100%-28px))] py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.22em] text-cyan-700">RAG Data</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">知识库数据库管理</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">列出当前后端知识条目，支持新增、编辑、删除和关键词检索。</p>
          </div>
          <div className="flex w-full gap-2 lg:w-[420px]">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 w-full rounded-[8px] border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-cyan-400" placeholder="输入关键词检索" />
            </div>
            <button onClick={() => void refresh()} className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-slate-950 px-4 text-sm font-semibold text-white">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              查询
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[420px_1fr]">
          <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-semibold">{mode}</h3>
            <label className="mt-4 block text-sm font-medium text-slate-600">标题</label>
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-2 h-10 w-full rounded-[8px] border border-slate-200 px-3 outline-none focus:border-cyan-400" />
            <label className="mt-4 block text-sm font-medium text-slate-600">标签，使用英文逗号分隔</label>
            <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} className="mt-2 h-10 w-full rounded-[8px] border border-slate-200 px-3 outline-none focus:border-cyan-400" />
            <label className="mt-4 block text-sm font-medium text-slate-600">内容</label>
            <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className="mt-2 min-h-52 w-full resize-y rounded-[8px] border border-slate-200 p-3 leading-6 outline-none focus:border-cyan-400" />
            <div className="mt-4 flex gap-2">
              <button onClick={() => void submit()} className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-cyan-700 px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={!form.title.trim() || !form.content.trim()}>
                <Plus className="h-4 w-4" />
                保存
              </button>
              <button onClick={() => setForm(emptyForm)} className="h-10 rounded-[8px] border border-slate-200 px-4 text-sm font-semibold text-slate-700">清空</button>
            </div>
          </section>

          <section className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-[1.1fr_1.6fr_160px] gap-4 border-b border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
              <span>标题 / 标签</span>
              <span>内容片段</span>
              <span className="text-right">操作</span>
            </div>
            <div className="max-h-[620px] overflow-auto">
              {items.map((item) => (
                <article key={item.id} className="grid grid-cols-1 gap-3 border-b border-slate-100 px-4 py-4 text-sm lg:grid-cols-[1.1fr_1.6fr_160px] lg:items-start">
                  <div>
                    <h4 className="font-semibold text-slate-950">{item.title}</h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => <span key={tag} className="rounded-[8px] bg-cyan-50 px-2 py-1 text-xs text-cyan-800">{tag}</span>)}
                    </div>
                    <p className="mt-2 truncate text-xs text-slate-400">{item.id}</p>
                  </div>
                  <p className="leading-6 text-slate-600">{item.snippet}</p>
                  <div className="flex justify-start gap-2 lg:justify-end">
                    <button onClick={() => edit(item)} className="inline-flex h-9 items-center gap-1 rounded-[8px] border border-slate-200 px-3 text-xs font-semibold text-slate-700" title="编辑">
                      <Edit3 className="h-3.5 w-3.5" />
                      编辑
                    </button>
                    <button onClick={() => void remove(item.id)} className="inline-flex h-9 items-center gap-1 rounded-[8px] border border-rose-200 px-3 text-xs font-semibold text-rose-700" title="删除">
                      <Trash2 className="h-3.5 w-3.5" />
                      删除
                    </button>
                  </div>
                </article>
              ))}
              {!items.length && <div className="p-8 text-center text-sm text-slate-500">暂无知识条目</div>}
            </div>
          </section>
        </div>
      </section>
    </AdminShell>
  );
}
