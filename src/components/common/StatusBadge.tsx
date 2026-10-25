import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertOctagon, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status:
    | 'SAFE'
    | 'UNSAFE'
    | 'DEADLOCKED'
    | 'WAITING'
    | 'GRANTED'
    | 'DENIED'
    | 'PASSED'
    | 'FAILED'
    | 'NOT_RUN'
    | 'RUNNING';
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const displayLabel = label || status;

  switch (status) {
    case 'SAFE':
    case 'GRANTED':
    case 'PASSED':
      return (
        <span className="badge badge-safe">
          <CheckCircle2 size={13} />
          <span>{displayLabel}</span>
        </span>
      );

    case 'UNSAFE':
      return (
        <span className="badge badge-unsafe">
          <AlertOctagon size={13} />
          <span>{displayLabel}</span>
        </span>
      );

    case 'DEADLOCKED':
    case 'DENIED':
    case 'FAILED':
      return (
        <span className="badge badge-deadlocked">
          <XCircle size={13} />
          <span>{displayLabel}</span>
        </span>
      );

    case 'WAITING':
      return (
        <span className="badge badge-waiting">
          <Clock size={13} />
          <span>{displayLabel}</span>
        </span>
      );

    case 'NOT_RUN':
    default:
      return (
        <span className="badge badge-neutral">
          <HelpCircle size={13} />
          <span>{displayLabel}</span>
        </span>
      );
  }
};
