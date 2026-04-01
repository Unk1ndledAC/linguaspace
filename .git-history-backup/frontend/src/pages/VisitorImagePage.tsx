import DemoImageRecognition from "../components/DemoImageRecognition";
import VisitorShell from "../components/VisitorShell";

export default function VisitorImagePage() {
  return (
    <VisitorShell
      eyebrow="Vision"
      title="图片识别讲解"
      description="上传现场图片并输入问题，视觉模型先识别图片，再由知识库增强生成讲解内容。"
    >
      <DemoImageRecognition />
    </VisitorShell>
  );
}
