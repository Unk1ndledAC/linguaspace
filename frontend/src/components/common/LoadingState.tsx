import { LoaderCircle } from "lucide-react";

export function LoadingState({ label = "正在读取真实后端数据" }: { label?: string }) {
  return <div className="state-card"><LoaderCircle className="spin" size={20} /><span>{label}</span></div>;
}
