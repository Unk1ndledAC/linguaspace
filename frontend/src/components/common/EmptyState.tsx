import { Inbox } from "lucide-react";

export function EmptyState({ label = "暂无数据" }: { label?: string }) {
  return <div className="state-card"><Inbox size={20} /><span>{label}</span></div>;
}
