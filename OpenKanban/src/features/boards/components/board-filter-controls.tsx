'use client';

/**
 * Board Filter Controls Component
 * @see specs/4.7-filter-builder.md
 *
 * Provides UI controls to filter Kanban board tasks by status.
 * Uses controlled props pattern - state managed by parent component.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ALL_ISSUE_STATUSES,
  FILTER_ALL,
  STATUS_LABELS,
} from '@/lib/constants/statuses';
import type { BoardFilters } from '@/lib/query-keys';

interface BoardFilterControlsProps {
  /** Current filter state */
  filters: BoardFilters;
  /** Callback when filters change */
  onFiltersChange: (filters: BoardFilters) => void;
}

/**
 * Filter controls for the Kanban board.
 *
 * Displays a status dropdown that allows filtering tasks by:
 * - All (shows all tasks)
 * - Backlog
 * - In Progress
 * - Done
 *
 * @example
 * ```tsx
 * const [filters, setFilters] = useState<BoardFilters>({});
 * <BoardFilterControls filters={filters} onFiltersChange={setFilters} />
 * ```
 */
export function BoardFilterControls({
  filters,
  onFiltersChange,
}: BoardFilterControlsProps) {
  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === FILTER_ALL ? null : value,
    });
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <Select
          value={filters.status ?? FILTER_ALL}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[140px] h-8" aria-label="Filter tasks by status">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>All</SelectItem>
            {ALL_ISSUE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
