import { Camera, Map, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import VisitorShell from "../components/VisitorShell";

const features = [
  {
    path: "/visitor/guide",
    icon: MessageCircle,
    title: "AI 导览问答",
    description: "输入现场问题，系统先检索知识库，再流式生成可追溯的导览回答。",
    action: "进入导览"
  },
  {
    path: "/visitor/image",
    icon: Camera,
    title: "图片理解讲解",
    description: "上传现场图片并输入问题，由 qwen3-vl 做视觉摘要后进入 RAG 问答。",
    action: "识别图片"
  },
  {
    path: "/visitor/route",
    icon: Map,
    title: "路线推荐",
    description: "按游客类型和兴趣生成文旅路线，展示节点、模式和推荐理由。",
    action: "规划路线"
  }
];

export default function VisitorPortal() {
  return (
    <VisitorShell
      eyebrow="Visitor"
      title="游客端"
      description="面向游客的功能已拆分为独立页面。这里是入口页，只展示能力入口，不承载具体业务表单。"
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {features.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} className="group rounded-[8px] bg-white p-6 shadow-glass transition hover:-translate-y-1 hover:shadow-glow">
              <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-ink text-gold transition group-hover:bg-gold group-hover:text-ink">
                <Icon size={22} />
              </div>
              <h2 className="mt-6 text-2xl font-semibold">{item.title}</h2>
              <p className="mt-3 min-h-24 leading-7 text-ink/65">{item.description}</p>
              <div className="mt-6 inline-flex rounded-full bg-sand px-4 py-2 text-sm text-bronze group-hover:bg-ink group-hover:text-white">{item.action}</div>
            </Link>
          );
        })}
      </div>
      <div className="mt-8 rounded-[8px] bg-ink p-6 text-white shadow-glow">
        <div className="text-sm uppercase tracking-[.24em] text-gold">Live API</div>
        <p className="mt-3 max-w-3xl leading-7 text-white/72">所有子页面继续连接本地 FastAPI、Ollama、RAG 知识库与种子图谱数据。游客端内部页面互相可达，但不连接学生端、导游端或管理端。</p>
      </div>
    </VisitorShell>
  );
}
