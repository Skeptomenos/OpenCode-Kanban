'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { useCreateBoard } from '../hooks/use-board-mutations';
import { logger } from '@/lib/logger';

/**
 * Props for CreateBoardDialog component.
 * @see specs/4.3-ui-components.md:L9-16
 */
interface CreateBoardDialogProps {
  /** The project ID to associate the board with via filters.parentId */
  parentId: string;
  /** Trigger element (e.g., button) that opens the dialog */
  children: React.ReactNode;
  /** Optional callback called on successful board creation */
  onSuccess?: () => void;
}

/**
 * Default column configuration for new boards.
 * Creates a standard Kanban workflow: Backlog → In Progress → Done
 * @see specs/4.3-ui-components.md:L16
 */
const DEFAULT_COLUMN_CONFIG = [
  { id: 'backlog', title: 'Backlog', statusMappings: ['backlog'] },
  { id: 'in-progress', title: 'In Progress', statusMappings: ['in-progress'] },
  { id: 'done', title: 'Done', statusMappings: ['done'] },
];

/**
 * Dialog component for creating a new board within a project.
 *
 * Creates a board with:
 * - User-provided name
 * - Default columns (Backlog, In Progress, Done)
 * - filters.parentId set to the current project
 *
 * @see specs/4.3-ui-components.md:L9-16
 * @example
 * ```tsx
 * <CreateBoardDialog parentId={projectId}>
 *   <Button>Create Board</Button>
 * </CreateBoardDialog>
 * ```
 */
export function CreateBoardDialog({
  parentId,
  children,
  onSuccess,
}: CreateBoardDialogProps) {
  const [open, setOpen] = useState(false);
  const createBoardMutation = useCreateBoard();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const nameVal = formData.get('name');
    if (typeof nameVal !== 'string' || !nameVal.trim()) {
      toast.error('Board name is required');
      return;
    }

    const boardName = nameVal.trim();

    createBoardMutation.mutate(
      {
        name: boardName,
        filters: { parentId },
        columnConfig: DEFAULT_COLUMN_CONFIG,
      },
      {
        onSuccess: (result) => {
          setOpen(false);
          toast.success(`Board "${result.name}" created`);
          onSuccess?.();
        },
        onError: (error) => {
          const message = error.message || 'Failed to create board';
          logger.error('Failed to create board', { error: String(error) });
          toast.error(message);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
          <DialogDescription>
            Enter a name for your new board. It will be created with default
            columns (Backlog, In Progress, Done).
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-board-form"
          className="grid gap-4 py-4"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-2">
            <label htmlFor="board-name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="board-name"
              name="name"
              placeholder="My Board"
              required
              autoFocus
              aria-label="Board name"
              disabled={createBoardMutation.isPending}
              maxLength={500}
            />
          </div>
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="create-board-form"
            disabled={createBoardMutation.isPending}
          >
            {createBoardMutation.isPending ? 'Creating...' : 'Create Board'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
