import type { ReactNode } from "react";

export function EmptyState({ icon, title, description, variant = "standard" }: { icon: ReactNode; title: string; description: string; variant?: "standard" | "timeline" }) {
  return (
    <section className={`empty-state-card${variant === "timeline" ? " empty-state-card--timeline" : ""}`} aria-labelledby="empty-state-title">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <h2 id="empty-state-title">{title}</h2>
      <p className="empty-state-description">{description}</p>
    </section>
  );
}
