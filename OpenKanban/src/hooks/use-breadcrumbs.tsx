'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useBreadcrumbData } from './use-breadcrumb-data';

type BreadcrumbItem = {
  title: string;
  link: string;
  isLoading?: boolean;
};

function parsePathIds(pathname: string): { projectId?: string; boardId?: string } {
  const projectMatch = pathname.match(/\/project\/([^/]+)/);
  const boardMatch = pathname.match(/\/board\/([^/]+)/);
  
  return {
    projectId: projectMatch?.[1],
    boardId: boardMatch?.[1],
  };
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();
  const { projectId, boardId } = parsePathIds(pathname);
  const { projectName, boardName, isLoading } = useBreadcrumbData(projectId, boardId);

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      
      let title = segment.charAt(0).toUpperCase() + segment.slice(1);
      let itemLoading = false;
      
      if (segment === projectId) {
        if (projectName) {
          title = projectName;
        } else if (isLoading) {
          itemLoading = true;
        }
      } else if (segment === boardId) {
        if (boardName) {
          title = boardName;
        } else if (isLoading) {
          itemLoading = true;
        }
      }
      
      return { title, link: path, isLoading: itemLoading };
    });
  }, [pathname, projectId, boardId, projectName, boardName, isLoading]);

  return breadcrumbs;
}
