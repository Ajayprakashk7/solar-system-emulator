'use client';

const GlassButton = ({
  as: Component = 'button',
  className = '',
  iconOnly = false,
  children,
  ...props
}) => {
  const componentProps = Component === 'button' && props.type == null
    ? { type: 'button' }
    : {};

  return (
    <Component
      {...componentProps}
      {...props}
      className={`liquid-glass-button ${iconOnly ? 'liquid-glass-button--icon' : ''} ${className}`.trim()}
    >
      {children}
    </Component>
  );
};

export default GlassButton;
