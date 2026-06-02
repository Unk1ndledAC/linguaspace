import { Outlet } from "react-router-dom";
import { PrimaryNav } from "../components/navigation/PrimaryNav";
import { RoleSwitcher } from "../components/navigation/RoleSwitcher";
import { SecondaryNav } from "../components/navigation/SecondaryNav";
import { modules, type ModuleKey } from "../config/navigation";

export function TourismLayout({ module }: { module: ModuleKey }) {
  if (module === "intro") {
    return (
      <div className="tourism-shell module-intro">
        <aside className="intro-sidebar">
          <a className="brand-mark intro-sidebar-brand" href="/intro/overview"><b>语界</b><span>LinguaSpace</span></a>
          <div className="intro-sidebar-caption"><span>YUNNAN CULTURAL TOURISM AI</span><strong>{modules[module].label}</strong></div>
          <SecondaryNav module={module} />
          <div className="intro-sidebar-portals">
            <span>PLATFORM PORTALS</span>
            <PrimaryNav compact />
          </div>
          <div className="intro-sidebar-user"><RoleSwitcher /></div>
        </aside>
        <header className="tourism-header intro-mobile-header">
          <a className="brand-mark" href="/intro/overview"><b>语界</b><span>LinguaSpace</span></a>
          <PrimaryNav />
          <RoleSwitcher />
        </header>
        <div className="tourism-subnav intro-mobile-subnav"><strong>{modules[module].label}</strong><SecondaryNav module={module} /></div>
        <main className="tourism-content"><Outlet /></main>
      </div>
    );
  }

  if (module === "tourist") {
    return (
      <div className="tourism-shell module-tourist">
        <aside className="tourist-sidebar">
          <a className="brand-mark tourist-sidebar-brand" href="/intro/overview"><b>语界</b><span>LinguaSpace</span></a>
          <div className="tourist-sidebar-caption"><span>YOUR YUNNAN JOURNEY</span><strong>{modules[module].label}</strong><small>可信多语文旅服务</small></div>
          <SecondaryNav module={module} />
          <div className="tourist-sidebar-portals">
            <span>PLATFORM PORTALS</span>
            <PrimaryNav compact />
          </div>
          <div className="tourist-sidebar-user"><RoleSwitcher /></div>
        </aside>
        <header className="tourism-header tourist-mobile-header">
          <a className="brand-mark" href="/intro/overview"><b>语界</b><span>LinguaSpace</span></a>
          <PrimaryNav />
          <RoleSwitcher />
        </header>
        <div className="tourism-subnav tourist-mobile-subnav"><strong>{modules[module].label}</strong><SecondaryNav module={module} /></div>
        <main className="tourism-content"><Outlet /></main>
      </div>
    );
  }

  return (
    <div className={`tourism-shell module-${module}`}>
      <header className="tourism-header">
        <a className="brand-mark" href="/intro/overview"><b>语界</b><span>LinguaSpace</span></a>
        <PrimaryNav />
        <RoleSwitcher />
      </header>
      <div className="tourism-subnav"><strong>{modules[module].label}</strong><SecondaryNav module={module} /></div>
      <main className="tourism-content"><Outlet /></main>
    </div>
  );
}
