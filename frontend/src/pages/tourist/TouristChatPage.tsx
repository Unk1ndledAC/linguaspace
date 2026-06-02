import {
  Camera,
  Clock3,
  History,
  Languages,
  MessageCircle,
  Mic,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  UserRound,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiUrl } from "../../api/client";
import { touristApi } from "../../api/tourist";
import type { AudioAskResult, ImageAskResult, TouristMessage, TouristSession } from "../../api/types";

type UiMessage = {
  id: string;
  role: string;
  content: string;
  reliable?: boolean;
  sourceCount?: number;
  provider?: string;
  streaming?: boolean;
  createdAt?: string;
  inputType?: string;
  audioUrl?: string;
};

const REGION = "云南全域";

const languages = [
  ["zh", "中文"],
  ["en", "English"],
  ["th", "ไทย"],
  ["vi", "Tiếng Việt"],
  ["ja", "日本語"],
];

function sourceCount(message: TouristMessage) {
  if (!message.sources_json) return 0;
  try {
    const sources = JSON.parse(message.sources_json);
    return Array.isArray(sources) ? sources.length : 0;
  } catch {
    return 0;
  }
}

function toUiMessages(messages: TouristMessage[] = []): UiMessage[] {
  return [...messages]
    .sort((a, b) => {
      const timeOrder = a.created_at.localeCompare(b.created_at);
      if (timeOrder) return timeOrder;
      if (a.role === b.role) return 0;
      return a.role === "user" ? -1 : 1;
    })
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: message.role === "user" ? message.question : message.answer,
      reliable: Boolean(message.reliable),
      sourceCount: sourceCount(message),
      provider: message.provider,
      createdAt: message.created_at,
      inputType: message.input_type,
    }))
    .filter((message) => message.content);
}

function sessionTitle(session: TouristSession) {
  return session.last_question?.trim() || "新的云南文化探索";
}

function formatTime(value?: string) {
  if (!value) return "刚刚";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "最近"
    : new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function TouristChatPage() {
  const [sessions, setSessions] = useState<TouristSession[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [language, setLanguage] = useState("zh");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [imageFile, setImageFile] = useState<File>();
  const [loadingHistory, setLoadingHistory] = useState(true);
  const streamEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder>();
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    void loadSessions();
  }, []);

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: busy ? "smooth" : "auto", block: "end" });
  }, [busy, messages]);

  async function loadSessions(preferredId = "") {
    setLoadingHistory(true);
    try {
      const response = await touristApi.sessions();
      const nextSessions = response.items.slice(0, 5);
      setSessions(nextSessions);
      const nextId = preferredId || sessionId || nextSessions[0]?.id || "";
      if (nextId) {
        const current = nextSessions.find((session) => session.id === nextId);
        if (current) {
          setSessionId(current.id);
          setLanguage(current.language || "zh");
          setMessages(toUiMessages(current.messages));
        } else {
          await openSession(nextId);
        }
      } else {
        setSessionId("");
        setMessages([]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "会话历史加载失败，请稍后重试。");
    } finally {
      setLoadingHistory(false);
    }
  }

  async function openSession(id: string) {
    if (busy || id === sessionId) return;
    setError("");
    setNotice("");
    try {
      const current = await touristApi.session(id);
      setSessionId(current.id);
      setLanguage(current.language || "zh");
      setMessages(toUiMessages(current.messages));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "会话加载失败，请稍后重试。");
    }
  }

  async function createSession() {
    const current = await touristApi.createSession({ language, location: REGION });
    setSessions((previous) => [current, ...previous.filter((session) => session.id !== current.id)].slice(0, 5));
    setSessionId(current.id);
    setMessages([]);
    setNotice("");
    setError("");
    return current.id;
  }

  async function startNewSession() {
    try {
      await createSession();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "新建会话失败，请稍后重试。");
    }
  }

  async function changeLanguage(value: string) {
    setLanguage(value);
    if (!sessionId) return;
    try {
      await touristApi.updatePreferences({ session_id: sessionId, language: value, location: REGION });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "语言偏好更新失败。");
    }
  }

  async function ask() {
    const nextQuestion = question.trim();
    if (imageFile) {
      await askImage(nextQuestion);
      return;
    }
    if (!nextQuestion || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const assistantId = `assistant-${Date.now()}`;
    try {
      const activeSessionId = sessionId || (await createSession());
      const userMessage: UiMessage = {
        id: `visitor-${Date.now()}`,
        role: "user",
        content: nextQuestion,
        createdAt: new Date().toISOString(),
      };
      setMessages((previous) => [
        ...previous,
        userMessage,
        { id: assistantId, role: "assistant", content: "", streaming: true },
      ]);
      setQuestion("");
      const result = await touristApi.askStream(
        { question: nextQuestion, session_id: activeSessionId, language, location: REGION },
        (chunk) => {
          setMessages((previous) =>
            previous.map((message) => (message.id === assistantId ? { ...message, content: `${message.content}${chunk}` } : message)),
          );
        },
      );
      setSessionId(result.sessionId || activeSessionId);
      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantId ? { ...message, streaming: false, reliable: result.sources > 0, sourceCount: result.sources } : message,
        ),
      );
      await loadSessions(result.sessionId || activeSessionId);
    } catch (reason) {
      setMessages((previous) => previous.filter((message) => message.id !== assistantId));
      setError(reason instanceof Error ? reason.message : "回答生成失败，请稍后重试。");
    } finally {
      setBusy(false);
    }
  }

  async function refreshHistory() {
    const response = await touristApi.sessions();
    setSessions(response.items.slice(0, 5));
  }

  async function askImage(nextQuestion = "") {
    if (!imageFile || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const questionText = nextQuestion || "请介绍图片中的云南文旅内容";
    try {
      const activeSessionId = sessionId || (await createSession());
      const result = await touristApi.askImage(imageFile, questionText, { session_id: activeSessionId, language, location: REGION });
      appendRichResult(result, `已上传旅行照片\n${questionText}`, "image");
      setSessionId(result.session_id || activeSessionId);
      setQuestion("");
      setImageFile(undefined);
      await refreshHistory();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "图片识别失败，请稍后重试。");
    } finally {
      setBusy(false);
    }
  }

  function appendRichResult(result: ImageAskResult | AudioAskResult, userContent: string, inputType: "image" | "audio", audioUrl = "") {
    const timestamp = Date.now();
    setMessages((previous) => [
      ...previous,
      { id: `${inputType}-visitor-${timestamp}`, role: "user", content: userContent, inputType, createdAt: new Date().toISOString() },
      {
        id: `${inputType}-assistant-${timestamp}`,
        role: "assistant",
        content: result.translated_answer || result.answer,
        reliable: result.reliable,
        sourceCount: result.sources.length,
        provider: result.provider,
        inputType,
        audioUrl,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  async function askAudio(file: File) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const activeSessionId = sessionId || (await createSession());
      const result = await touristApi.askAudio(file, { session_id: activeSessionId, language, location: REGION });
      const answer = result.translated_answer || result.answer;
      let speechUrl = "";
      try {
        const speech = await touristApi.synthesize(answer);
        speechUrl = speech.url.startsWith("/") ? apiUrl(speech.url) : speech.url;
        void new Audio(speechUrl).play().catch(() => undefined);
      } catch {
        setNotice("语音回答已生成，但当前环境暂时无法自动播报。");
      }
      appendRichResult(result, result.transcript.text, "audio", speechUrl);
      setSessionId(result.session_id || activeSessionId);
      await refreshHistory();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "语音问答失败，请稍后重试。");
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    if (busy || recording) return;
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        setRecording(false);
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        if (blob.size) void askAudio(new File([blob], "linguaspace-voice.webm", { type: blob.type }));
      };
      recorder.start();
      setRecording(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "无法访问麦克风，请检查浏览器权限。");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function handoff() {
    if (!sessionId) {
      setNotice("请先开始一段对话，再申请真人导游协助。");
      return;
    }
    try {
      const result = await touristApi.handoff(sessionId, "游客主动申请人工导游");
      setNotice(`已申请人工接管，当前状态：${result.status}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "人工接管申请失败，请稍后重试。");
    }
  }

  return (
    <section className="page-stack chat-page tourist-service-page">
      <header className="page-heading tourist-service-heading tourist-chat-heading">
        <span className="page-kicker">
          <MessageCircle size={16} /> MULTILINGUAL RAG GUIDE
        </span>
        <h1>与懂云南的 AI 导游对话</h1>
        <p>历史会话与当前问答已经合并。每一次回答都经过文旅知识检索，并保留真人导游接管入口。</p>
      </header>

      <section className="tourist-chat-shell">
        <aside className="tourist-chat-history">
          <div className="tourist-chat-history-head">
            <div>
              <span className="page-kicker">
                <History size={14} /> JOURNEY HISTORY
              </span>
              <h2>探索记录</h2>
            </div>
            <button className="tourist-chat-new" onClick={() => void startNewSession()} title="新建对话">
              <Plus size={17} />
            </button>
          </div>
          <button className="tourist-chat-new-wide" onClick={() => void startNewSession()}>
            <Plus size={16} /> 新的文化探索
          </button>
          <div className="tourist-chat-history-list">
            {loadingHistory && (
              <p className="tourist-chat-history-empty">
                <RefreshCw size={15} className="spin" /> 正在读取历史会话
              </p>
            )}
            {!loadingHistory && !sessions.length && (
              <p className="tourist-chat-history-empty">开始提问后，会话会自动保存在这里。</p>
            )}
            {sessions.map((session) => (
              <button
                className={`tourist-chat-history-item ${session.id === sessionId ? "active" : ""}`}
                key={session.id}
                onClick={() => void openSession(session.id)}
              >
                <MessageCircle size={15} />
                <span>
                  <b>{sessionTitle(session)}</b>
                  <small>
                    {session.location || REGION} · {session.language || "zh"}
                  </small>
                </span>
              </button>
            ))}
          </div>
          <p className="tourist-chat-history-note">
            <ShieldCheck size={14} /> 真实会话记录将同步给导游协同工作台
          </p>
        </aside>

        <section className="tourist-chat-workspace">
          <header className="tourist-chat-toolbar">
            <div>
              <span>当前导览</span>
              <b>{sessionId ? "云南全域文化探索" : "开启新的云南旅程"}</b>
            </div>
            <label>
              <Languages size={16} />
              <select value={language} onChange={(event) => void changeLanguage(event.target.value)}>
                {languages.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </header>

          <div className="message-stream tourist-conversation">
            {!messages.length && (
              <div className="tourist-chat-welcome">
                <span>
                  <Sparkles size={20} />
                </span>
                <h2>想从哪里开始探索云南？</h2>
                <p>问问古城建筑、民族节庆、当地礼仪，或者适合你的旅行路线。</p>
                <div>
                  {["云南有哪些适合第一次到访的文化路线？", "参加民族节庆活动时要注意什么？", "丽江古城有哪些值得了解的建筑？"].map((item) => (
                    <button key={item} onClick={() => setQuestion(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message) =>
              message.role === "user" ? (
                <article className="tourist-message tourist-message-user" key={message.id}>
                  <div>
                    {message.inputType === "image" ? <Camera size={15} /> : message.inputType === "audio" ? <Mic size={15} /> : <UserRound size={15} />}
                  </div>
                  <p>
                    {message.inputType === "image" && <small><Camera size={12} /> 图片识别</small>}
                    {message.inputType === "audio" && <small><Mic size={12} /> 语音提问</small>}
                    {message.content}
                  </p>
                </article>
              ) : (
                <article className="tourist-message tourist-message-assistant" key={message.id}>
                  <div>
                    <Sparkles size={15} />
                  </div>
                  <section>
                    <span>LinguaSpace AI 导游</span>
                    <p>
                      {message.content}
                      {message.streaming && <i className="tourist-stream-cursor" />}
                    </p>
                    {!message.streaming && (
                      <small>
                        <ShieldCheck size={13} />
                        {message.reliable ? `可信 RAG 命中 ${message.sourceCount || 0} 条来源` : "未检索到可靠资料，请补充景点名称或联系导游"}
                        {message.provider && ` · ${message.provider}`}
                        {message.createdAt && (
                          <>
                            <Clock3 size={12} /> {formatTime(message.createdAt)}
                          </>
                        )}
                      </small>
                    )}
                    {message.audioUrl && <audio className="tourist-voice-player" src={message.audioUrl} controls autoPlay />}
                  </section>
                </article>
              ),
            )}
            {busy && (
              <div className="tourist-stream-status">
                <span />
                正在检索文旅知识库，并结合文化图谱生成回答
              </div>
            )}
            <div ref={streamEndRef} />
          </div>

          <footer className="tourist-chat-composer">
            {(notice || error) && <p className={error ? "tourist-chat-error" : ""}>{error || notice}</p>}
            {recording && (
              <div className="tourist-recording-state">
                <span />
                正在聆听你的问题，再次点击麦克风即可发送
              </div>
            )}
            {imageFile && (
              <div className="tourist-image-attachment">
                <Camera size={15} />
                <span>{imageFile.name}</span>
                <button onClick={() => setImageFile(undefined)} title="移除图片">
                  <X size={14} />
                </button>
              </div>
            )}
            <div>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void ask();
                  }
                }}
                placeholder={imageFile ? "补充你想了解的图片内容，或直接发送" : "向 AI 导游提问，Enter 发送，Shift + Enter 换行"}
              />
              <input
                ref={imageInputRef}
                className="tourist-hidden-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => setImageFile(event.target.files?.[0])}
              />
              <button className="tourist-chat-tool" disabled={busy || recording} onClick={() => imageInputRef.current?.click()} title="拍照识别">
                <Camera size={17} />
              </button>
              <button
                className={`tourist-chat-tool tourist-chat-mic ${recording ? "active" : ""}`}
                disabled={busy}
                onClick={() => (recording ? stopRecording() : void startRecording())}
                title={recording ? "停止录音并发送" : "开始语音聊天"}
              >
                {recording ? <Square size={15} /> : <Mic size={17} />}
              </button>
              <button className="primary tourist-chat-send" disabled={busy || recording || (!question.trim() && !imageFile)} onClick={() => void ask()}>
                <Send size={17} />
              </button>
            </div>
            <section>
              <small><Volume2 size={12} /> 支持文字、拍照识别与语音聊天，重要文化信息建议联系真人导游确认。</small>
              <button onClick={() => void handoff()}>
                <ShieldCheck size={15} /> 申请真人导游
              </button>
            </section>
          </footer>
        </section>
      </section>
    </section>
  );
}
