import type { ReactNode } from 'react';

/**
 * Card with a cursor-tracking spotlight. The gradient position is fed
 * through CSS custom properties so the effect costs no re-renders.
 */
export function SpotlightCard({
  children,
  title,
  className = '',
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <section
      className={`card ${className}`.trim()}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
      }}
    >
      {title !== undefined && <h2 className="card__title">{title}</h2>}
      {children}
    </section>
  );
}
