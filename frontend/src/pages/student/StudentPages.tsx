import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Headphones,
  Mic,
  Play,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Square,
  Target,
  Trophy,
  Upload,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { trainingApi } from "../../api/training";
import { touristApi } from "../../api/tourist";
import type { ScoreReport, TrainingRecord, TrainingScenario } from "../../api/types";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { LoadingState } from "../../components/common/LoadingState";

const metricNames: Record<string, string> = {
  accuracy: "内容准确度",
  completeness: "讲解完整度",
  service: "服务应对",
  sensitivity: "文化与边界敏感度",
  coverage: "知识点覆盖率",
};

const scoreTone = (score: number) => score >= 85 ? "excellent" : score >= 60 ? "qualified" : "improve";
const metricLabel = (name: string) => metricNames[name] ?? name;
const parseJson = <T,>(value: string, fallback: T): T => {
  try { return JSON.parse(value) as T; } catch { return fallback; }
};

function StudentHeading({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <header className="student-page-heading">
      <span>{kicker}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </header>
  );
}

function ScoreRing({ score, label = "综合评分" }: { score: number; label?: string }) {
  return (
    <div className={`student-score-ring ${scoreTone(score)}`} style={{ "--score": `${score * 3.6}deg` } as CSSProperties}>
      <div><b>{score}</b><span>{label}</span></div>
    </div>
  );
}

function MetricBars({ metrics }: { metrics: Record<string, number> }) {
  return (
    <div className="student-metric-bars">
      {Object.entries(metrics).map(([name, value]) => (
        <article key={name}>
          <div><span>{metricLabel(name)}</span><b>{value}</b></div>
          <i><em style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></i>
        </article>
      ))}
    </div>
  );
}

function useTrainingData() {
  const [scenarios, setScenarios] = useState<TrainingScenario[]>([]);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const refresh = () => {
    setBusy(true);
    setError("");
    Promise.all([trainingApi.scenarios(), trainingApi.records()])
      .then(([scenarioData, recordData]) => {
        setScenarios(scenarioData.items);
        setRecords(recordData.items);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setBusy(false));
  };
  useEffect(refresh, []);
  return { scenarios, records, busy, error, refresh };
}

export function StudentHomePage() {
  const { scenarios, records, busy, error, refresh } = useTrainingData();
  const average = records.length ? Math.round(records.reduce((sum, item) => sum + item.score, 0) / records.length) : 0;
  const qualified = records.filter((item) => item.score >= 60).length;
  const best = records.length ? Math.max(...records.map((item) => item.score)) : 0;

  return (
    <section className="student-page-stack">
      <section className="student-dashboard-hero">
        <div>
          <span>LINGUASPACE GUIDE ACADEMY</span>
          <h1>AI 导游实训平台</h1>
          <p>围绕云南文旅真实场景，训练文化讲解、游客服务、安全应对和边界意识。每次作答都由真实评分链路生成训练报告。</p>
          <div>
            <Link className="student-primary-action" to="/student/training"><Play size={16} />开始实训</Link>
            <Link className="student-secondary-action" to="/student/scenarios"><BookOpen size={16} />浏览场景库</Link>
          </div>
        </div>
        <ScoreRing score={average} label="平均得分" />
      </section>
      {busy && <LoadingState />}
      {error && <ErrorState message={error} retry={refresh} />}
      {!busy && !error && (
        <>
          <section className="student-stat-grid">
            <article><ClipboardList size={20} /><span>训练场景</span><b>{scenarios.length}</b><small>来自真实场景库</small></article>
            <article><GraduationCap size={20} /><span>累计训练</span><b>{records.length}</b><small>已持久化训练记录</small></article>
            <article><CheckCircle2 size={20} /><span>合格次数</span><b>{qualified}</b><small>综合评分达到 60 分</small></article>
            <article><Trophy size={20} /><span>最佳成绩</span><b>{best}</b><small>继续挑战复杂场景</small></article>
          </section>
          <section className="student-home-grid">
            <article className="student-panel">
              <div className="student-section-title"><div><span>RECENT TRAINING</span><h2>最近训练</h2></div><Link to="/student/reports">全部报告 <ChevronRight size={15} /></Link></div>
              {records.length === 0 ? <EmptyState label="暂无训练记录，先完成一次虚拟带团训练" /> : (
                <div className="student-record-list">
                  {records.slice(0, 5).map((item) => (
                    <Link key={item.id} to="/student/reports">
                      <div className={`student-record-score ${scoreTone(item.score)}`}>{item.score}</div>
                      <div><strong>{item.scenario}</strong><p>{item.question || "未记录游客提问"}</p><small>{item.created_at.slice(0, 16)} · {item.judge_mode}</small></div>
                      <ChevronRight size={16} />
                    </Link>
                  ))}
                </div>
              )}
            </article>
            <aside className="student-panel student-growth-panel">
              <div className="student-section-title"><div><span>TRAINING PATH</span><h2>能力进阶</h2></div></div>
              <div className="student-growth-steps">
                <article className="active"><i>01</i><div><b>基础讲解</b><small>景点、民族与非遗知识</small></div></article>
                <article className={records.length >= 2 ? "active" : ""}><i>02</i><div><b>服务应对</b><small>路线、饮食与游客沟通</small></div></article>
                <article className={records.length >= 4 ? "active" : ""}><i>03</i><div><b>风险处置</b><small>安全、生态与文化边界</small></div></article>
              </div>
            </aside>
          </section>
        </>
      )}
    </section>
  );
}

export function StudentScenarioPage() {
  const { scenarios, busy, error, refresh } = useTrainingData();
  const [keyword, setKeyword] = useState("");
  const [visitorType, setVisitorType] = useState("全部");
  const visitors = useMemo(() => ["全部", ...new Set(scenarios.map((item) => item.visitor_type))], [scenarios]);
  const filtered = scenarios.filter((item) =>
    (visitorType === "全部" || item.visitor_type === visitorType) &&
    `${item.scene}${item.question}${item.visitor_type}`.includes(keyword.trim())
  );

  return (
    <section className="student-page-stack">
      <StudentHeading kicker="SCENARIO LIBRARY" title="实训场景库" text="场景来自后端训练数据，可持续通过 CSV 和管理端扩充。按游客类型或关键词筛选，再进入虚拟带团训练。" />
      <section className="student-filter-bar">
        <label><Search size={16} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索地点、问题或游客类型" /></label>
        <select value={visitorType} onChange={(event) => setVisitorType(event.target.value)}>
          {visitors.map((item) => <option key={item}>{item}</option>)}
        </select>
        <span>{filtered.length} 个场景</span>
      </section>
      {busy && <LoadingState />}
      {error && <ErrorState message={error} retry={refresh} />}
      {!busy && !error && (
        <section className="student-scenario-grid">
          {filtered.length === 0 ? <EmptyState label="没有符合条件的训练场景" /> : filtered.map((item, index) => (
            <article key={item.id}>
              <div><span>SCENE {String(index + 1).padStart(2, "0")}</span><b>{item.language}</b></div>
              <h2>{item.scene}</h2>
              <p>{item.question}</p>
              <footer><small><UsersRound size={14} />{item.visitor_type}</small><Link to={`/student/training?scenario=${encodeURIComponent(item.id)}`}>进入训练 <ChevronRight size={15} /></Link></footer>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}

export function StudentTrainingPage() {
  const [scenarios, setScenarios] = useState<TrainingScenario[]>([]);
  const [selected, setSelected] = useState<TrainingScenario | null>(null);
  const [answer, setAnswer] = useState("");
  const [audio, setAudio] = useState<File>();
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<ScoreReport>();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder>();
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    trainingApi.scenarios()
      .then((data) => {
        setScenarios(data.items);
        const requested = new URLSearchParams(window.location.search).get("scenario");
        setSelected(data.items.find((item) => item.id === requested) ?? data.items[0] ?? null);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  const choose = (scenario: TrainingScenario) => {
    setSelected(scenario);
    setAnswer("");
    setResult(undefined);
    setError("");
  };
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      recorder.current = new MediaRecorder(stream);
      recorder.current.ondataavailable = (event) => chunks.current.push(event.data);
      recorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setAudio(new File([blob], "student-guide-answer.webm", { type: blob.type }));
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.current.start();
      setRecording(true);
    } catch { setError("无法访问麦克风，请检查浏览器权限。"); }
  };
  const stopRecording = () => { recorder.current?.stop(); setRecording(false); };
  const transcribe = async () => {
    if (!audio) return;
    setBusy(true);
    setError("");
    try {
      const transcript = await touristApi.transcribeAudio(audio);
      setAnswer(String(transcript.text ?? ""));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "语音转写失败"); }
    finally { setBusy(false); }
  };
  const submit = async () => {
    if (!selected || !answer.trim()) return;
    setBusy(true);
    setError("");
    setResult(undefined);
    try {
      setResult(await trainingApi.score({ scenario: selected.scene, question: selected.question, answer: answer.trim() }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "评分失败"); }
    finally { setBusy(false); }
  };

  return (
    <section className="student-page-stack">
      <StudentHeading kicker="VIRTUAL GROUP TOUR" title="虚拟带团训练" text="选择一个真实文旅场景，面对虚拟游客提问，用文字或语音完成讲解。系统将从知识准确性、服务应对和安全边界等维度评分。" />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} retry={() => setError("")} />}
      {!loading && (
        <div className="student-training-layout">
          <aside className="student-training-sidebar">
            <div><span>TRAINING TASKS</span><b>选择训练场景</b></div>
            <section>
              {scenarios.map((item, index) => (
                <button key={item.id} className={selected?.id === item.id ? "active" : ""} onClick={() => choose(item)}>
                  <i>{String(index + 1).padStart(2, "0")}</i><div><strong>{item.scene}</strong><small>{item.visitor_type}</small></div>
                </button>
              ))}
            </section>
          </aside>
          <main className="student-training-workspace">
            {selected ? (
              <>
                <section className="student-visitor-card">
                  <div><UsersRound size={22} /><span>VIRTUAL TOURIST</span></div>
                  <small>{selected.visitor_type} · {selected.language}</small>
                  <h2>{selected.question}</h2>
                </section>
                <section className="student-answer-card">
                  <div><Headphones size={18} /><b>你的讲解回答</b><span>{answer.length} 字</span></div>
                  <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="请组织你的讲解与服务话术。涉及安全、宗教、生态或边界问题时，请给出清晰可执行的提醒。" />
                  <footer>
                    <div>
                      {recording ? <button className="recording" onClick={stopRecording}><Square size={15} />停止录音</button> : <button onClick={startRecording}><Mic size={15} />录音作答</button>}
                      <label><Upload size={15} />上传音频<input type="file" accept="audio/*" onChange={(event) => setAudio(event.target.files?.[0])} /></label>
                      {audio && <button onClick={transcribe} disabled={busy}><Mic size={15} />转写到文本</button>}
                    </div>
                    <button className="student-submit" disabled={!answer.trim() || busy} onClick={submit}><Send size={15} />提交评分</button>
                  </footer>
                </section>
                {busy && <LoadingState label="AI 正在评估讲解结构、知识覆盖和服务边界..." />}
                {result && (
                  <section className="student-result-panel">
                    <div className="student-result-summary">
                      <ScoreRing score={result.total} />
                      <div>
                        <span>{result.guardrail_triggered ? "GUARDRAIL TRIGGERED" : "AI-AS-JUDGE REPORT"}</span>
                        <h2>{result.guardrail_triggered ? "回答触发安全或服务边界限制" : "本次训练评估完成"}</h2>
                        <p>评分模式：{result.judge_mode} · 知识点覆盖 {result.coverage?.score ?? 0} 分</p>
                      </div>
                    </div>
                    <MetricBars metrics={result.metrics} />
                    <div className="student-feedback-grid">
                      <article><h3><Target size={16} />改进建议</h3>{result.feedback.map((item, index) => <p key={index}>{item}</p>)}</article>
                      <article><h3><ShieldAlert size={16} />待补充知识点</h3>{result.coverage?.missing?.length ? result.coverage.missing.map((item, index) => <i key={index}>{item}</i>) : <p>当前回答已覆盖主要知识点。</p>}</article>
                    </div>
                  </section>
                )}
              </>
            ) : <EmptyState label="暂无可用训练场景" />}
          </main>
        </div>
      )}
    </section>
  );
}

export function StudentReportPage() {
  const { records, busy, error, refresh } = useTrainingData();
  const [selected, setSelected] = useState<TrainingRecord | null>(null);
  useEffect(() => { if (!selected && records[0]) setSelected(records[0]); }, [records, selected]);
  const metrics = selected ? parseJson<Record<string, number>>(selected.metrics_json, {}) : {};
  const feedback = selected ? parseJson<string[]>(selected.feedback_json, []) : [];
  const average = records.length ? Math.round(records.reduce((sum, item) => sum + item.score, 0) / records.length) : 0;
  const best = records.length ? Math.max(...records.map((item) => item.score)) : 0;

  return (
    <section className="student-page-stack">
      <StudentHeading kicker="GROWTH REPORT" title="训练报告与成长轨迹" text="回看每一次虚拟带团表现，检查多维评分、服务话术和安全边界，找到下一次训练的重点。" />
      {busy && <LoadingState />}
      {error && <ErrorState message={error} retry={refresh} />}
      {!busy && !error && (
        <>
          <section className="student-stat-grid compact">
            <article><ClipboardList size={20} /><span>累计训练</span><b>{records.length}</b></article>
            <article><BarChart3 size={20} /><span>平均得分</span><b>{average}</b></article>
            <article><Award size={20} /><span>最佳成绩</span><b>{best}</b></article>
            <article><Target size={20} /><span>评分维度</span><b>{Object.keys(metrics).length}</b></article>
          </section>
          <div className="student-report-layout">
            <aside className="student-report-list">
              <div><span>TRAINING HISTORY</span><b>历史训练记录</b></div>
              {records.length === 0 ? <EmptyState label="暂无训练记录" /> : records.map((item) => (
                <button key={item.id} className={selected?.id === item.id ? "active" : ""} onClick={() => setSelected(item)}>
                  <i className={scoreTone(item.score)}>{item.score}</i>
                  <div><strong>{item.scenario}</strong><small>{item.created_at.slice(0, 16)} · {item.judge_mode}</small></div>
                </button>
              ))}
            </aside>
            <main className="student-report-detail">
              {selected ? (
                <>
                  <header><ScoreRing score={selected.score} /><div><span>TRAINING DETAIL</span><h2>{selected.scenario}</h2><p>{selected.question || "未记录游客提问"}</p></div></header>
                  <section><h3>学生讲解</h3><p>{selected.answer}</p></section>
                  <section><h3>能力维度</h3><MetricBars metrics={metrics} /></section>
                  <section><h3>改进建议</h3><div className="student-feedback-list">{feedback.map((item, index) => <p key={index}>{item}</p>)}</div></section>
                </>
              ) : <EmptyState label="选择一条训练记录查看详情" />}
            </main>
          </div>
        </>
      )}
    </section>
  );
}
