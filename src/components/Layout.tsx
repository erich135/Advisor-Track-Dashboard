import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  FileText,
  History,
  ClipboardList,
  Shield,
  KeyRound,
  Upload,
  Network,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { CompanyContextMark } from './CompanyContext';
import { Avatar } from './ui';
import { users } from '../data/seed';
import { sessionCompanyName } from '../lib/companyContext';
import { ENTERPRISE_PLAN_NAME } from '../lib/enterpriseContract';
import {
  buildCustomerNav,
  buildPlatformNav,
  navItemIsActive,
  type PortalNavItem,
  type PortalNavSection,
} from '../lib/portalNavigation';
import { useAuth } from '../lib/useAuth';
import { useDemoSession } from '../lib/demoSession';
import { AssistantShell } from './assistant/AssistantShell';

function NavIcon({ item }: { item: PortalNavItem }) {
  if (item.highlight === 'regions') return <Network size={18} />;
  switch (item.to.split('?')[0]) {
    case '/':
      return <LayoutDashboard size={18} />;
    case '/team-pipeline':
    case '/team-pipeline-demo':
      return <FolderKanban size={18} />;
    case '/advisors':
      return <Users size={18} />;
    case '/production':
      return <TrendingUp size={18} />;
    case '/users':
      return <UserCog size={18} />;
    case '/licences':
    case '/licence-requests':
      return <KeyRound size={18} />;
    case '/bulk-import':
      return <Upload size={18} />;
    case '/settings':
      return <Settings size={18} />;
    case '/subscription':
    case '/subscriptions':
      return <CreditCard size={18} />;
    case '/invoices':
      return <FileText size={18} />;
    case '/companies':
      return <Building2 size={18} />;
    case '/performance':
      return <BarChart3 size={18} />;
    case '/audit':
      return <History size={18} />;
    case '/enterprise-customers':
      return <Shield size={18} />;
    case '/engineering/changelog':
      return <ClipboardList size={18} />;
    default:
      return <LayoutDashboard size={18} />;
  }
}

function NavList({ items }: { items: PortalNavItem[] }) {
  const { pathname, search } = useLocation();
  return (
    <>
      {items.map((item) => (
        <Link
          key={`${item.to}:${item.highlight ?? 'default'}`}
          to={item.to}
          className={`nav-item ${navItemIsActive(item, pathname, search) ? 'active' : ''}`}
          aria-current={navItemIsActive(item, pathname, search) ? 'page' : undefined}
        >
          <NavIcon item={item} />
          <span>{item.label}</span>
        </Link>
      ))}
    </>
  );
}

function NavSections({ sections }: { sections: PortalNavSection[] }) {
  return (
    <>
      {sections.map((entry) => (
        <div key={entry.id} className="nav-section">
          <div className="nav-section-label">{entry.label}</div>
          <NavList items={entry.items} />
        </div>
      ))}
    </>
  );
}

const titles: Record<string, { title: string; sub: string }> = {
  '/': { title: 'Dashboard', sub: 'Leadership issued-performance overview' },
  '/team-pipeline': { title: 'Team Pipeline', sub: 'Management-scoped client cases' },
  '/team-pipeline-demo': { title: 'Team Pipeline', sub: 'Seeded ASI demo data only' },
  '/advisors': { title: 'Advisors', sub: 'Everyone using AdvisorTrack' },
  '/production': { title: 'Production', sub: 'Submitted vs issued commission' },
  '/subscriptions': { title: 'Subscriptions', sub: 'Customer plans, licences & billing' },
  '/companies': { title: 'Companies', sub: 'Corporate licence pools' },
  '/invoices': { title: 'Invoices', sub: 'Billing, PDF & invoice delivery' },
  '/audit': { title: 'Audit', sub: 'Internal administrative history' },
  '/support': { title: 'Support', sub: 'Customer queries & tickets' },
  '/performance': { title: 'Performance', sub: 'Team and advisor operational performance' },
  '/reports': { title: 'Performance', sub: 'Team and advisor operational performance' },
  '/users': { title: 'Users & Access', sub: 'People in your authorised management scope' },
  '/licences': { title: 'Licences', sub: 'Purchased, assigned and available company licences' },
  '/subscription': { title: 'Subscription', sub: 'Your organisation’s AdvisorTrack Enterprise contract' },
  '/bulk-import': { title: 'Bulk Import', sub: 'Import users into your organisation with an Excel workbook' },
  '/settings': { title: 'Settings & Roles', sub: 'Team access and permissions' },
  '/engineering/changelog': {
    title: 'Engineering Change Log',
    sub: 'Pinned decisions and recent internal changes',
  },
  '/enterprise-customers': {
    title: 'Enterprise Customers',
    sub: 'Internal AdvisorTrack onboarding — not a customer portal',
  },
  '/licence-requests': {
    title: 'Licence Requests',
    sub: 'Internal queue for additional purchased licences',
  },
  '/not-found': { title: 'Page not found', sub: 'This address is not part of the Management Portal' },
};

const engineeringNav: PortalNavItem[] = [
  { to: '/engineering/changelog', label: 'Change Log' },
];

const founderOverview: PortalNavItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/team-pipeline', label: 'Team Pipeline' },
  { to: '/advisors', label: 'Advisors' },
  { to: '/production', label: 'Production' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { signOut, session } = useAuth();
  const { selectedDemoUser, resetDemoUser } = useDemoSession();
  const isDemoRoute = pathname.startsWith('/team-pipeline-demo');
  const prefixKey = Object.keys(titles)
    .filter((key) => key !== '/' && key !== '/not-found' && pathname.startsWith(key))
    .sort((left, right) => right.length - left.length)[0];
  const matchKey =
    pathname.startsWith('/companies/') && pathname !== '/companies'
      ? '/customer-account'
      : pathname === '/'
        ? '/'
        : prefixKey ?? '/not-found';
  const usersTab = new URLSearchParams(search).get('tab');
  const header =
    isDemoRoute && selectedDemoUser
      ? { title: 'Team Pipeline', sub: `${selectedDemoUser.name} · ${selectedDemoUser.role}` }
      : matchKey === '/customer-account'
        ? { title: 'Customer account', sub: 'Connected subscription, users, licences and invoices' }
        : pathname === '/users' && (usersTab === 'regions' || usersTab === 'teams')
          ? { title: 'Regions & Teams', sub: 'Regions and teams in your authorised organisation' }
          : titles[matchKey] ?? titles['/not-found'];

  if (isDemoRoute && !selectedDemoUser) {
    return <>{children}</>;
  }

  const me = users[0];
  const sessionName = session
    ? `${session.user.firstName ?? ''} ${session.user.lastName ?? ''}`.trim() || session.user.email
    : me.name;
  const sessionRole =
    session?.hierarchy?.label ||
    session?.role?.name ||
    (session?.isPlatformAdmin ? 'App Admin' : null) ||
    'AdvisorTrack user';
  const companyName = sessionCompanyName(session);
  const profile = isDemoRoute ? selectedDemoUser! : { ...me, name: sessionName };
  const profileRole = isDemoRoute ? selectedDemoUser!.role : sessionRole;
  const profileSub = isDemoRoute ? selectedDemoUser!.scopeLabel : session?.organisation?.name || sessionRole;
  const isFounderDemo = isDemoRoute && selectedDemoUser?.role === 'Founder/Admin';
  const profileAvatarColor = isDemoRoute ? (isFounderDemo ? '#8b5cf6' : '#1f6feb') : 'var(--brand)';
  const demoNav: PortalNavItem[] = isFounderDemo
    ? founderOverview
    : [{ to: '/team-pipeline-demo', label: 'Team Pipeline' }];
  const customerSections = buildCustomerNav(session, 'production');
  const platformSections = buildPlatformNav(session);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <BrandLogo variant="on-dark" className="sidebar-logo" />
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
              <NavList items={founderOverview} />
            </>
          ) : session?.isPlatformAdmin ? (
            <NavSections sections={platformSections} />
          ) : (
            <NavSections sections={customerSections} />
          )}
          {!isDemoRoute && session?.canAccessEngineeringChangelog ? (
            <>
              <div className="nav-section-label">Engineering</div>
              <NavList items={engineeringNav} />
            </>
          ) : null}
        </nav>

        <div className="sidebar-foot">
          <Avatar name={profile.name} color={profileAvatarColor} size={34} />
          <div className="meta">
            <div className="n">{profile.name}</div>
            <div className="r">{profileRole}</div>
            {isDemoRoute ? (
              <div className="r" style={{ fontSize: 11 }}>
                {profileSub}
              </div>
            ) : (
              <CompanyContextMark name={companyName} plan={ENTERPRISE_PLAN_NAME} testId="sidebar-company-context" />
            )}
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
            <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
              {isDemoRoute ? 'Switch demo user' : 'Sign out'}
            </span>
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
          {isDemoRoute ? null : <CompanyContextMark name={companyName} plan={ENTERPRISE_PLAN_NAME} />}
        </header>
        <div className="page" style={isDemoRoute ? { maxWidth: 'none' } : undefined}>
          {children}
        </div>
      </div>
      {isDemoRoute ? null : (
        <AssistantShell environment="production" />
      )}
    </div>
  );
}
