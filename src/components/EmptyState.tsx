import type { ReactNode } from "react";

export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <section className="empty-state-card" aria-labelledby="empty-state-title">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <h2 id="empty-state-title">{title}</h2>
      <p className="empty-state-description">{description}</p>
    </section>
  );
}
