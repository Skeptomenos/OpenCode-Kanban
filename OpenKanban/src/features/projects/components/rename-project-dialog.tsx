'use client';

import { useState, useMemo } from 'react';
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

import { useProjects } from '../hooks/use-projects';
import { useUpdateProject } from '../hooks/use-project-mutations';
import { logger } from '@/lib/logger';

interface RenameProjectDialogProps {
  projectId: string;
  currentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RenameProjectFormProps {
  projectId: string;
  currentTitle: string;
  onOpenChange: (open: boolean) => void;
}

function RenameProjectForm({
  projectId,
  currentTitle,
  onOpenChange,
}: RenameProjectFormProps) {
  const [title, setTitle] = useState(currentTitle);
  const updateProjectMutation = useUpdateProject();
  const { projects } = useProjects();

  const isDuplicateTitle = useMemo(() => {
    const trimmedTitle = title.trim().toLowerCase();
    if (!trimmedTitle) return false;
    if (trimmedTitle === currentTitle.toLowerCase()) return false;
    return projects.some(
      (project) => project.id !== projectId && project.title.toLowerCase() === trimmedTitle
    );
  }, [title, projects, projectId, currentTitle]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error('Project name is required');
      return;
    }

    if (trimmedTitle === currentTitle) {
      onOpenChange(false);
      return;
    }

    if (isDuplicateTitle) {
      toast.error('A project with this name already exists');
      return;
    }

    updateProjectMutation.mutate(
      {
        id: projectId,
        input: { title: trimmedTitle },
      },
      {
        onSuccess: (result) => {
          onOpenChange(false);
          toast.success(`Project renamed to "${result.title}"`);
        },
        onError: (error) => {
          const message = error.message || 'Failed to rename project';
          logger.error('Failed to rename project', {
            projectId,
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
        <DialogTitle>Rename Project</DialogTitle>
        <DialogDescription>Enter a new name for this project.</DialogDescription>
      </DialogHeader>
      <form
        id="rename-project-form"
        className="grid gap-4 py-4"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-2">
          <label htmlFor="project-title" className="text-sm font-medium">
            Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="project-title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project name"
            required
            autoFocus
            aria-label="Project name"
            aria-invalid={isDuplicateTitle}
            aria-describedby={isDuplicateTitle ? 'duplicate-title-warning' : undefined}
            disabled={updateProjectMutation.isPending}
            maxLength={500}
          />
          {isDuplicateTitle && (
            <p id="duplicate-title-warning" className="text-sm text-destructive">
              A project with this name already exists.
            </p>
          )}
        </div>
      </form>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={updateProjectMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="rename-project-form"
          disabled={updateProjectMutation.isPending || isDuplicateTitle}
        >
          {updateProjectMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </>
  );
}

export function RenameProjectDialog({
  projectId,
  currentTitle,
  open,
  onOpenChange,
}: RenameProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {open && (
          <RenameProjectForm
            projectId={projectId}
            currentTitle={currentTitle}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
