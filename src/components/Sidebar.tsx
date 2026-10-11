import type { View, Account } from '../types';

type Props = {
  activeView: View;
  accounts: Account[];
  userName: string;
  userEmail: string;
  onNavigate: (view: View) => void;
  onSupport: () => void;
  onSignOut: () => void;
};

const navItems: { view: View; label: string; icon: string; count?: string }[] = [
  { view: 'overview', label: 'Overview', icon: '◫' },
  { view: 'activity', label: 'Activity', icon: '↗', count: '4' },
  { view: 'cards', label: 'Cards', icon: '▤' },
  { view: 'planning', label: 'Planning', icon: '◎' },
];

export function Sidebar({ activeView, accounts, userName, userEmail, onNavigate, onSupport, onSignOut }: Props) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#">
        <span className="brand-mark">a</span>
        <span>arc<span className="brand-dot">.</span></span>
      </a>
      <div className="side-label">WORKSPACE</div>
      <nav className="main-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <button
            key={item.view}
            className={`nav-item ${activeView === item.view ? 'active' : ''}`}
            onClick={() => onNavigate(item.view)}
            type="button"
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {item.count ? <span className="nav-count">{item.count}</span> : null}
          </button>
        ))}
      </nav>
      <div className="side-label side-label-spaced">YOUR MONEY</div>
      {accounts.map((account) => (
        <div className="account-link" key={account.lastFour}>
          <span className={`account-dot ${account.kind === 'savings' ? 'savings-dot' : 'checking-dot'}`}></span>
          <span>
            <b>{account.name}</b>
            <small>•• {account.lastFour}</small>
          </span>
          <span className="account-balance">{formatMoney(account.balance, 0)}</span>
        </div>
      ))}
      <button className="add-account" type="button">＋ Add account</button>
      <div className="sidebar-bottom">
        <div className="help-card">
          <span className="help-spark">✳</span>
          <b>A little help goes a long way.</b>
          <p>Our team is here whenever you need us.</p>
          <button type="button" onClick={onSupport}>Talk to Arc <span>↗</span></button>
        </div>
        <button className="profile" type="button" onClick={onSignOut} aria-label={`Sign out ${userName}`}>
          <span className="avatar">{getInitials(userName)}</span>
          <span><b>{userName}</b><small>{userEmail}</small></span>
          <span className="profile-menu">⇥</span>
        </button>
      </div>
    </aside>
  );
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatMoney(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
