'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { RenameBoardDialog } from './rename-board-dialog';
import { DeleteBoardDialog } from './delete-board-dialog';

/**
 * Props for BoardActionsMenu component.
 * @see specs/4.3-ui-components.md:L19-25
 */
interface BoardActionsMenuProps {
  /** The ID of the board for CRUD operations */
  boardId: string;
  /** The current name of the board (used for rename dialog pre-fill) */
  boardName: string;
  /** The parent project ID (required for delete redirect logic) */
  projectId: string;
}

/**
 * Dropdown menu for board actions (Rename, Delete).
 *
 * Orchestrates the RenameBoardDialog and DeleteBoardDialog components.
 * Uses a 3-dots icon button as the trigger.
 *
 * @see specs/4.3-ui-components.md:L19-25
 * @example
 * ```tsx
 * <BoardActionsMenu
 *   boardId={board.id}
 *   boardName={board.name}
 *   projectId={projectId}
 * />
 * ```
 */
export function BoardActionsMenu({
  boardId,
  boardName,
  projectId,
}: BoardActionsMenuProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 opacity-0 group-hover/board:opacity-100 data-[state=open]:opacity-100"
            aria-label={`Actions for ${boardName}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onSelect={() => setRenameDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameBoardDialog
        boardId={boardId}
        projectId={projectId}
        currentName={boardName}
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
      />

      <DeleteBoardDialog
        boardId={boardId}
        projectId={projectId}
        boardName={boardName}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </>
  );
}
