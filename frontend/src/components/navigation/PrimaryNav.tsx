import { NavLink } from "react-router-dom";
import { modules, type ModuleKey } from "../../config/navigation";

export function PrimaryNav({ compact = false }: { compact?: boolean }) {
  return (
    <nav className={compact ? "primary-nav compact-nav" : "primary-nav"}>
      {(Object.keys(modules) as ModuleKey[]).map((key) => (
        <NavLink key={key} to={modules[key].home}>{modules[key].label}</NavLink>
      ))}
    </nav>
  );
}
