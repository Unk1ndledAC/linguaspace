import { HeartHandshake, History, Map, Route, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { touristApi } from "../../api/tourist";
import type { CultureTip, Favorite, Feedback, TouristSession, TravelRoute } from "../../api/types";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { LoadingState } from "../../components/common/LoadingState";

function Heading({ kicker, title, text, variant }: { kicker: string; title: string; text: string; variant: string }) {
  return <header className={`page-heading tourist-service-heading ${variant}`}><span className="page-kicker">{kicker}</span><h1>{title}</h1><p>{text}</p></header>;
}

export function TouristRoutesPage() {
  const [routes, setRoutes] = useState<TravelRoute[]>([]);
  const [recommendations, setRecommendations] = useState<TravelRoute[]>([]);
  const [interest, setInterest] = useState("民族文化");
  const [visitorType, setVisitorType] = useState("深度文化游客");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => { touristApi.routes().then((result) => setRoutes(result.routes)).catch((reason: Error) => setError(reason.message)).finally(() => setBusy(false)); }, []);
  const recommend = async () => { try { const result = await touristApi.recommendRoute({ interest, visitor_type: visitorType }); setRecommendations(result.items); } catch (reason) { setError(reason instanceof Error ? reason.message : "路线推荐失败"); } };
  const visible = recommendations.length ? recommendations : routes;
  return <section className="page-stack tourist-service-page tourist-routes-page"><Heading variant="tourist-routes-heading" kicker="YUNNAN ROUTES" title="按兴趣发现云南路线" text="路线卡片与推荐结果均来自真实后端路线库。"/><section className="route-filter"><input value={visitorType} onChange={(event) => setVisitorType(event.target.value)} placeholder="游客类型" /><input value={interest} onChange={(event) => setInterest(event.target.value)} placeholder="兴趣主题" /><button className="primary compact" onClick={recommend}><Sparkles size={15} />生成真实推荐</button></section>{busy && <LoadingState />}{error && <ErrorState message={error} />}{!busy && !visible.length && <EmptyState label="暂无真实路线" />}<section className="route-grid">{visible.map((item) => <article key={item.route_key}><Map size={19} /><h3>{item.name}</h3><p>{item.reason}</p><small>{item.mode}</small><div>{item.nodes.split("|").map((node) => <span key={node}>{node}</span>)}</div></article>)}</section></section>;
}

export function TouristCultureTipsPage() {
  const [items, setItems] = useState<CultureTip[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { touristApi.cultureTips().then((result) => setItems(result.items)).catch((reason: Error) => setError(reason.message)); }, []);
  return <section className="page-stack tourist-service-page tourist-culture-page"><Heading variant="tourist-culture-heading" kicker="CULTURE TIPS" title="带着尊重走近当地文化" text="文化礼仪、禁忌和风险提示均来自审核知识库。"/>{error && <ErrorState message={error} />}{!error && !items.length && <EmptyState label="暂无命中的审核文化提示" />}{!!items.length && <section className="case-grid">{items.map((item) => <article key={item.id}><HeartHandshake size={20} /><h3>{item.title}</h3><p>{item.summary}</p><small>{item.tags.join(" · ")}</small></article>)}</section>}</section>;
}

export function TouristHistoryPage() {
  const [sessions, setSessions] = useState<TouristSession[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const refresh = () => Promise.all([touristApi.sessions(), touristApi.feedback(), touristApi.favorites()]).then(([sessionResult, feedbackResult, favoriteResult]) => { setSessions(sessionResult.items); setFeedback(feedbackResult.items); setFavorites(favoriteResult.items); }).catch((reason: Error) => setError(reason.message));
  useEffect(() => { void refresh(); }, []);
  const submit = async () => { try { await touristApi.addFeedback({ rating, content }); setContent(""); setMessage("反馈发送成功。"); refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : "反馈发送失败"); } };
  const removeFavorite = async (id: string) => { await touristApi.deleteFavorite(id); refresh(); };
  return <section className="page-stack tourist-service-page tourist-history-page"><Heading variant="tourist-history-heading" kicker="TRAVEL HISTORY" title="回看问答、收藏与反馈" text="聚合真实游客会话、收藏和反馈记录。"/>{error && <ErrorState message={error} retry={refresh} />}<section className="tourist-two-col"><article className="overview-section"><h2>最近会话</h2>{sessions.length ? <div className="history-list">{sessions.map((session) => <article key={session.id}><History size={15} /><div><strong>{session.last_question || "会话尚未提问"}</strong><small>{session.location || "未记录地点"} · {session.status}</small></div></article>)}</div> : <EmptyState label="暂无真实会话" />}</article><article className="overview-section"><h2>提交反馈</h2><div className="feedback-form"><label>评分<input type="number" min="1" max="5" value={rating} onChange={(event) => setRating(Number(event.target.value))} /></label><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="写下本次导览体验" /><button className="primary" disabled={!content.trim()} onClick={submit}><Send size={15} />发送真实反馈</button>{message && <p>{message}</p>}</div></article></section><section className="overview-section"><h2>我的收藏</h2>{favorites.length ? <div className="history-list">{favorites.map((item) => <article key={item.id}><HeartHandshake size={15} /><div><strong>{item.title}</strong><small>{item.item_type}</small></div><button onClick={() => removeFavorite(item.id)}>取消收藏</button></article>)}</div> : <EmptyState label="暂无收藏" />}</section><section className="overview-section"><h2>反馈记录</h2>{feedback.length ? <div className="history-list">{feedback.map((item) => <article key={item.id}><Route size={15} /><div><strong>{item.rating} 分 · {item.status}</strong><small>{item.content}</small></div></article>)}</div> : <EmptyState label="暂无真实反馈记录" />}</section></section>;
}
