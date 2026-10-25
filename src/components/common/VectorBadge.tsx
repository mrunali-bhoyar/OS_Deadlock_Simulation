import React from 'react';
import type { Resource } from '../../types';

interface VectorBadgeProps {
  label?: string;
  values: number[];
  resources: Resource[];
  variant?: 'blue' | 'emerald' | 'amber' | 'slate';
}

export const VectorBadge: React.FC<VectorBadgeProps> = ({
  label,
  values,
  resources,
  variant = 'blue',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return { bg: 'var(--badge-safe-bg)', border: 'var(--badge-safe-border)', text: 'var(--badge-safe-text)' };
      case 'amber':
        return { bg: 'var(--badge-unsafe-bg)', border: 'var(--badge-unsafe-border)', text: 'var(--badge-unsafe-text)' };
      case 'slate':
        return { bg: 'var(--badge-neutral-bg)', border: 'var(--badge-neutral-border)', text: 'var(--text-secondary)' };
      case 'blue':
      default:
        return { bg: 'var(--badge-waiting-bg)', border: 'var(--badge-waiting-border)', text: 'var(--badge-waiting-text)' };
    }
  };

  const style = getVariantStyles();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.25rem 0.6rem',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        fontSize: '0.8rem',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {label && <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>{label}:</span>}
      <span style={{ fontWeight: 700, color: style.text }}>
        [{values.map((val, idx) => `${resources[idx]?.name ?? idx}:${val}`).join(', ')}]
      </span>
    </div>
  );
};
