import { Camera, Image, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { touristApi } from "../../api/tourist";
import type { ImageAskResult } from "../../api/types";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { LoadingState } from "../../components/common/LoadingState";

export function TouristImagePage() {
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState("");
  const [question, setQuestion] = useState("请介绍图片中的云南文旅内容");
  const [result, setResult] = useState<ImageAskResult>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!file) return setPreview("");
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const ask = async () => {
    if (!file) return;
    setBusy(true); setError("");
    try { setResult(await touristApi.askImage(file, question)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "图片识别失败"); }
    finally { setBusy(false); }
  };
  return <section className="page-stack tourist-service-page tourist-image-page"><section className="media-banner image-banner"><div><span className="page-kicker"><Camera size={16} /> VISION RAG GUIDE</span><h1>拍照识别，发现文化故事</h1><p>视觉模型只负责提取线索，文化解释仍由可信知识库和图谱链路生成。</p></div></section><section className="media-workspace"><div className="upload-zone image-zone">{preview ? <img src={preview} alt="待识别预览" /> : <><Image size={36} /><strong>上传旅行照片</strong><p>建筑、景观、菜单或路牌都可以成为文化入口。</p></>}<label className="ghost-upload"><Upload size={16} />选择图片<input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0])} /></label><textarea value={question} onChange={(event) => setQuestion(event.target.value)} /><button className="primary" disabled={!file || busy} onClick={ask}>{busy ? "识别中" : "上传并识别"}</button></div><div className="result-panel">{busy && <LoadingState label="正在执行视觉识别与可信知识检索" />}{error && <ErrorState message={error} retry={ask} />}{!busy && !result && !error && <EmptyState label="上传图片后，这里展示后端识别摘要和文化讲解" />}{result && <><span className="page-kicker">VISION SUMMARY</span><p>{result.vision_summary || "视觉模型未返回可展示摘要，文化解释仍按后端结果呈现。"}</p><span className="page-kicker">RAG CULTURE ANSWER</span><p>{result.answer}</p><small>来源 {result.sources.length} 条 · 图谱关系 {result.graph?.length ?? 0} 条 · {result.reliable ? "已命中可靠资料" : "未达到可靠阈值"}</small></>}</div></section></section>;
}
