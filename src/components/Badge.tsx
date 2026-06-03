import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'muted';
  className?: string;
}

const variants = {
  default: 'bg-surface-2 text-text-secondary',
  accent: 'bg-accent-muted text-accent',
  muted: 'bg-surface-2 text-text-muted',
} as const;

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-pill ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
