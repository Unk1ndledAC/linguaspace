import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, RefreshCw, Search, Shuffle, Trash2, Zap } from "lucide-react";
import AdminShell from "../components/AdminShell";
import { api, type GraphRelation } from "../lib/api";

const graphForm = { id: "", source: "", relation: "", target: "" };
const SAMPLE_SIZE = 22;

type GraphPoint = {
  x: number;
  y: number;
  cluster: number;
  degree: number;
};

function uniqueNodes(relations: GraphRelation[]) {
  return Array.from(new Set(relations.flatMap((item) => [item.from, item.to]))).sort();
}

function sampleRelations(relations: GraphRelation[], size = SAMPLE_SIZE) {
  if (relations.length <= size) return relations;
  const degree = new Map<string, number>();
  const bySource = new Map<string, GraphRelation[]>();
  relations.forEach((item) => {
    degree.set(item.from, (degree.get(item.from) ?? 0) + 1);
    degree.set(item.to, (degree.get(item.to) ?? 0) + 1);
    bySource.set(item.from, [...(bySource.get(item.from) ?? []), item]);
  });
  const hubs = Array.from(bySource.entries())
    .filter(([, items]) => items.length >= 3)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 36)
    .map(([node]) => node);
  for (let index = hubs.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [hubs[index], hubs[swapIndex]] = [hubs[swapIndex], hubs[index]];
  }
  const selected: GraphRelation[] = [];
  const selectedIds = new Set<string>();
  const nodeUse = new Map<string, number>();

  hubs.slice(0, 7).forEach((hub) => {
    const candidates = [...(bySource.get(hub) ?? [])];
    for (let index = candidates.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [candidates[index], candidates[swapIndex]] = [candidates[swapIndex], candidates[index]];
    }
    for (const item of candidates.slice(0, 4)) {
      if (selected.length >= size || selectedIds.has(item.id ?? "")) continue;
      selected.push(item);
      if (item.id) selectedIds.add(item.id);
      nodeUse.set(item.from, (nodeUse.get(item.from) ?? 0) + 1);
      nodeUse.set(item.to, (nodeUse.get(item.to) ?? 0) + 1);
    }
  });

  const frontier = new Set(selected.flatMap((item) => [item.from, item.to]));
  const bridgeCandidates = relations
    .filter((item) => !selectedIds.has(item.id ?? "") && (frontier.has(item.from) || frontier.has(item.to)))
    .sort((a, b) => ((degree.get(a.from) ?? 0) + (degree.get(a.to) ?? 0)) - ((degree.get(b.from) ?? 0) + (degree.get(b.to) ?? 0)));
  for (const item of bridgeCandidates) {
    if (selected.length >= size) break;
    if ((nodeUse.get(item.from) ?? 0) >= 5 || (nodeUse.get(item.to) ?? 0) >= 5) continue;
    selected.push(item);
    if (item.id) selectedIds.add(item.id);
    nodeUse.set(item.from, (nodeUse.get(item.from) ?? 0) + 1);
    nodeUse.set(item.to, (nodeUse.get(item.to) ?? 0) + 1);
  }

  if (selected.length < Math.min(size, relations.length)) {
    const pool = relations.filter((item) => !selectedIds.has(item.id ?? ""));
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
    }
    for (const item of pool) {
      if (selected.length >= size) break;
      if ((nodeUse.get(item.from) ?? 0) >= 5 || (nodeUse.get(item.to) ?? 0) >= 5) continue;
      selected.push(item);
      if (item.id) selectedIds.add(item.id);
      nodeUse.set(item.from, (nodeUse.get(item.from) ?? 0) + 1);
      nodeUse.set(item.to, (nodeUse.get(item.to) ?? 0) + 1);
    }
  }

  if (selected.length < size) {
    const pool = relations.filter((item) => !selectedIds.has(item.id ?? ""));
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
    }
    selected.push(...pool.slice(0, size - selected.length));
  }
  return selected;
}

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function GraphCanvas({ relations, totalCount }: { relations: GraphRelation[]; totalCount: number }) {
  const [activeNode, setActiveNode] = useState<string>("");
  const nodes = useMemo(() => uniqueNodes(relations), [relations]);
  const degrees = useMemo(() => {
    const map = new Map<string, number>();
    relations.forEach((item) => {
      map.set(item.from, (map.get(item.from) ?? 0) + 1);
      map.set(item.to, (map.get(item.to) ?? 0) + 1);
    });
    return map;
  }, [relations]);
  const focusedRelations = useMemo(
    () => relations.filter((item) => activeNode && (item.from === activeNode || item.to === activeNode)),
    [activeNode, relations],
  );
  const layout = useMemo(() => {
    const width = 1120;
    const height = 640;
    const centerX = width / 2;
    const centerY = height / 2;
    const clusterCenters = [
      { x: 220, y: 185 },
      { x: 895, y: 170 },
      { x: 260, y: 500 },
      { x: 890, y: 500 },
      { x: 560, y: 315 },
    ];
    const points = new Map<string, GraphPoint>();
    const velocities = new Map<string, { x: number; y: number }>();
    const map = new Map<string, GraphPoint>();
    const sortedNodes = [...nodes].sort((a, b) => (degrees.get(b) ?? 0) - (degrees.get(a) ?? 0) || a.localeCompare(b));
    sortedNodes.forEach((node, index) => {
      const degree = degrees.get(node) ?? 1;
      const seed = hashText(node);
      const cluster = seed % clusterCenters.length;
      const anchor = clusterCenters[cluster];
      const angle = ((seed % 6283) / 1000) + index * 0.41;
      const radius = 34 + (seed % 92);
      points.set(node, {
        x: anchor.x + Math.cos(angle) * radius,
        y: anchor.y + Math.sin(angle) * radius * 0.72,
        cluster,
        degree,
      });
      velocities.set(node, { x: 0, y: 0 });
    });

    for (let step = 0; step < 180; step += 1) {
      const cooling = 1 - step / 190;
      for (let a = 0; a < sortedNodes.length; a += 1) {
        const nodeA = sortedNodes[a];
        const pointA = points.get(nodeA);
        const velocityA = velocities.get(nodeA);
        if (!pointA || !velocityA) continue;
        for (let b = a + 1; b < sortedNodes.length; b += 1) {
          const nodeB = sortedNodes[b];
          const pointB = points.get(nodeB);
          const velocityB = velocities.get(nodeB);
          if (!pointB || !velocityB) continue;
          const dx = pointA.x - pointB.x || 0.1;
          const dy = pointA.y - pointB.y || 0.1;
          const distanceSquared = Math.max(dx * dx + dy * dy, 80);
          const force = (9800 / distanceSquared) * cooling;
          const distance = Math.sqrt(distanceSquared);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          velocityA.x += fx;
          velocityA.y += fy;
          velocityB.x -= fx;
          velocityB.y -= fy;
        }
      }

      relations.forEach((item) => {
        const source = points.get(item.from);
        const target = points.get(item.to);
        const sourceVelocity = velocities.get(item.from);
        const targetVelocity = velocities.get(item.to);
        if (!source || !target || !sourceVelocity || !targetVelocity) return;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const ideal = 220 - Math.min((source.degree + target.degree) * 6, 54);
        const force = (distance - ideal) * 0.012 * cooling;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        sourceVelocity.x += fx;
        sourceVelocity.y += fy;
        targetVelocity.x -= fx;
        targetVelocity.y -= fy;
      });

      sortedNodes.forEach((node) => {
        const point = points.get(node);
        const velocity = velocities.get(node);
        if (!point || !velocity) return;
        const anchor = clusterCenters[point.cluster];
        velocity.x += (anchor.x - point.x) * 0.002 * cooling;
        velocity.y += (anchor.y - point.y) * 0.002 * cooling;
        velocity.x += (centerX - point.x) * 0.0005;
        velocity.y += (centerY - point.y) * 0.0005;
        velocity.x *= 0.78;
        velocity.y *= 0.78;
        point.x = Math.min(width - 120, Math.max(120, point.x + velocity.x));
        point.y = Math.min(height - 85, Math.max(85, point.y + velocity.y));
      });
    }

    points.forEach((point, node) => {
      map.set(node, { ...point });
    });
    return map;
  }, [degrees, nodes]);

  const hotNodes = useMemo(
    () => [...nodes].sort((a, b) => (degrees.get(b) ?? 0) - (degrees.get(a) ?? 0)).slice(0, 5),
    [degrees, nodes],
  );

  return (
    <div className="jarvis-graph relative overflow-hidden rounded-[8px] border border-cyan-300/30 bg-[#020914] shadow-[0_28px_100px_rgba(8,47,73,.42)]">
      <div className="pointer-events-none absolute inset-0 jarvis-grid" />
      <div className="pointer-events-none absolute inset-0 jarvis-sweep" />
      <div className="pointer-events-none absolute left-8 top-8 h-20 w-20 rounded-full border border-cyan-300/35">
        <span className="absolute inset-2 rounded-full border border-cyan-400/20" />
        <span className="absolute left-1/2 top-1/2 h-px w-16 origin-left bg-cyan-200/70 jarvis-radar-arm" />
      </div>
      <div className="pointer-events-none absolute right-6 top-6 rounded-[8px] border border-cyan-300/20 bg-slate-950/60 px-4 py-3 text-xs text-cyan-100 backdrop-blur">
        <div className="flex items-center gap-2 font-semibold tracking-[.22em] text-cyan-200">
          <Zap className="h-3.5 w-3.5" />
          GRAPH HUD
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <span><b className="block text-lg text-white">{relations.length}</b>当前关系</span>
          <span><b className="block text-lg text-white">{nodes.length}</b>可视节点</span>
          <span><b className="block text-lg text-white">{totalCount}</b>总量</span>
        </div>
      </div>

      <svg viewBox="0 0 1120 640" className="relative h-[560px] w-full">
        <defs>
          <filter id="jarvis-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.22 0 0 0 0 0.86 0 0 0 0 1 0 0 0 .85 0" result="cyanBlur" />
            <feMerge>
              <feMergeNode in="cyanBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="jarvis-soft-glow" x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="2.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="jarvis-edge" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#155e75" stopOpacity="0.14" />
            <stop offset="44%" stopColor="#67e8f9" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.22" />
          </linearGradient>
          <radialGradient id="jarvis-node-core">
            <stop offset="0%" stopColor="#ecfeff" stopOpacity="1" />
            <stop offset="42%" stopColor="#22d3ee" stopOpacity=".9" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity=".9" />
          </radialGradient>
          <marker id="jarvis-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#a5f3fc" />
          </marker>
        </defs>

        <g opacity=".38">
          {[
            "M160 160 L315 105 L510 145 L700 95 L930 160",
            "M130 420 L310 500 L520 455 L735 525 L980 430",
            "M220 285 L405 230 L575 285 L770 245 L940 310",
            "M250 118 L350 270 L290 430",
            "M870 110 L770 270 L840 505",
          ].map((path, index) => (
            <path key={path} d={path} fill="none" stroke="#67e8f9" strokeOpacity={index < 3 ? ".34" : ".22"} strokeDasharray="10 18">
              <animate attributeName="stroke-dashoffset" from="0" to="-120" dur={`${18 + index * 3}s`} repeatCount="indefinite" />
            </path>
          ))}
          {[{ x: 250, y: 118 }, { x: 930, y: 160 }, { x: 130, y: 420 }, { x: 840, y: 505 }, { x: 575, y: 285 }].map((point, index) => (
            <g key={`${point.x}-${point.y}`}>
              <rect x={point.x - 18} y={point.y - 18} width="36" height="36" fill="none" stroke="#67e8f9" strokeOpacity=".34" transform={`rotate(${index * 12} ${point.x} ${point.y})`} />
              <circle cx={point.x} cy={point.y} r="4" fill="#a5f3fc" opacity=".7" />
            </g>
          ))}
        </g>

        <g filter="url(#jarvis-soft-glow)">
          {relations.map((item, index) => {
            const from = layout.get(item.from);
            const to = layout.get(item.to);
            if (!from || !to) return null;
            const isActive = activeNode ? item.from === activeNode || item.to === activeNode : false;
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
            const curve = index % 2 === 0 ? 42 : -42;
            const controlX = midX - (dy / distance) * curve;
            const controlY = midY + (dx / distance) * curve;
            const path = `M${from.x},${from.y} Q${controlX},${controlY} ${to.x},${to.y}`;
            const labelWidth = Math.min(116, Math.max(58, item.relation.length * 13 + 18));
            return (
              <g key={`${item.id}-${item.from}-${item.to}`} className={isActive ? "opacity-100" : activeNode ? "opacity-20" : "opacity-95"}>
                <path
                  d={path}
                  fill="none"
                  stroke="#0e7490"
                  strokeOpacity={isActive ? ".62" : ".28"}
                  strokeWidth={isActive ? "8" : "5"}
                />
                <path
                  d={path}
                  fill="none"
                  stroke="url(#jarvis-edge)"
                  strokeWidth={isActive ? "3" : "2"}
                  markerEnd="url(#jarvis-arrow)"
                  strokeDasharray="12 18"
                >
                  <animate attributeName="stroke-dashoffset" from="0" to="-180" dur={`${5.8 + (index % 5) * 0.55}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values=".46;1;.56" dur={`${3.6 + (index % 4) * 0.35}s`} repeatCount="indefinite" />
                </path>
                <circle r={isActive ? "4.5" : "3"} fill="#ecfeff" opacity=".9">
                  <animateMotion dur={`${6.4 + (index % 6) * 0.35}s`} repeatCount="indefinite" path={path} />
                </circle>
                {(isActive || (!activeNode && index < 10)) && (
                  <g>
                    <rect x={midX - labelWidth / 2} y={midY - 14} width={labelWidth} height="25" rx="6" fill="#020617" fillOpacity=".76" stroke="#67e8f9" strokeOpacity=".42" />
                    <text x={midX} y={midY + 2} textAnchor="middle" className="fill-cyan-100 text-[11px] font-semibold">{item.relation}</text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {nodes.map((node, index) => {
          const point = layout.get(node);
          if (!point) return null;
          const isActive = activeNode === node;
          const isDimmed = Boolean(activeNode && !focusedRelations.some((item) => item.from === node || item.to === node) && activeNode !== node);
          const radius = Math.min(32, 16 + point.degree * 3 + (point.cluster === 4 ? 5 : 0));
          return (
            <g
              key={node}
              filter="url(#jarvis-glow)"
              className="cursor-pointer transition-opacity"
              opacity={isDimmed ? 0.24 : 1}
              onMouseEnter={() => setActiveNode(node)}
              onMouseLeave={() => setActiveNode("")}
            >
              <circle cx={point.x} cy={point.y} r={radius + 18} fill="none" stroke="#22d3ee" strokeOpacity={isActive ? ".75" : ".22"} strokeDasharray="5 9">
                <animateTransform attributeName="transform" type="rotate" from={`0 ${point.x} ${point.y}`} to={`360 ${point.x} ${point.y}`} dur={`${8 + (index % 6)}s`} repeatCount="indefinite" />
              </circle>
              <circle cx={point.x} cy={point.y} r={radius + 8} fill="#083344" fillOpacity=".18" stroke="#67e8f9" strokeOpacity=".28">
                <animate attributeName="r" values={`${radius + 4};${radius + 16};${radius + 4}`} dur={`${2.8 + (index % 5) * 0.28}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values=".34;.84;.34" dur={`${2.8 + (index % 5) * 0.28}s`} repeatCount="indefinite" />
              </circle>
              <circle cx={point.x} cy={point.y} r={radius} fill="url(#jarvis-node-core)" stroke={isActive ? "#ffffff" : "#67e8f9"} strokeWidth={isActive ? "2.6" : "1.4"} />
              <path d={`M${point.x - radius - 8} ${point.y - radius - 8} h18 M${point.x - radius - 8} ${point.y - radius - 8} v18 M${point.x + radius + 8} ${point.y + radius + 8} h-18 M${point.x + radius + 8} ${point.y + radius + 8} v-18`} stroke="#a5f3fc" strokeOpacity={isActive ? ".95" : ".42"} strokeWidth="1.5" fill="none" />
              <text x={point.x} y={point.y + 4} textAnchor="middle" className="select-none fill-white text-[12px] font-semibold">
                {node.length > 6 ? `${node.slice(0, 6)}...` : node}
              </text>
              <text x={point.x} y={point.y + radius + 18} textAnchor="middle" className="select-none fill-cyan-200 text-[10px]">
                DEG {point.degree}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-5 left-5 grid max-w-[560px] gap-2 text-xs text-cyan-100 sm:grid-cols-2">
        <div className="rounded-[8px] border border-cyan-300/20 bg-slate-950/68 px-3 py-2 backdrop-blur">
          当前可视化：{relations.length} 条关系 / {nodes.length} 个节点
        </div>
        <div className="rounded-[8px] border border-cyan-300/20 bg-slate-950/68 px-3 py-2 backdrop-blur">
          {activeNode ? `聚焦节点：${activeNode}，关联 ${focusedRelations.length} 条` : "悬停节点可查看关联链路"}
        </div>
      </div>
      <div className="absolute bottom-5 right-5 hidden w-[250px] rounded-[8px] border border-cyan-300/20 bg-slate-950/62 p-3 text-xs text-cyan-100 backdrop-blur lg:block">
        <p className="font-semibold tracking-[.18em] text-cyan-200">HOT ENTITIES</p>
        <div className="mt-3 space-y-2">
          {hotNodes.map((node) => (
            <button
              key={node}
              onMouseEnter={() => setActiveNode(node)}
              onMouseLeave={() => setActiveNode("")}
              className="flex w-full items-center justify-between rounded-[6px] border border-cyan-300/10 bg-cyan-400/5 px-2 py-1.5 text-left hover:border-cyan-200/50 hover:bg-cyan-300/10"
            >
              <span>{node}</span>
              <span className="text-cyan-300">{degrees.get(node)} links</span>
            </button>
          ))}
        </div>
      </div>
      <span className="pointer-events-none absolute left-3 top-3 h-9 w-9 border-l border-t border-cyan-200/70" />
      <span className="pointer-events-none absolute right-3 top-3 h-9 w-9 border-r border-t border-cyan-200/70" />
      <span className="pointer-events-none absolute bottom-3 left-3 h-9 w-9 border-b border-l border-cyan-200/70" />
      <span className="pointer-events-none absolute bottom-3 right-3 h-9 w-9 border-b border-r border-cyan-200/70" />
    </div>
  );
}

export default function AdminGraphPage() {
  const [allRelations, setAllRelations] = useState<GraphRelation[]>([]);
  const [visibleRelations, setVisibleRelations] = useState<GraphRelation[]>([]);
  const [keyword, setKeyword] = useState("");
  const [form, setForm] = useState(graphForm);
  const [loading, setLoading] = useState(false);

  function showRandom(relations = allRelations) {
    setVisibleRelations(sampleRelations(relations));
  }

  async function refresh() {
    setLoading(true);
    try {
      const payload = await api.graphAll(keyword.trim());
      setAllRelations(payload.relations);
      setVisibleRelations(keyword.trim() ? payload.relations.slice(0, 30) : sampleRelations(payload.relations));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function submit() {
    if (!form.source.trim() || !form.relation.trim() || !form.target.trim()) return;
    if (form.id) await api.updateGraphRelation(form.id, form.source, form.relation, form.target);
    else await api.addGraphRelation(form.source, form.relation, form.target);
    setForm(graphForm);
    await refresh();
  }

  async function remove(id?: string) {
    if (!id) return;
    await api.deleteGraphRelation(id);
    await refresh();
  }

  function edit(item: GraphRelation) {
    setForm({ id: item.id ?? "", source: item.from, relation: item.relation, target: item.to });
  }

  return (
    <AdminShell title="知识图谱可视化" subtitle="Knowledge Graph">
      <section className="mx-auto w-[min(1240px,calc(100%-28px))] py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-cyan-700">Graph Intelligence</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">文化实体关系网络</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              初始展示随机子图，避免全量关系堆叠；输入关键词后展示相关子图，悬停节点可聚焦关联链路。
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 lg:w-[560px]">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="h-10 w-full rounded-[8px] border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-cyan-400"
                placeholder="如：白族、大理、菜品、泼水节"
              />
            </div>
            <button onClick={() => void refresh()} className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-slate-950 px-4 text-sm font-semibold text-white">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              查找
            </button>
            <button onClick={() => showRandom()} disabled={!allRelations.length} className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-cyan-200 bg-cyan-50 px-4 text-sm font-semibold text-cyan-800 disabled:opacity-50">
              <Shuffle className="h-4 w-4" />
              随机子图
            </button>
          </div>
        </div>

        <div className="mt-6">
          <GraphCanvas relations={visibleRelations} totalCount={allRelations.length} />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[420px_1fr]">
          <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-semibold">{form.id ? "编辑关系" : "新增关系"}</h3>
            <label className="mt-4 block text-sm font-medium text-slate-600">源节点</label>
            <input value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} className="mt-2 h-10 w-full rounded-[8px] border border-slate-200 px-3 outline-none focus:border-cyan-400" />
            <label className="mt-4 block text-sm font-medium text-slate-600">关系</label>
            <input value={form.relation} onChange={(event) => setForm({ ...form, relation: event.target.value })} className="mt-2 h-10 w-full rounded-[8px] border border-slate-200 px-3 outline-none focus:border-cyan-400" />
            <label className="mt-4 block text-sm font-medium text-slate-600">目标节点</label>
            <input value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} className="mt-2 h-10 w-full rounded-[8px] border border-slate-200 px-3 outline-none focus:border-cyan-400" />
            <div className="mt-4 flex gap-2">
              <button onClick={() => void submit()} className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-cyan-700 px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={!form.source.trim() || !form.relation.trim() || !form.target.trim()}>
                <Plus className="h-4 w-4" />
                保存
              </button>
              <button onClick={() => setForm(graphForm)} className="h-10 rounded-[8px] border border-slate-200 px-4 text-sm font-semibold text-slate-700">清空</button>
            </div>
          </section>

          <section className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-[1fr_1fr_1fr_150px] gap-4 border-b border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
              <span>源节点</span>
              <span>关系</span>
              <span>目标节点</span>
              <span className="text-right">操作</span>
            </div>
            <div className="max-h-[520px] overflow-auto">
              {allRelations.map((item) => (
                <article key={item.id ?? `${item.from}-${item.relation}-${item.to}`} className="grid grid-cols-1 gap-3 border-b border-slate-100 px-4 py-4 text-sm lg:grid-cols-[1fr_1fr_1fr_150px] lg:items-center">
                  <b>{item.from}</b>
                  <span className="text-cyan-700">{item.relation}</span>
                  <b>{item.to}</b>
                  <div className="flex justify-start gap-2 lg:justify-end">
                    <button onClick={() => edit(item)} className="inline-flex h-9 items-center gap-1 rounded-[8px] border border-slate-200 px-3 text-xs font-semibold text-slate-700">
                      <Edit3 className="h-3.5 w-3.5" />
                      编辑
                    </button>
                    <button onClick={() => void remove(item.id)} className="inline-flex h-9 items-center gap-1 rounded-[8px] border border-rose-200 px-3 text-xs font-semibold text-rose-700">
                      <Trash2 className="h-3.5 w-3.5" />
                      删除
                    </button>
                  </div>
                </article>
              ))}
              {!allRelations.length && <div className="p-8 text-center text-sm text-slate-500">暂无关系数据</div>}
            </div>
          </section>
        </div>
      </section>
    </AdminShell>
  );
}
