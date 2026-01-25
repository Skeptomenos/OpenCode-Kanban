'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { getQueryClient } from '@/lib/query-client';

import { ActiveThemeProvider } from '../active-theme';

export function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue?: string;
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ActiveThemeProvider initialTheme={activeThemeValue ?? undefined}>
        {children}
      </ActiveThemeProvider>
    </QueryClientProvider>
  );
}
