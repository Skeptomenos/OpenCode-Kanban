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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { useUpdateBoard } from '../hooks/use-board-mutations';
import { logger } from '@/lib/logger';

/**
 * Props for RenameBoardDialog component.
 * @see specs/4.3-ui-components.md:L40-44
 */
interface RenameBoardDialogProps {
  /** The ID of the board to rename */
  boardId: string;
  /** The current name of the board (pre-fills the input) */
  currentName: string;
  /** Controls dialog visibility */
  open: boolean;
  /** Callback when dialog visibility changes */
  onOpenChange: (open: boolean) => void;
}

interface RenameBoardFormProps {
  boardId: string;
  currentName: string;
  onOpenChange: (open: boolean) => void;
}

function RenameBoardForm({
  boardId,
  currentName,
  onOpenChange,
}: RenameBoardFormProps) {
  const [name, setName] = useState(currentName);
  const updateBoardMutation = useUpdateBoard();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Board name is required');
      return;
    }

    if (trimmedName === currentName) {
      onOpenChange(false);
      return;
    }

    updateBoardMutation.mutate(
      {
        id: boardId,
        input: { name: trimmedName },
      },
      {
        onSuccess: (result) => {
          onOpenChange(false);
          toast.success(`Board renamed to "${result.name}"`);
        },
        onError: (error) => {
          const message = error.message || 'Failed to rename board';
          logger.error('Failed to rename board', {
            boardId,
            error: String(error),
          });
          toast.error(message);
        },
      }
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Rename Board</DialogTitle>
        <DialogDescription>Enter a new name for this board.</DialogDescription>
      </DialogHeader>
      <form
        id="rename-board-form"
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
            placeholder="Board name"
            required
            autoFocus
            aria-label="Board name"
            disabled={updateBoardMutation.isPending}
            maxLength={500}
          />
        </div>
      </form>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={updateBoardMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="rename-board-form"
          disabled={updateBoardMutation.isPending}
        >
          {updateBoardMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Dialog component for renaming an existing board.
 *
 * Uses a wrapper pattern: the form is only rendered when the dialog is open,
 * which ensures the form state is reset with currentName on each open.
 *
 * @see specs/4.3-ui-components.md:L40-44
 */
export function RenameBoardDialog({
  boardId,
  currentName,
  open,
  onOpenChange,
}: RenameBoardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {open && (
          <RenameBoardForm
            boardId={boardId}
            currentName={currentName}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
