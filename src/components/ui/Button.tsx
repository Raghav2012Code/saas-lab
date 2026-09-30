import type { ComponentPropsWithRef, ReactNode } from 'react';

import { cx } from '../../lib/cx';
import { Icon, type IconName } from './Icon';

type Variant = 'default' | 'primary' | 'quiet';

interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: Variant;
  size?: 'sm' | 'md';
  icon?: IconName;
  iconRight?: IconName;
  children?: ReactNode;
}

export function Button({
  variant = 'default',
  size = 'md',
  icon,
  iconRight,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'quiet' && 'btn-quiet',
        size === 'sm' && 'btn-sm',
        className,
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size={14} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={14} /> : null}
    </button>
  );
}

interface IconButtonProps extends ComponentPropsWithRef<'button'> {
  label: string;
  icon: IconName;
  size?: number;
}

export function IconButton({ label, icon, size = 16, className, ...rest }: IconButtonProps) {
  return (
    <button type="button" aria-label={label} title={label} className={cx('icon-btn', className)} {...rest}>
      <Icon name={icon} size={size} />
    </button>
  );
}
