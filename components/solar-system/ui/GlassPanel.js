'use client';

/**
 * Reusable translucent surface for the simulator UI.
 *
 * `accent` accepts an RGB triplet (for example `92 118 255`) so the glass can
 * pick up a restrained tint from the selected celestial body without turning
 * the interface into a neon theme.
 */
const GlassPanel = ({
  as: Component = 'div',
  accent = '137 197 255',
  className = '',
  style,
  children,
  ...props
}) => (
  <Component
    {...props}
    className={`liquid-glass-panel ${className}`.trim()}
    style={{ '--glass-accent': accent, ...style }}
  >
    {children}
  </Component>
);

export default GlassPanel;
