import DemoGuide from "../components/DemoGuide";
import VisitorShell from "../components/VisitorShell";

export default function VisitorGuidePage() {
  return (
    <VisitorShell
      eyebrow="AI Guide"
      title="AI 导览问答"
      description="游客在这里输入现场问题，回答会通过后端流式接口逐步显示，并附带知识库来源。"
    >
      <DemoGuide />
    </VisitorShell>
  );
}
