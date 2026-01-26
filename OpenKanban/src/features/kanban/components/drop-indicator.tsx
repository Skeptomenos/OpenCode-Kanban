'use client';

import { cn } from '@/lib/utils';

interface DropIndicatorProps {
  isActive: boolean;
}

export function DropIndicator({ isActive }: DropIndicatorProps) {
  return (
    <div
      className={cn(
        'pointer-events-none h-0.5 w-full rounded-full transition-all duration-150 ease-out',
        isActive
          ? 'my-1 h-1 bg-primary opacity-100'
          : 'my-0 h-0 bg-transparent opacity-0'
      )}
      aria-hidden="true"
    />
  );
}
