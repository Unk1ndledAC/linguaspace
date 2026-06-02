import { LogOut, UserRound } from "lucide-react";
import { useAuth } from "../../store/AuthContext";

export function RoleSwitcher() {
  const { user, logout } = useAuth();
  if (!user) return <span className="user-chip"><UserRound size={15} />未登录</span>;
  return (
    <button className="user-chip" onClick={logout} title="退出登录">
      <UserRound size={15} />{user.display_name || user.username}<small>{user.role}</small><LogOut size={14} />
    </button>
  );
}
