'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { createProjectWithBoard, type CreateProjectInput, ProjectApiError } from '../api';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/lib/logger';

interface CreateProjectDialogProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateProjectDialog({
  children,
  onSuccess
}: CreateProjectDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const createProjectMutation = useMutation({
    mutationFn: (input: CreateProjectInput) => createProjectWithBoard(input),
    onSuccess: (result) => {
      setOpen(false);
      toast.success(`Project "${result.project.title}" created`);
      onSuccess?.();
      router.push(`/project/${result.project.id}/board/${result.board.id}`);
    },
    onError: (error) => {
      const message = error instanceof ProjectApiError 
        ? error.message 
        : 'Failed to create project';
      logger.error('Failed to create project', { error: String(error) });
      toast.error(message);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Type guards for FormData values (spec 357:L33-44)
    const nameVal = formData.get('name');
    if (typeof nameVal !== 'string') {
      toast.error('Project name is required');
      return;
    }
    
    const descVal = formData.get('description');
    // Description is optional, but if present must be a string
    const description = typeof descVal === 'string' ? descVal : undefined;

    if (!nameVal.trim()) {
      toast.error('Project name is required');
      return;
    }

    createProjectMutation.mutate({
      title: nameVal.trim(),
      description: description?.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter a name and optional description for your new project.
          </DialogDescription>
        </DialogHeader>
        <form
          id='create-project-form'
          className='grid gap-4 py-4'
          onSubmit={handleSubmit}
        >
          <div className='grid gap-2'>
            <label htmlFor='name' className='text-sm font-medium'>
              Name <span className='text-destructive'>*</span>
            </label>
            <Input
              id='name'
              name='name'
              placeholder='My Awesome Project'
              required
              autoFocus
              aria-label='Project name'
              disabled={createProjectMutation.isPending}
              maxLength={500}
            />
          </div>
          <div className='grid gap-2'>
            <label htmlFor='description' className='text-sm font-medium'>
              Description
            </label>
            <Textarea
              id='description'
              name='description'
              placeholder='A brief description of your project...'
              aria-label='Project description'
              disabled={createProjectMutation.isPending}
              maxLength={10000}
            />
          </div>
        </form>
        <DialogFooter>
          <Button
            type='submit'
            form='create-project-form'
            disabled={createProjectMutation.isPending}
          >
            {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
