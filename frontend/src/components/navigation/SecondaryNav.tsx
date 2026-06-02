import { NavLink } from "react-router-dom";
import { modulePages, type ModuleKey } from "../../config/navigation";

export function SecondaryNav({ module }: { module: ModuleKey }) {
  return (
    <nav className="secondary-nav">
      {modulePages[module].map(({ icon: Icon, label, path }) => (
        <NavLink key={path} to={path}><Icon size={15} />{label}</NavLink>
      ))}
    </nav>
  );
}
