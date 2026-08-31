import { Menu, LogOut, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../shared/constants';
import { Button } from '../shared/ui';
import { useSession } from '../features/session/useSession';
import { cn } from '../shared/lib/utils';

export const AppShell = () => {
  const location = useLocation();
  const { logout, user } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pageLabel =
    NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.label ?? 'Panel';

  return (
    <div className="app-shell">
      <aside className={cn('sidebar', mobileMenuOpen && 'sidebar--open')}>
        <div className="sidebar__brand">
          <span>Admin</span>
          <strong>mapa</strong>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                className={({ isActive }) => cn('sidebar__link', isActive && 'sidebar__link--active')}
                onClick={() => setMobileMenuOpen(false)}
                to={item.path}
              >
                <span className="sidebar__link-icon">
                  <Icon size={18} />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <span className="user-avatar">{user?.username?.slice(0, 1) ?? 'A'}</span>
            <div>
              <strong>{user?.username ?? 'Admin'}</strong>
              <span>{user?.role ?? 'Role unavailable'}</span>
            </div>
          </div>

          <Button
            className="sidebar__logout"
            icon={LogOut}
            onClick={() => {
              void logout();
            }}
            size="sm"
            tone="ghost"
          >
            Sign out
          </Button>
        </div>
      </aside>

      {mobileMenuOpen ? (
        <button
          aria-label="Close menu"
          className="mobile-menu-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          type="button"
        />
      ) : null}

      <div className="app-shell__main">
        <header className="mobile-topbar">
          <div>
            <span className="mobile-topbar__brand">Admin mapa</span>
            <strong>{pageLabel}</strong>
          </div>
          <button
            aria-label="Open menu"
            className="mobile-topbar__toggle"
            onClick={() => setMobileMenuOpen((current) => !current)}
            type="button"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </header>

        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
