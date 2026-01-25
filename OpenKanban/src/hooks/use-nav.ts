'use client';
import type { NavItem } from '@/types';

export function useFilteredNavItems(items: NavItem[]) {
  // Pass-through hook since we removed auth/RBAC
  return items;
}
