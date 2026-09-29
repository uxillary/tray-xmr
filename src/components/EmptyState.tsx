import type { ReactNode } from "react";

export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <section className="empty-state-card" aria-labelledby="empty-state-title">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <p className="eyebrow">ACTIVITY FEED</p>
      <h2 id="empty-state-title">{title}</h2>
      <p className="empty-state-description">{description}</p>
      <div className="empty-state-rule"><span /></div>
      <span className="empty-state-footnote">No sample data is shown</span>
    </section>
  );
}
