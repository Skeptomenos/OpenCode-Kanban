'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { useBoards } from '../hooks/use-boards';
import { logger } from '@/lib/logger';
import { DEFAULT_COLUMN_CONFIG } from '@/lib/constants/board-defaults';

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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const createBoardMutation = useCreateBoard();
  const { boards } = useBoards(parentId);

  // Check for duplicate name (case-insensitive)
  const isDuplicateName = useMemo(() => {
    const trimmedName = name.trim().toLowerCase();
    if (!trimmedName) return false;
    return boards.some((board) => board.name.toLowerCase() === trimmedName);
  }, [name, boards]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const boardName = name.trim();
    if (!boardName) {
      toast.error('Board name is required');
      return;
    }

    if (isDuplicateName) {
      toast.error('A board with this name already exists');
      return;
    }

    createBoardMutation.mutate(
      {
        data: {
          name: boardName,
          filters: { parentId },
          columnConfig: DEFAULT_COLUMN_CONFIG,
        },
        parentId,
      },
      {
        onSuccess: (result) => {
          setOpen(false);
          toast.success(`Board "${result.name}" created`);
          onSuccess?.();
          router.push(`/project/${parentId}/board/${result.id}`);
        },
        onError: (error) => {
          const message = error.message || 'Failed to create board';
          logger.error('Failed to create board', { error: String(error) });
          toast.error(message);
        },
      }
    );
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Board"
              required
              autoFocus
              aria-label="Board name"
              aria-invalid={isDuplicateName}
              aria-describedby={isDuplicateName ? 'duplicate-name-warning' : undefined}
              disabled={createBoardMutation.isPending}
              maxLength={500}
            />
            {isDuplicateName && (
              <p id="duplicate-name-warning" className="text-sm text-destructive">
                A board with this name already exists in this project.
              </p>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="create-board-form"
            disabled={createBoardMutation.isPending || isDuplicateName}
          >
            {createBoardMutation.isPending ? 'Creating...' : 'Create Board'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
