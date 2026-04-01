import DemoRoutePlanner from "../components/DemoRoutePlanner";
import VisitorShell from "../components/VisitorShell";

export default function VisitorRoutePage() {
  return (
    <VisitorShell
      eyebrow="Route"
      title="路线推荐"
      description="根据游客类型和兴趣偏好调用后端路线库，生成可解释的游览节点和推荐理由。"
    >
      <DemoRoutePlanner />
    </VisitorShell>
  );
}
