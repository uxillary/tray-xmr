import type { ReactNode } from "react";

export function MetricCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail?: string }) {
  return (
    <article className="metric-card">
      <div className="metric-top"><span className="metric-icon" aria-hidden="true">{icon}</span><span className="metric-label">{label}</span></div>
      <div className={`metric-value${value === "—" ? " metric-value--empty" : ""}${value === "Unavailable" ? " metric-value--text" : ""}`}>{value}</div>
      {detail && <div className="metric-detail">{detail}</div>}
    </article>
  );
}
