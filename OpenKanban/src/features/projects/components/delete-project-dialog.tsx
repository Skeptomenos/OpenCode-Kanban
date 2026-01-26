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

import { useDeleteProject } from '../hooks/use-project-mutations';
import { logger } from '@/lib/logger';

interface DeleteProjectDialogProps {
  projectId: string;
  projectTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProjectDialog({
  projectId,
  projectTitle,
  open,
  onOpenChange,
}: DeleteProjectDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const deleteProjectMutation = useDeleteProject();

  const handleDelete = () => {
    deleteProjectMutation.mutate({ projectId }, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(`Project "${projectTitle}" deleted`);

        // Redirect to home if we're currently viewing the deleted project
        if (pathname.includes(`/project/${projectId}`)) {
          router.push('/');
        }
      },
      onError: (error) => {
        const message = error.message || 'Failed to delete project';
        logger.error('Failed to delete project', {
          projectId,
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
          <AlertDialogTitle>Delete Project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{projectTitle}&quot;? This will
            also delete all boards and tasks within this project. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteProjectMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteProjectMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
