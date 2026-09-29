import type { EmberCoreState } from "./EmberCore";

export function StatusBadge({ label, tone }: { label: string; tone: EmberCoreState }) {
  return <span className={`status-badge status-badge--${tone}`}><span className="status-badge-dot" aria-hidden="true" />{label}</span>;
}
