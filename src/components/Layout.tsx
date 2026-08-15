import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  TrendingUp,
  FolderKanban,
  Building2,
  Settings,
  BarChart3,
  UserCog,
  LogOut,
} from 'lucide-react';
import { Avatar } from './ui';
import { users } from '../data/seed';
import { useAuth } from '../lib/useAuth';
import { useDemoSession } from '../lib/demoSession';

interface NavEntry {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

const primaryNav: NavEntry[] = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/team-pipeline', label: 'Team Pipeline', icon: <FolderKanban size={18} /> },
  { to: '/advisors', label: 'Advisors', icon: <Users size={18} /> },
  { to: '/production', label: 'Production', icon: <TrendingUp size={18} /> },
];

const businessNav: NavEntry[] = [
  { to: '/subscriptions', label: 'Subscriptions', icon: <CreditCard size={18} /> },
  { to: '/companies', label: 'Companies', icon: <Building2 size={18} /> },
];

const adminNav: NavEntry[] = [
  { to: '/users', label: 'Users & Access', icon: <UserCog size={18} /> },
  { to: '/settings', label: 'Settings & Roles', icon: <Settings size={18} /> },
];

/** Founders-only nav (reports etc.) — shown above admin section. */
const managementNav: NavEntry[] = [
  { to: '/performance', label: 'Performance', icon: <BarChart3 size={18} /> },
];

function NavList({ items }: { items: NavEntry[] }) {
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
        </NavLink>
      ))}
    </>
  );
}

const titles: Record<string, { title: string; sub: string }> = {
  '/': { title: 'Dashboard', sub: 'Business overview across all advisors' },
  '/team-pipeline': { title: 'Team Pipeline', sub: 'Management-scoped client cases' },
  '/team-pipeline-demo': { title: 'Team Pipeline', sub: 'Seeded ASI demo data only' },
  '/advisors': { title: 'Advisors', sub: 'Everyone using AdvisorTrack' },
  '/production': { title: 'Production', sub: 'Submitted vs issued commission' },
  '/subscriptions': { title: 'Subscriptions', sub: 'Licenses, trials & renewals' },
  '/companies': { title: 'Companies', sub: 'Corporate license pools' },
  '/invoices': { title: 'Invoices', sub: 'Billing & PDF generation' },
  '/support': { title: 'Support', sub: 'Customer queries & tickets' },
  '/performance': { title: 'Performance', sub: 'Team and advisor operational performance' },
  '/reports': { title: 'Performance', sub: 'Team and advisor operational performance' },
  '/users': { title: 'Users & Access', sub: 'Company admins and team managers' },
  '/settings': { title: 'Settings & Roles', sub: 'Team access and permissions' },
};

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { signOut, session } = useAuth();
  const { selectedDemoUser, resetDemoUser } = useDemoSession();
  const isDemoRoute = pathname.startsWith('/team-pipeline-demo');
  const matchKey =
    Object.keys(titles)
      .filter((k) => k !== '/' && pathname.startsWith(k))
      .sort((a, b) => b.length - a.length)[0] ?? '/';
  const header =
    isDemoRoute && selectedDemoUser
      ? { title: 'Team Pipeline', sub: `${selectedDemoUser.name} · ${selectedDemoUser.role}` }
      : titles[matchKey];

  if (isDemoRoute && !selectedDemoUser) {
    return <>{children}</>;
  }

  const me = users[0];
  const sessionName = session
    ? `${session.user.firstName ?? ''} ${session.user.lastName ?? ''}`.trim() || session.user.email
    : me.name;
  const sessionRole =
    session?.role?.name ||
    (session?.isPlatformAdmin ? 'Platform admin' : null) ||
    'AdvisorTrack user';
  const profile = isDemoRoute ? selectedDemoUser! : { ...me, name: sessionName };
  const profileRole = isDemoRoute ? selectedDemoUser!.role : sessionRole;
  const profileSub = isDemoRoute ? selectedDemoUser!.scopeLabel : session?.organisation?.name || sessionRole;
  const isFounderDemo = isDemoRoute && selectedDemoUser?.role === 'Founder/Admin';
  const profileAvatarColor = isDemoRoute ? (isFounderDemo ? '#8b5cf6' : '#1f6feb') : 'var(--brand)';
  const demoNav: NavEntry[] = isFounderDemo
    ? [...primaryNav, ...businessNav, ...managementNav, ...adminNav]
    : [{ to: '/team-pipeline-demo', label: 'Team Pipeline', icon: <FolderKanban size={18} /> }];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img className="sidebar-logo" src="/brand/logo-on-dark.svg" alt="AdvisorTrack" />
          <div className="tag">{isDemoRoute && selectedDemoUser ? selectedDemoUser.role : 'Admin Console'}</div>
        </div>

        <nav>
          {isDemoRoute && !isFounderDemo ? (
            <>
              <div className="nav-section-label">Demo</div>
              <NavList items={demoNav} />
            </>
          ) : isDemoRoute && isFounderDemo ? (
            <>
              <div className="nav-section-label">Overview</div>
              <NavList items={primaryNav} />
              <div className="nav-section-label">Business</div>
              <NavList items={businessNav} />
              <div className="nav-section-label">Management</div>
              <NavList items={managementNav} />
              <div className="nav-section-label">Admin</div>
              <NavList items={adminNav} />
            </>
          ) : (
            <>
              <div className="nav-section-label">Overview</div>
              <NavList items={primaryNav} />
              <div className="nav-section-label">Business</div>
              <NavList items={businessNav} />
              <div className="nav-section-label">Management</div>
              <NavList items={managementNav} />
              <div className="nav-section-label">Admin</div>
              <NavList items={adminNav} />
            </>
          )}
        </nav>

        <div className="sidebar-foot">
          <Avatar name={profile.name} color={profileAvatarColor} size={34} />
          <div className="meta">
            <div className="n">{profile.name}</div>
            <div className="r">{profileRole}</div>
            {isDemoRoute ? <div className="r" style={{ fontSize: 11 }}>{profileSub}</div> : null}
          </div>
          <button
            onClick={() => {
              if (isDemoRoute) {
                resetDemoUser();
                navigate('/team-pipeline-demo', { replace: true });
                return;
              }
              signOut();
            }}
            title={isDemoRoute ? 'Switch demo user' : 'Sign out'}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.72)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <LogOut size={16} />
            <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{isDemoRoute ? 'Switch demo user' : 'Sign out'}</span>
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
        <div className="page" style={isDemoRoute ? { maxWidth: 'none' } : undefined}>
          {children}
        </div>
      </div>
    </div>
  );
}
