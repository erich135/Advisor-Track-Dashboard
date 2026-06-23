import { NavLink, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  TrendingUp,
  FileText,
  LifeBuoy,
  Building2,
  Settings,
  BarChart3,
  UserCog,
  LogOut,
} from 'lucide-react';
import { Avatar } from './ui';
import { users } from '../data/seed';
import { supportTickets } from '../data/seed';
import { useAuth } from '../lib/useAuth';

const openTickets = supportTickets.filter((t) => t.status !== 'resolved').length;

interface NavEntry {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

const primaryNav: NavEntry[] = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/advisors', label: 'Advisors', icon: <Users size={18} /> },
  { to: '/production', label: 'Production', icon: <TrendingUp size={18} /> },
];

const businessNav: NavEntry[] = [
  { to: '/subscriptions', label: 'Subscriptions', icon: <CreditCard size={18} /> },
  { to: '/companies', label: 'Companies', icon: <Building2 size={18} /> },
  { to: '/invoices', label: 'Invoices', icon: <FileText size={18} /> },
  { to: '/support', label: 'Support', icon: <LifeBuoy size={18} />, badge: openTickets },
];

const adminNav: NavEntry[] = [
  { to: '/users', label: 'Users & Access', icon: <UserCog size={18} /> },
  { to: '/settings', label: 'Settings & Roles', icon: <Settings size={18} /> },
];

/** Founders-only nav (reports etc.) — shown above admin section. */
const foundersNav: NavEntry[] = [
  { to: '/reports', label: 'Reports', icon: <BarChart3 size={18} /> },
];

function NavList({ items, founders }: { items: NavEntry[]; founders?: boolean }) {
  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          {item.icon}
          <span>{item.label}</span>
          {item.badge ? <span className="badge">{item.badge}</span> : null}
          {founders && !item.badge && <span className="nav-founders-tag">founders</span>}
        </NavLink>
      ))}
    </>
  );
}

const titles: Record<string, { title: string; sub: string }> = {
  '/': { title: 'Dashboard', sub: 'Business overview across all advisors' },
  '/advisors': { title: 'Advisors', sub: 'Everyone using AdvisorTrack' },
  '/production': { title: 'Production', sub: 'Submitted vs issued commission' },
  '/subscriptions': { title: 'Subscriptions', sub: 'Licenses, trials & renewals' },
  '/companies': { title: 'Companies', sub: 'Corporate license pools' },
  '/invoices': { title: 'Invoices', sub: 'Billing & PDF generation' },
  '/support': { title: 'Support', sub: 'Customer queries & tickets' },
  '/reports': { title: 'Reports', sub: 'Revenue & growth — founders only' },
  '/users': { title: 'Users & Access', sub: 'Company admins and team managers' },
  '/settings': { title: 'Settings & Roles', sub: 'Team access and permissions' },
};

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const me = users[0];
  const matchKey =
    Object.keys(titles)
      .filter((k) => k !== '/' && pathname.startsWith(k))
      .sort((a, b) => b.length - a.length)[0] ?? '/';
  const header = titles[matchKey];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="logo">
            <TrendingUp size={18} />
          </span>
          <div>
            <div className="name">AdvisorTrack</div>
            <div className="tag">Admin Console</div>
          </div>
        </div>

        <nav>
          <div className="nav-section-label">Overview</div>
          <NavList items={primaryNav} />
          <div className="nav-section-label">Business</div>
          <NavList items={businessNav} />
          <div className="nav-section-label">Founders</div>
          <NavList items={foundersNav} founders />
          <div className="nav-section-label">Admin</div>
          <NavList items={adminNav} />
        </nav>

        <div className="sidebar-foot">
          <Avatar name={me.name} color={me.avatarColor} size={34} />
          <div className="meta">
            <div className="n">{me.name}</div>
            <div className="r">Super Admin · Founder</div>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#768390', cursor: 'pointer', padding: 4, display: 'grid', placeItems: 'center' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1>{header.title}</h1>
          </div>
          <div className="sub">· {header.sub}</div>
          <div className="spacer" />
        </header>
        <div className="page">{children}</div>
      </div>
    </div>
  );
}
