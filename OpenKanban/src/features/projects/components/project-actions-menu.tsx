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

import { RenameProjectDialog } from './rename-project-dialog';
import { DeleteProjectDialog } from './delete-project-dialog';

/**
 * Props for ProjectActionsMenu component.
 * @see specs/5.1-sidebar-overhaul.md:L25-31
 */
interface ProjectActionsMenuProps {
  /** The ID of the project for CRUD operations */
  projectId: string;
  /** The current name/title of the project (used for rename dialog pre-fill) */
  projectTitle: string;
}

/**
 * Dropdown menu for project actions (Rename, Delete).
 *
 * Orchestrates the RenameProjectDialog and DeleteProjectDialog components.
 * Uses a 3-dots icon button as the trigger, visible on hover.
 *
 * @see specs/5.1-sidebar-overhaul.md:L25-31
 * @example
 * ```tsx
 * <ProjectActionsMenu
 *   projectId={project.id}
 *   projectTitle={project.title}
 * />
 * ```
 */
export function ProjectActionsMenu({
  projectId,
  projectTitle,
}: ProjectActionsMenuProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 opacity-0 group-hover/project:opacity-100 data-[state=open]:opacity-100"
            aria-label={`Actions for ${projectTitle}`}
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

      <RenameProjectDialog
        projectId={projectId}
        currentTitle={projectTitle}
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
      />

      <DeleteProjectDialog
        projectId={projectId}
        projectTitle={projectTitle}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </>
  );
}
