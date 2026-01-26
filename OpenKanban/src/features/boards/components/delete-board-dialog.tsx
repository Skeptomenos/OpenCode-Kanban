'use client';

import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useDeleteBoard } from '../hooks/use-board-mutations';
import { logger } from '@/lib/logger';

/**
 * Props for DeleteBoardDialog component.
 * @see specs/4.3-ui-components.md:L28-37
 */
interface DeleteBoardDialogProps {
  /** The ID of the board to delete */
  boardId: string;
  /** The parent project ID for redirect logic */
  projectId: string;
  /** Controls dialog visibility */
  open: boolean;
  /** Callback when dialog visibility changes */
  onOpenChange: (open: boolean) => void;
  /** Optional board name to display in the confirmation message */
  boardName?: string;
}

/**
 * Alert dialog for confirming board deletion.
 *
 * Features:
 * - Warning message about irreversible action
 * - Redirects to project page if deleting the currently active board
 * - Uses AlertDialog for proper accessibility
 *
 * @see specs/4.3-ui-components.md:L28-37
 * @example
 * ```tsx
 * <DeleteBoardDialog
 *   boardId={board.id}
 *   projectId={projectId}
 *   open={deleteDialogOpen}
 *   onOpenChange={setDeleteDialogOpen}
 *   boardName={board.name}
 * />
 * ```
 */
export function DeleteBoardDialog({
  boardId,
  projectId,
  open,
  onOpenChange,
  boardName,
}: DeleteBoardDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const deleteBoardMutation = useDeleteBoard();

  const handleDelete = () => {
    deleteBoardMutation.mutate({ boardId, parentId: projectId }, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(
          boardName ? `Board "${boardName}" deleted` : 'Board deleted'
        );

        // Redirect to project page if we're currently viewing the deleted board
        // Use exact path segment match to avoid false positives with substring IDs
        // @see docs/PHASE-4-ISSUES.md:H-03
        if (pathname.includes(`/board/${boardId}`)) {
          router.push(`/project/${projectId}`);
        }
      },
      onError: (error) => {
        const message = error.message || 'Failed to delete board';
        logger.error('Failed to delete board', {
          boardId,
          error: String(error),
        });
        toast.error(message);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Board</AlertDialogTitle>
          <AlertDialogDescription>
            {boardName ? (
              <>
                Are you sure you want to delete &quot;{boardName}&quot;? This
                action cannot be undone.
              </>
            ) : (
              'Are you sure you want to delete this board? This action cannot be undone.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteBoardMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteBoardMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteBoardMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
