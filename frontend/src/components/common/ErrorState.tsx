import { CircleAlert, RefreshCw } from "lucide-react";

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="state-card error-state">
      <CircleAlert size={20} />
      <span>{message}</span>
      {retry && <button className="text-button" onClick={retry}><RefreshCw size={15} />重试</button>}
    </div>
  );
}
