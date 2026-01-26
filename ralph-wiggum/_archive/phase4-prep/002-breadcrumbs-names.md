# Spec 002: Breadcrumbs Show Names Instead of UUIDs

> **Estimated Time**: 30-45 minutes
> **Priority**: MEDIUM (UX)
> **Risk**: MEDIUM

## Problem Statement

Breadcrumbs display raw UUIDs like `Abc-123-def-456` instead of human-readable project and board names. Users see cryptic identifiers instead of meaningful navigation.

**Current Display:**
```
Project / Abc-123-def-456 / Board / Xyz-789-ghi-012
```

**Expected Display:**
```
Project / My Awesome Project / Board / Sprint 1 Board
```

## Root Cause

The `useBreadcrumbs` hook generates breadcrumbs by simply capitalizing URL path segments. It has no logic to look up actual entity names from the database.

**Current Implementation** (`src/hooks/use-breadcrumbs.tsx:26-31`):
```typescript
return segments.map((segment, index) => {
  const path = `/${segments.slice(0, index + 1).join('/')}`;
  return {
    title: segment.charAt(0).toUpperCase() + segment.slice(1), // Just capitalizes UUID!
    link: path
  };
});
```

## Technical Context

### Route Structure
```
/project/[projectId]/board/[boardId]
```
- `projectId` = UUID of an Issue with type "project"
- `boardId` = UUID of a Board entity

### Files to Modify

1. `OpenKanban/src/hooks/use-breadcrumb-data.tsx` (NEW FILE)
2. `OpenKanban/src/hooks/use-breadcrumbs.tsx` (MODIFY)
3. `OpenKanban/src/components/breadcrumbs.tsx` (MODIFY)

### Key Dependencies

**API Functions** (`src/features/kanban/api.ts`):
```typescript
// Fetch a single issue (projects are issues with type="project")
export async function fetchIssue(id: string): Promise<Issue | null>

// Fetch a board with full details
// Note: Throws ApiError if not found
export async function fetchBoard(id: string): Promise<BoardWithIssues>
```

**Issue Type** (`src/lib/db/schema.ts`):
```typescript
// Issue has a 'title' field
{
  id: string;
  title: string;
  // ...
}
```

**Board Type** (`src/features/kanban/api.ts:290-299`):
```typescript
export type BoardWithIssues = {
  id: string;
  name: string;  // <-- This is what we need
  columnConfig: Array<{...}>;
  issues: Issue[];
};
```

**Query Keys Pattern** (`src/lib/query-keys.ts`):
New keys should be added to the centralized factory.

## Implementation Steps

### Step 1: Update query-keys.ts

Update `OpenKanban/src/lib/query-keys.ts`:

```typescript
export const queryKeys = {
  // ... existing keys
  breadcrumbProject: (projectId: string) => ['breadcrumb-project', projectId] as const,
  breadcrumbBoard: (boardId: string) => ['breadcrumb-board', boardId] as const,
};
```

### Step 2: Create useBreadcrumbData hook

Create new file `OpenKanban/src/hooks/use-breadcrumb-data.tsx`.
**Critical**: Handle `fetchBoard` error since it throws on 404 instead of returning null.

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchIssue, fetchBoard } from '@/features/kanban/api';
import { queryKeys } from '@/lib/query-keys';

/**
 * Fetches project and board names for breadcrumb display.
 * Uses TanStack Query with caching to avoid repeated fetches.
 */
export function useBreadcrumbData(projectId?: string, boardId?: string) {
  const projectQuery = useQuery({
    queryKey: projectId ? queryKeys.breadcrumbProject(projectId) : ['breadcrumb-project', 'idle'],
    queryFn: () => fetchIssue(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,   // Keep in cache for 10 minutes
  });

  const boardQuery = useQuery({
    queryKey: boardId ? queryKeys.breadcrumbBoard(boardId) : ['breadcrumb-board', 'idle'],
    queryFn: () => fetchBoard(boardId!),
    enabled: !!boardId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false, // Don't retry 404s
  });

  return {
    projectName: projectQuery.data?.title ?? undefined,
    boardName: boardQuery.data?.name ?? undefined,
    // Loading is true only if enabled and actually fetching
    isLoading: (!!projectId && projectQuery.isLoading) || (!!boardId && boardQuery.isLoading),
    // If error, we want to fallback to UUID (handled in consumer)
    isError: projectQuery.isError || boardQuery.isError
  };
}
```

### Step 3: Update useBreadcrumbs hook

Replace the entire content of `OpenKanban/src/hooks/use-breadcrumbs.tsx`:

```typescript
'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useBreadcrumbData } from './use-breadcrumb-data';

type BreadcrumbItem = {
  title: string;
  link: string;
  isLoading?: boolean;
};

/**
 * Extracts project and board IDs from the pathname.
 * Handles routes like /project/[id]/board/[id]
 */
function parsePathIds(pathname: string): { projectId?: string; boardId?: string } {
  const projectMatch = pathname.match(/\/project\/([^/]+)/);
  const boardMatch = pathname.match(/\/board\/([^/]+)/);
  
  return {
    projectId: projectMatch?.[1],
    boardId: boardMatch?.[1],
  };
}

/**
 * Hook to generate breadcrumb items from the current pathname.
 * Resolves UUIDs to human-readable names using API data.
 */
export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();
  const { projectId, boardId } = parsePathIds(pathname);
  const { projectName, boardName, isLoading } = useBreadcrumbData(projectId, boardId);

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      
      // Default: capitalize segment
      let title = segment.charAt(0).toUpperCase() + segment.slice(1);
      let itemLoading = false;
      
      // Replace UUID with actual name if available
      if (segment === projectId) {
        if (projectName) {
          title = projectName;
        } else if (isLoading) {
          itemLoading = true;
        }
        // Fallback to UUID if no name and not loading (e.g. error)
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
```

### Step 4: Update Breadcrumbs component

Modify `OpenKanban/src/components/breadcrumbs.tsx`:

```typescript
'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { IconSlash } from '@tabler/icons-react';
import { Fragment } from 'react';

export function Breadcrumbs() {
  const items = useBreadcrumbs();
  if (items.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <Fragment key={item.link}>
            {index !== items.length - 1 && (
              <BreadcrumbItem className='hidden md:block'>
                {item.isLoading ? (
                  <Skeleton className='h-4 w-20' />
                ) : (
                  <BreadcrumbLink href={item.link}>{item.title}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            )}
            {index < items.length - 1 && (
              <BreadcrumbSeparator className='hidden md:block'>
                <IconSlash />
              </BreadcrumbSeparator>
            )}
            {index === items.length - 1 && (
              <BreadcrumbItem>
                {item.isLoading ? (
                  <Skeleton className='h-4 w-24' />
                ) : (
                  <BreadcrumbPage>{item.title}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

## File Structure After Implementation

```
src/hooks/
├── use-breadcrumbs.tsx      # Modified: uses useBreadcrumbData
├── use-breadcrumb-data.tsx  # NEW: TanStack Query hook for names
└── use-mobile.tsx           # Unchanged

src/components/
├── breadcrumbs.tsx          # Modified: handles loading state
└── ...
```

## Verification

### Build Check
```bash
cd OpenKanban && pnpm run build
```
Expected: Build successful, no type errors

### Lint Check
```bash
cd OpenKanban && pnpm run lint
```
Expected: No errors

### Test Check
```bash
cd OpenKanban && pnpm test
```
Expected: All 126 tests pass

### Manual Testing

1. Start dev server: `cd OpenKanban && pnpm run dev`
2. Open `http://localhost:37291`

**Test Case 1: Project name displays**
- Create or navigate to a project
- Look at the breadcrumb bar
- ✓ Should show project name, not UUID

**Test Case 2: Board name displays**
- Navigate to a specific board within a project
- Look at the breadcrumb bar
- ✓ Should show: `Project / [Project Name] / Board / [Board Name]`

**Test Case 3: Loading state**
- Hard refresh the page (Cmd+Shift+R)
- ✓ Should briefly show skeleton loaders in breadcrumb
- ✓ Skeletons should be replaced by actual names

**Test Case 4: Links still work**
- Click on each breadcrumb segment
- ✓ Navigation should work correctly
- ✓ Should go to the correct URL

**Test Case 5: Fallback behavior**
- If API fails (test by blocking network in DevTools)
- ✓ Should fall back to capitalized UUID (graceful degradation)

## Edge Cases Handled

| Case | Expected Behavior |
|------|-------------------|
| Project not found (404) | Falls back to capitalized UUID |
| Board not found (404) | Falls back to capitalized UUID |
| Network error | Falls back to capitalized UUID |
| Very long name | CSS handles truncation (existing styles) |
| No project/board in path | No API calls made (enabled: false) |

## Acceptance Criteria

- [ ] New file `use-breadcrumb-data.tsx` created
- [ ] `useBreadcrumbs` hook updated to resolve names
- [ ] `Breadcrumbs` component handles loading state
- [ ] Skeleton shows during loading
- [ ] Project name displays instead of UUID
- [ ] Board name displays instead of UUID
- [ ] Links remain functional
- [ ] Falls back to UUID on error
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes

## Commit

After verification passes:
```bash
git add src/hooks/use-breadcrumb-data.tsx src/hooks/use-breadcrumbs.tsx src/components/breadcrumbs.tsx
git commit -m "fix(ui): show project/board names in breadcrumbs instead of UUIDs"
```
