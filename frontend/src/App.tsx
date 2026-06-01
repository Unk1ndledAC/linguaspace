import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowRight, Bot, Camera, Compass, Database, GraduationCap, Languages, Map, MessageCircle, Mic, Network, RefreshCw, Save, Search, Send, Shield, Sparkles, Trash2, Upload, UserRound, WandSparkles } from "lucide-react";
import { api, type Knowledge, type Relation } from "./lib/api";

const path = () => window.location.pathname.replace(/\/+$/, "") || "/";
const go = (href: string) => { window.location.href = href; };

function Shell({ title, eyebrow, nav, children }: { title: string; eyebrow: string; nav: [string, string][]; children: React.ReactNode }) {
  return <><header className="topbar"><div><b>{title}</b><small>{eyebrow}</small></div><nav>{nav.map(([label, href]) => <a className={path() === href ? "active" : ""} href={href} key={href}>{label}</a>)}</nav></header><main className="workspace">{children}</main></>;
}

function Home() {
  const portals = [
    ["游客端", "多模态智能导览", "/visitor", MessageCircle],
    ["学生端", "AI 导游实训平台", "/student", GraduationCap],
    ["导游端", "真人导游协同工作台", "/guide", UserRound],
    ["管理端", "知识与系统治理中心", "/admin", Shield],
  ] as const;
  const features = [[Languages, "多语文化问答", "审核知识与本机模型共同生成可追踪回答"], [Camera, "拍照识别讲解", "视觉模型提取线索，再进入可信 RAG 链路"], [Mic, "语音交互播报", "面向移动游览场景的自然输入与讲解播报"], [Network, "文化关系图谱", "连接地点、民族、节庆、非遗、建筑与菜品"]] as const;
  const places = [["大理古城", "苍山洱海之间的白族文化记忆", "dali-ancient-town-CHirUmdU.jpg"], ["丽江古城", "水系、院落与纳西族生活空间", "lijiang-old-town-BdFkiR19.jpg"], ["石林", "自然遗产与彝族叙事交织", "stone-forest-iGsxtYXK.jpg"], ["西双版纳", "雨林生态与傣族礼仪", "xishuangbanna-BzAqt_Pq.jpg"]] as const;
  return <main className="home">
    <header className="home-nav"><a className="brand" href="/"><b>语界</b><span>LinguaSpace</span></a><nav><a href="#experience">核心能力</a><a href="#portals">客户端入口</a><a href="#places">云南目的地</a></nav><a className="nav-action" href="/visitor">开始探索 <ArrowRight/></a></header>
    <section className="hero"><div className="hero-copy"><p className="hero-kicker">LINGUASPACE / YUNNAN CULTURE INTELLIGENCE</p><h1>语界</h1><h2>听见云南，也读懂云南</h2><p>连接多模态导览、文旅知识库、文化图谱、导游协同与人才实训。以审核知识约束 AI，让每一次讲解有来源、有边界、可追踪。</p><div className="hero-actions"><a className="gold-button" href="/visitor"><Compass/> 游客智能导览</a><a className="ghost-button" href="#portals">进入四端平台 <ArrowRight/></a></div></div><div className="hero-stat"><span>可信知识库</span><b>63</b><span>条云南文旅知识</span></div><div className="scroll-note">SCROLL TO DISCOVER</div></section>
    <section className="intro-band" id="experience"><div><p className="eyebrow">TRUSTED CULTURE AI</p><h2>不只是回答，更是可追溯的文化服务</h2></div><p>图片、语音、文字和位置线索进入统一编排链路。每一条文化解释都先经过审核知识检索，再由模型组织为自然讲解。</p></section>
    <section className="feature-grid">{features.map(([Icon, title, desc]) => <article className="feature-card" key={title}><Icon/><h3>{title}</h3><p>{desc}</p></article>)}</section>
    <section className="portal-section" id="portals"><p className="eyebrow">FOUR INDEPENDENT PORTALS</p><h2>一套文化底座，四个独立工作入口</h2><section className="portal-grid">{portals.map(([name, desc, href, Icon]) => <button className="portal-card" onClick={() => go(href)} key={href}><Icon/><strong>{name}</strong><span>{desc}</span><ArrowRight/></button>)}</section></section>
    <section className="place-section" id="places"><div className="section-title"><div><p className="eyebrow">YUNNAN STORIES</p><h2>从真实地点，走进云南文化网络</h2></div><Sparkles/></div><div className="place-grid">{places.map(([name, desc, image]) => <article className="place-card" key={name}><img src={`/assets/${image}`} alt={name}/><div><h3>{name}</h3><p>{desc}</p></div></article>)}</div></section>
    <footer className="home-footer"><b>语界 LinguaSpace</b><span>云南文旅智能导览与人才培养系统</span></footer>
  </main>;
}

const visitorNav: [string, string][] = [["导览问答", "/visitor"], ["图片理解", "/visitor/image"], ["路线推荐", "/visitor/route"]];

function Visitor() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  async function ask() { if (!question.trim()) return; setAnswer(""); setBusy(true); try { await api.stream(question, chunk => setAnswer(text => text + chunk)); } catch (e) { setAnswer(String(e)); } finally { setBusy(false); } }
  return <Shell title="语界游客端" eyebrow="Visitor AI Guide" nav={visitorNav}><Heading title="可信文化导览" desc="问题由你输入，回答由审核知识库与本机 Ollama 共同生成。"/><section className="panel chat"><textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="请输入想了解的景点、文化、礼仪或服务问题" /><button className="primary" onClick={ask} disabled={busy}><Send/> {busy ? "生成中" : "发送问题"}</button><div className="answer">{answer || "回答将在这里流式显示。"}</div></section></Shell>;
}

function VisitorImage() {
  const [file, setFile] = useState<File>(); const [question, setQuestion] = useState(""); const [result, setResult] = useState<any>(); const [busy, setBusy] = useState(false);
  async function submit() { if (!file) return; setBusy(true); try { setResult(await api.image(file, question || "请讲解图片中的内容")); } finally { setBusy(false); } }
  return <Shell title="语界游客端" eyebrow="Vision Guide" nav={visitorNav}><Heading title="图片理解讲解" desc="视觉模型提取线索，再进入知识库检索，不直接编造文化解释。"/><section className="panel form"><input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0])}/><input value={question} onChange={e => setQuestion(e.target.value)} placeholder="补充你的问题"/><button className="primary" onClick={submit} disabled={!file || busy}><Upload/> {busy ? "识别中" : "上传并识别"}</button>{result && <div className="answer"><b>识别摘要</b><p>{result.vision_summary}</p><b>知识库回答</b><p>{result.answer}</p></div>}</section></Shell>;
}

function VisitorRoute() {
  const [interest, setInterest] = useState(""); const [type, setType] = useState(""); const [result, setResult] = useState<any>();
  return <Shell title="语界游客端" eyebrow="Route Planner" nav={visitorNav}><Heading title="路线推荐" desc="根据你的兴趣和出行方式，从路线库中生成可解释建议。"/><section className="panel form"><input value={type} onChange={e => setType(e.target.value)} placeholder="游客类型，例如亲子、摄影、研学"/><input value={interest} onChange={e => setInterest(e.target.value)} placeholder="兴趣，例如民族文化、自然风光、美食"/><button className="primary" onClick={async () => setResult(await api.route({ visitor_type: type, interest }))}><Map/> 生成路线</button>{result?.items?.map((item: any) => <div className="answer" key={item.route_key}><b>{item.name}</b><p>{item.reason}</p><p>{item.nodes}</p></div>)}</section></Shell>;
}

function Student() {
  const [scenes, setScenes] = useState<any[]>([]); const [selected, setSelected] = useState<any>(); const [answer, setAnswer] = useState(""); const [report, setReport] = useState<any>();
  useEffect(() => { api.scenarios().then(r => { setScenes(r.items); setSelected(r.items[0]); }); }, []);
  return <Shell title="AI 导游实训平台" eyebrow="Student Training" nav={[]}><Heading title="虚拟带团训练" desc="选择实训场景，提交你的现场讲解，系统使用 LLM-as-Judge 与安全规则生成报告。"/><div className="split"><section className="scene-list">{scenes.map(item => <button className={selected?.id === item.id ? "scene active" : "scene"} onClick={() => { setSelected(item); setReport(undefined); }} key={item.id}><b>{item.scene}</b><span>{item.visitor_type}</span></button>)}</section><section className="panel form">{selected && <><span className="pill">{selected.visitor_type}</span><h2>{selected.scene}</h2><p className="question">{selected.question}</p><textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="请输入你的讲解或服务回答"/><button className="primary" onClick={async () => setReport(await api.score({ scenario: selected.scene, question: selected.question, answer }))}><WandSparkles/> 提交评分</button></>}{report && <Report report={report}/>}</section></div></Shell>;
}

function Report({ report }: { report: any }) {
  return <div className="report"><strong>{report.total} 分</strong><small>{report.judge_mode}</small><div className="metric-grid">{Object.entries(report.metrics).map(([key, value]) => <div key={key}><span>{key}</span><b>{String(value)}</b></div>)}</div>{report.feedback.map((item: string) => <p key={item}>{item}</p>)}</div>;
}

function Guide() {
  const [items, setItems] = useState<any[]>([]); const [selected, setSelected] = useState<any>(); const [answer, setAnswer] = useState(""); const [note, setNote] = useState("");
  const refresh = () => api.guideQuestions().then(r => setItems(r.items)); useEffect(() => { void refresh(); }, []);
  return <Shell title="真人导游协同工作台" eyebrow="Guide Collaboration" nav={[]}><Heading title="游客问题记录" desc="查看游客端真实提问。选择记录后进入专门处理区，修正或优化内容并提交审核。"/><div className="split"><section className="scene-list">{items.map(item => <button className="scene" onClick={() => { setSelected(item); setAnswer(item.answer); }} key={item.id}><b>{item.question}</b><span>{item.provider} / {item.model}</span></button>)}{!items.length && <div className="empty">尚无游客问答记录</div>}</section><section className="panel form">{selected ? <><h2>修正与优化</h2><p className="question">{selected.question}</p><textarea value={answer} onChange={e => setAnswer(e.target.value)} /><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="修正依据与备注"/><button className="primary" onClick={async () => { await api.review({ record_id: selected.id, mode: "optimize", guide_note: note, optimized_answer: answer }); alert("已提交审核"); }}><Save/> 提交审核</button></> : <div className="empty">选择一条游客记录开始处理</div>}</section></div></Shell>;
}

const adminNav: [string, string][] = [["总览", "/admin"], ["健康监测", "/admin/health"], ["知识库", "/admin/knowledge"], ["知识图谱", "/admin/graph"], ["调用日志", "/admin/logs"]];

function Admin() {
  const cards = [["系统健康监测", "/admin/health", Activity], ["知识库内容", "/admin/knowledge", Database], ["知识图谱", "/admin/graph", Network], ["模型调用日志", "/admin/logs", Bot]] as const;
  return <Shell title="语界管理端" eyebrow="Admin Console" nav={adminNav}><Heading title="简洁科技风治理中心" desc="面向系统运行、可信知识、文化关系和模型链路的管理工作台。"/><section className="admin-grid">{cards.map(([name, href, Icon]) => <button className="admin-card" onClick={() => go(href)} key={href}><Icon/><b>{name}</b><ArrowRight/></button>)}</section></Shell>;
}

function AdminHealth() {
  const [health, setHealth] = useState<any>(); const refresh = () => api.health().then(setHealth); useEffect(() => { void refresh(); }, []);
  return <Shell title="语界管理端" eyebrow="Health Monitor" nav={adminNav}><Heading title="系统健康监测" desc="每个服务与框架独立呈现，便于快速判断单机部署状态。"/><button className="primary compact" onClick={refresh}><RefreshCw/> 刷新</button><section className="admin-grid">{Object.entries(health?.components ?? {}).map(([key, value]: any) => <article className="health-card" key={key}><b>{key}</b><span className={value.ok ? "ok" : "bad"}>{value.ok ? "运行正常" : "待检查"}</span><small>{value.model || value.engine || `${value.host ?? ""}:${value.port ?? ""}`}</small></article>)}</section></Shell>;
}

function AdminKnowledge() {
  const [items, setItems] = useState<Knowledge[]>([]); const [form, setForm] = useState({ title: "", content: "", tags: "" }); const refresh = () => api.knowledge().then(r => setItems(r.items)); useEffect(() => { void refresh(); }, []);
  async function add() { await api.addKnowledge({ title: form.title, content: form.content, tags: form.tags.split(/[,，]/) }); setForm({ title: "", content: "", tags: "" }); refresh(); }
  return <Shell title="语界管理端" eyebrow="Knowledge Database" nav={adminNav}><Heading title="知识库内容" desc="当前运行数据来自 CSV 文件，可同步导入 MySQL，并支持在线增删改查。"/><div className="split"><section className="panel form"><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="标题"/><input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="标签，以逗号分隔"/><textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="知识正文"/><button className="primary" onClick={add}><Save/> 新增知识</button></section><section className="table">{items.map(item => <article key={item.id}><div><b>{item.title}</b><small>{item.tags.join(" / ")}</small><p>{item.snippet}</p></div><button onClick={async () => { await api.deleteKnowledge(item.id); refresh(); }}><Trash2/></button></article>)}</section></div></Shell>;
}

function GraphCanvas({ items }: { items: Relation[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current; if (!el) return; const ctx = el.getContext("2d")!; const nodes = Array.from(new Set(items.flatMap(item => [item.source, item.target]))).slice(0, 44).map((name, index) => ({ name, x: 90 + Math.random() * 760, y: 55 + Math.random() * 430, phase: index }));
    const find = (name: string) => nodes.find(node => node.name === name); let frame = 0; let id = 0;
    function draw() { frame += .018; ctx.clearRect(0, 0, 920, 520); ctx.fillStyle = "#03131c"; ctx.fillRect(0, 0, 920, 520); ctx.strokeStyle = "rgba(30,214,202,.18)"; ctx.lineWidth = 1; items.slice(0, 72).forEach(item => { const a = find(item.source), b = find(item.target); if (!a || !b) return; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }); nodes.forEach(node => { const r = 3.5 + Math.sin(frame * 2 + node.phase) * 1.4; ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI * 2); ctx.fillStyle = "#46f2dc"; ctx.shadowColor = "#46f2dc"; ctx.shadowBlur = 14; ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = "#b9fff8"; ctx.font = "12px sans-serif"; ctx.fillText(node.name, node.x + 8, node.y - 7); }); id = requestAnimationFrame(draw); } draw(); return () => cancelAnimationFrame(id);
  }, [items]);
  return <canvas className="graph-canvas" ref={canvas} width="920" height="520"/>;
}

function AdminGraph() {
  const [items, setItems] = useState<Relation[]>([]); const [query, setQuery] = useState(""); const [form, setForm] = useState({ source: "", relation: "", target: "" });
  const refresh = () => api.graph(query).then(r => setItems(r.items)); useEffect(() => { void refresh(); }, []);
  const sample = useMemo(() => [...items].sort(() => Math.random() - .5).slice(0, 72), [items]);
  return <Shell title="语界管理端" eyebrow="Jarvis Culture Graph" nav={adminNav}><Heading title="动态文化知识图谱" desc="初始随机抽取局部关系，输入关键词后聚焦相关网状图谱。"/><div className="toolbar"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索景点、菜品、民族、节庆或非遗"/><button className="primary compact" onClick={refresh}><Search/> 查询</button></div><GraphCanvas items={sample}/><section className="panel form inline-form"><input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="源实体"/><input value={form.relation} onChange={e => setForm({ ...form, relation: e.target.value })} placeholder="关系"/><input value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} placeholder="目标实体"/><button className="primary" onClick={async () => { await api.addRelation(form); setForm({ source: "", relation: "", target: "" }); refresh(); }}><Save/> 新增关系</button></section></Shell>;
}

function AdminLogs() { const [items, setItems] = useState<any[]>([]); useEffect(() => { api.logs().then(r => setItems(r.items)); }, []); return <Shell title="语界管理端" eyebrow="Model Call Logs" nav={adminNav}><Heading title="模型调用日志" desc="追踪真实游客问题、模型、耗时、来源与异常。"/><section className="table">{items.map(item => <article key={item.id || item.created_at}><div><b>{item.question || item.type}</b><small>{item.provider} / {item.model} / {item.latency_ms ?? 0}ms</small><p>{item.answer || item.error}</p></div></article>)}</section></Shell>; }
function Heading({ title, desc }: { title: string; desc: string }) { return <section className="heading"><p className="eyebrow">LINGUASPACE</p><h1>{title}</h1><p>{desc}</p></section>; }

export default function App() {
  const routes: Record<string, JSX.Element> = { "/": <Home/>, "/visitor": <Visitor/>, "/visitor/image": <VisitorImage/>, "/visitor/route": <VisitorRoute/>, "/student": <Student/>, "/guide": <Guide/>, "/admin": <Admin/>, "/admin/health": <AdminHealth/>, "/admin/knowledge": <AdminKnowledge/>, "/admin/graph": <AdminGraph/>, "/admin/logs": <AdminLogs/> };
  return routes[path()] ?? <Home/>;
}
