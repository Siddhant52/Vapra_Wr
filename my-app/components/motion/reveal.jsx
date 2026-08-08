"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Fade + rise into view once, the first time it scrolls into the viewport.
 * Wrap any section/card with this instead of hand-rolling animation props
 * so timing/easing stays consistent site-wide. Respects the user's
 * prefers-reduced-motion setting automatically.
 *
 * Usage: <Reveal><Card>...</Card></Reveal>
 *        <Reveal delay={0.1} y={16}>...</Reveal>
 */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  duration = 0.55,
  className,
  as = "div",
  once = true,
}) {
  const prefersReducedMotion = useReducedMotion();
  const Component = motion[as] || motion.div;

  if (prefersReducedMotion) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </Component>
  );
}

/**
 * Stagger container: wrap a list/grid of children with this, and each
 * direct child that uses <StaggerItem> will reveal in sequence as the
 * group scrolls into view (instead of all popping in at once).
 *
 * Usage:
 *   <StaggerGroup className="grid grid-cols-3 gap-6">
 *     {items.map((item) => <StaggerItem key={item.id}>...</StaggerItem>)}
 *   </StaggerGroup>
 */
export function StaggerGroup({ children, className, staggerDelay = 0.08 }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, y = 20 }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
