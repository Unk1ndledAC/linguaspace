import {
  ArrowRight,
  Bot,
  Camera,
  CheckCircle2,
  CircleDot,
  Database,
  FileStack,
  Globe2,
  GraduationCap,
  Languages,
  MapPinned,
  MessageCircle,
  Mic,
  Network,
  Route,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Waypoints,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { systemApi } from "../../api/system";
import { ErrorState } from "../../components/common/ErrorState";
import { LoadingState } from "../../components/common/LoadingState";

type ArchitectureLayer = { name: string; ok: boolean; items: string[] };
type ArchitectureAudit = { status: string; layers: ArchitectureLayer[]; notes: string[] };

const architectureFlow: Array<[LucideIcon, string, string]> = [
  [ScanLine, "多模态输入", "文字 · 语音 · 图片 · 位置"],
  [Languages, "理解与翻译", "ASR · 视觉线索 · 术语适配"],
  [Database, "可信 RAG", "审核知识召回与来源核验"],
  [Network, "文化图谱", "真实三元组语义增强"],
  [Sparkles, "多语生成", "讲解组织 · 翻译 · TTS"],
  [UserRoundCheck, "审核回流", "导游修正 · 专家审核"],
];

const featureCards: Array<[LucideIcon, string, string, string, string, string]> = [
  [Languages, "多语文化问答", "统一术语与跨文化表达", "面向南亚、东南亚游客输出更自然、更一致的云南文化讲解。", "/tourist/chat", "/assets/intro-feature-multilingual-tour.png"],
  [Mic, "语音随行导览", "ASR + RAG + TTS", "让游客边走边问，语音仍经过可信知识链路生成讲解。", "/tourist/voice", "/assets/public-rainforest-waterfall.jpg"],
  [Camera, "拍照识别讲解", "视觉理解 + 文化检索", "古建细节、街巷与文化场景都可以成为探索入口。", "/tourist/image", "/assets/public-lijiang-rooftops.jpg"],
  [Route, "兴趣路线推荐", "真实路线库", "围绕古城、山水、非遗与民族文化发现云南旅行路径。", "/tourist/routes", "/assets/public-yunnan-sunlit-terraces.jpg"],
  [Database, "RAG 文旅知识库", "可信 · 可追踪", "上传、切片、审核、向量化和检索测试共同构成知识工程底座。", "/knowledge/documents", "/assets/intro-feature-trusted-rag.png"],
  [Network, "文化知识图谱", "关系增强", "将地点、建筑、民俗、饮食与路线组织成可解释的文化网络。", "/knowledge/graph", "/assets/intro-feature-cultural-knowledge-graph.png"],
  [UserRoundCheck, "真人导游协同", "Human-in-the-loop", "低置信问题由导游接管，优质修正提交审核后回流。", "/guide/dashboard", "/assets/intro-scenario-human-guide-handoff.png"],
  [GraduationCap, "AI 导游实训", "产教融合", "将讲解、知识依据与服务应对转化为高校训练场景。", "/intro/roadmap", "/assets/intro-feature-ai-guide-training.png"],
];

const stories = [
  ["01", "FOREIGN VISITOR", "外国游客多语问答", "从抵达云南的第一刻开始，游客可以用熟悉的语言了解古城、山水和文化礼仪。系统先检索审核资料，再组织自然讲解。", "/tourist/chat", "/assets/intro-scenario-multilingual-visitors.png"],
  ["02", "VISUAL DISCOVERY", "拍照发现文化故事", "一处照壁、一段雕花或一条古城街巷，都可以成为理解当地文化的新入口。视觉模型提取线索，文化解释继续进入可信 RAG。", "/tourist/image", "/assets/intro-scenario-photo-recognition.png"],
  ["03", "HUMAN COLLABORATION", "低置信问题真人接管", "当问题需要更审慎的判断，平台把会话上下文交给真人导游。服务不是自动化终点，而是更流畅的人机协同。", "/guide/takeover", "/assets/intro-scenario-human-guide-handoff.png"],
  ["04", "KNOWLEDGE GROWTH", "修正内容审核回流", "优质讲解、术语修正和导游反馈不会直接写入知识库。它们先进入专家审核，再成为新的文化资产。", "/knowledge/review", "/assets/intro-scenario-knowledge-growth.png"],
  ["05", "GUIDE TRAINING", "高校 AI 导游实训", "学生在真实文旅知识背景下训练讲解能力、服务应对与文化边界意识，让技术继续服务人才培养。", "/intro/roadmap", "/assets/intro-feature-ai-guide-training.png"],
] as const;

const roadmap = [
  ["01", "可信知识底座", "文旅资料入库、切片、审核与检索测试形成基础闭环。", "已落地", Database],
  ["02", "多模态智能导览", "文本、语音与拍照识别连接到统一的知识增强链路。", "已落地", ScanLine],
  ["03", "文化知识图谱", "真实三元组关系让地点、建筑、民俗与路线彼此关联。", "已落地", Network],
  ["04", "真人导游协同", "低置信接管、回答修正与审核回流建立服务闭环。", "已落地", UserRoundCheck],
  ["05", "高校导游实训", "把真实知识、讲解结构和服务应对带入训练场景。", "持续扩展", GraduationCap],
  ["06", "跨境文旅生态", "继续完善多语评测、动态信息接入与移动体验。", "下一阶段", Globe2],
] as const;

export function IntroArchitecturePage() {
  const [audit, setAudit] = useState<ArchitectureAudit>();
  const [error, setError] = useState("");
  const load = () => {
    setError("");
    systemApi.architecture().then((value) => setAudit(value as ArchitectureAudit)).catch((reason: Error) => setError(reason.message));
  };
  useEffect(() => { load(); }, []);

  return (
    <section className="intro-story-page architecture-page">
      <IntroHero
        kicker="TRUSTED AI ARCHITECTURE"
        title="从旅行现场，到可信文化智能链路"
        text="不是简单调用大模型，而是让多模态理解、文旅知识、文化图谱、多语输出与人工审核形成一条可解释、可复盘的编排链路。"
        image="/assets/intro-ai-pipeline.png"
        accent="系统架构"
      />
      <IntroReveal className="intro-light-section">
        <IntroHeading kicker="ORCHESTRATED PIPELINE" title="每个节点都清晰，每次回答都有来路" text="滚动进入区域后，链路节点依次点亮。比赛答辩时可以沿着这条链路讲清楚系统不是普通 ChatGPT 套壳。" />
        <div className="intro-architecture-flow">
          {architectureFlow.map(([Icon, title, text], index) => (
            <article key={title} style={{ "--intro-order": index } as CSSProperties}>
              <div><Icon size={19} /></div><b>{String(index + 1).padStart(2, "0")}</b><h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
      </IntroReveal>
      <IntroReveal className="intro-dark-section intro-audit-section">
        <IntroHeading kicker="REAL ARCHITECTURE AUDIT" title="从端侧体验，到数据与运维底座" text="以下分层来自实时架构审计接口，不使用静态示意数据冒充系统能力。" tone="dark" />
        {!audit && !error && <LoadingState label="正在读取真实架构审计结果" />}
        {error && <ErrorState message={error} retry={load} />}
        {audit && <div className="intro-layer-grid">{audit.layers.map((layer, index) => <article key={layer.name} style={{ "--intro-order": index } as CSSProperties}><span>{String(index + 1).padStart(2, "0")}</span><Waypoints size={20} /><h3>{layer.name}</h3><p>{layer.items.join(" · ")}</p><small><CheckCircle2 size={13} /> {layer.ok ? "已通过架构审计" : "需要检查"}</small></article>)}</div>}
        {audit && <div className="intro-audit-notes">{audit.notes.map((note) => <p key={note}><CircleDot size={14} />{note}</p>)}</div>}
      </IntroReveal>
      <IntroPageCta title="沿着真实链路继续验证" text="进入 RAG 检索测试页，查看知识召回、文化关系与最终回答。" to="/knowledge/rag-test" link="进入 RAG 测试" />
    </section>
  );
}

export function IntroFeaturesPage() {
  return (
    <section className="intro-story-page features-page">
      <IntroHero
        kicker="CAPABILITY MATRIX"
        title="一套文化底座，连接完整文旅服务"
        text="从游客随行导览，到真人导游协同，再到高校实训与知识资产沉淀，每一个能力都有真实业务入口。"
        image="/assets/public-yulong-mountain.jpg"
        accent="核心能力"
      />
      <IntroReveal className="intro-light-section">
        <IntroHeading kicker="MULTIMODAL CULTURAL SERVICE" title="不止回答问题，更在旅行中持续理解与协作" text="图文卡片以旅行网站的节奏组织能力入口，同时保留清晰的技术标签。" />
        <div className="intro-feature-story-grid">
          {featureCards.map(([Icon, title, subtitle, text, to, image], index) => (
            <Link className="intro-feature-story-card" key={title} to={to} style={{ "--intro-order": index } as CSSProperties}>
              <div className="intro-card-image"><img src={image} alt="" /><span>{subtitle}</span></div>
              <div><Icon size={19} /><h3>{title}</h3><p>{text}</p><b>进入能力入口 <ArrowRight size={14} /></b></div>
            </Link>
          ))}
        </div>
      </IntroReveal>
      <IntroReveal className="intro-feature-spotlight">
        <div className="intro-spotlight-image"><img src="/assets/intro-overview-ancient-town-tech.png" alt="" /></div>
        <div><span>ONE CULTURAL FOUNDATION</span><h2>文旅体验与知识工程，不再是两套割裂的系统</h2><p>游客端负责感受与探索，导游端负责服务与纠偏，知识库负责沉淀与审核，系统后台负责追踪与治理。它们围绕同一套可信文化底座协同运行。</p><Link to="/intro/architecture">查看系统架构 <ArrowRight size={15} /></Link></div>
      </IntroReveal>
      <IntroPageCta title="选择一个场景，开始体验" text="从游客多语问答进入，最直观地感受知识增强导览。" to="/tourist/chat" link="进入游客端" />
    </section>
  );
}

export function IntroScenariosPage() {
  return (
    <section className="intro-story-page scenarios-page">
      <IntroHero
        kicker="REAL USER JOURNEY"
        title="从一次旅行提问，到一套文旅知识资产"
        text="沿着游客、导游、专家与高校师生的真实旅程，理解 LinguaSpace 如何让每一次服务都成为系统成长的起点。"
        image="/assets/public-tour-guide-group.jpg"
        accent="应用场景"
      />
      <IntroReveal className="intro-light-section">
        <IntroHeading kicker="TRAVEL SERVICE STORIES" title="旅行不是表格，服务也不该只是功能列表" text="场景采用图文交错的目的地叙事，让现场体验、人工协同与知识回流形成连续节奏。" />
        <div className="intro-story-list">
          {stories.map(([id, kicker, title, text, to, image], index) => (
            <article className="intro-story-card" key={id} style={{ "--intro-order": index } as CSSProperties}>
              <div className="intro-story-image"><img src={image} alt="" /><b>{id}</b></div>
              <div><span>{kicker}</span><h3>{title}</h3><p>{text}</p><Link to={to}>进入场景 <ArrowRight size={15} /></Link></div>
            </article>
          ))}
        </div>
      </IntroReveal>
      <IntroReveal className="intro-loop-section">
        <IntroHeading kicker="CLOSED-LOOP SERVICE" title="体验、协同、审核、再生长" text="优质服务经验在审核后持续回到知识底座，让平台越用越懂云南文化。" tone="dark" />
        <div className="intro-loop-flow">{["游客探索", "AI 可信回答", "导游接管", "专家审核", "知识回流"].map((item, index) => <article key={item} style={{ "--intro-order": index } as CSSProperties}><span>0{index + 1}</span><strong>{item}</strong></article>)}</div>
      </IntroReveal>
      <IntroPageCta title="从真实旅行现场进入平台" text="体验多语问答、拍照识别和路线推荐，感受云南文化导览。" to="/tourist/home" link="进入游客首页" />
    </section>
  );
}

export function IntroRoadmapPage() {
  return (
    <section className="intro-story-page roadmap-page">
      <IntroHero
        kicker="PRODUCT ROADMAP"
        title="从可信问答，走向跨境文旅智能生态"
        text="LinguaSpace 已经完成从知识增强导览到人机协同的基础闭环，并将继续围绕多语评测、动态信息和移动体验持续演进。"
        image="/assets/public-yunnan-sunlit-terraces.jpg"
        accent="建设路线"
      />
      <IntroReveal className="intro-light-section">
        <IntroHeading kicker="STEP BY STEP" title="沿着云南山水，把技术能力一步步落到真实服务" text="路线页区分已落地、持续扩展与下一阶段，不把规划中的能力伪装成已完成。" />
        <div className="intro-roadmap-list">
          {roadmap.map(([id, title, text, status, Icon], index) => (
            <article key={id} style={{ "--intro-order": index } as CSSProperties}>
              <div className="intro-roadmap-marker"><Icon size={20} /><i /></div>
              <div><span>{id} / {status}</span><h3>{title}</h3><p>{text}</p><Status text={status} /></div>
            </article>
          ))}
        </div>
      </IntroReveal>
      <IntroReveal className="intro-roadmap-vision">
        <div><span>THE NEXT HORIZON</span><h2>下一站，让云南文化被更多人准确理解</h2><p>下一阶段继续推进小语种评测集、动态景区信息、图谱扩展和移动端体验。建设路线公开透明，便于答辩展示和后续协作。</p></div>
        <div className="intro-future-tags"><span>多语评测集</span><span>动态景区信息</span><span>图谱扩展</span><span>移动端适配</span></div>
      </IntroReveal>
      <IntroPageCta title="查看当前已落地的知识资产" text="进入知识库统计页，了解文档、切片、图谱关系与审核状态。" to="/knowledge/statistics" link="查看知识资产" />
    </section>
  );
}

function IntroHero({ kicker, title, text, image, accent }: { kicker: string; title: string; text: string; image: string; accent: string }) {
  return <section className="intro-immersive-hero" style={{ "--intro-hero-image": `url(${image})` } as CSSProperties}><div><span className="page-kicker"><Sparkles size={14} /> {kicker}</span><h1>{title}</h1><p>{text}</p><div><Link to="/tourist/chat"><MessageCircle size={16} />体验游客导览</Link><Link to="/intro/overview">返回项目首页 <ArrowRight size={15} /></Link></div></div><aside><Workflow size={18} /><span>LINGUASPACE / {accent}</span><strong>云南文旅 × 可信 AI</strong></aside></section>;
}

function IntroHeading({ kicker, title, text, tone = "light" }: { kicker: string; title: string; text: string; tone?: "light" | "dark" }) {
  return <header className={`intro-section-heading ${tone}`}><span>{kicker}</span><div><h2>{title}</h2><p>{text}</p></div></header>;
}

function IntroReveal({ children, className }: { children: ReactNode; className: string }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "0px 0px -10%", threshold: 0.08 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <section className={`intro-reveal ${visible ? "is-visible" : ""} ${className}`} ref={ref}>{children}</section>;
}

function IntroPageCta({ title, text, to, link }: { title: string; text: string; to: string; link: string }) {
  return <IntroReveal className="intro-page-cta"><div><span>CONTINUE EXPLORING</span><h2>{title}</h2><p>{text}</p></div><Link to={to}>{link} <ArrowRight size={16} /></Link></IntroReveal>;
}

function Status({ text }: { text: string }) {
  return <small className="intro-roadmap-status"><CheckCircle2 size={13} />{text}</small>;
}
