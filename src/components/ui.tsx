import type { ReactNode } from 'react';
import { initials } from '../lib/format';

export function Avatar({
  name,
  color,
  size = 30,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  delta,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  delta?: { dir: 'up' | 'down'; text: string };
}) {
  return (
    <div className="card card-pad stat">
      <div className="stat-top">
        <span className="label">{label}</span>
        <span className="icon" style={{ background: iconBg, color: iconColor }}>
          {icon}
        </span>
      </div>
      <span className="value">{value}</span>
      {delta && (
        <span className={`delta ${delta.dir}`}>
          {delta.dir === 'up' ? '▲' : '▼'} {delta.text}
        </span>
      )}
    </div>
  );
}

export function Pill({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export function Progress({ value, color }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="progress">
      <span style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card">
      <div style={{ padding: 16 }}>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="row" style={{ gap: 16, marginBottom: 14 }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="skeleton"
                style={{ height: 16, flex: c === 0 ? 2 : 1 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageIntro({ children }: { children: ReactNode }) {
  return <p className="page-intro">{children}</p>;
}
