import { ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { modules, pageSpecs, type ModuleKey } from "../../config/navigation";

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const module = pathname.split("/")[1] as ModuleKey;
  const spec = pageSpecs[pathname] ?? (pathname.startsWith("/guide/sessions/") ? pageSpecs["/guide/sessions/:id"] : undefined);
  return <div className="breadcrumbs"><span>{modules[module]?.label ?? "LinguaSpace"}</span>{spec && <><ChevronRight size={14} /><b>{spec.label}</b></>}</div>;
}
