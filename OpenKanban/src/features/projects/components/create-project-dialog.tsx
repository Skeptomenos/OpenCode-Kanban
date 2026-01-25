'use client';

import { useState } from 'react';
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
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CreateProjectDialogProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateProjectDialog({
  children,
  onSuccess
}: CreateProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name?.trim()) {
      toast.error('Project name is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const projectResponse = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'project',
          title: name.trim(),
          description: description?.trim() || undefined
        })
      });

      const projectResult = await projectResponse.json();

      if (!projectResult.success) {
        throw new Error(projectResult.error?.message || 'Failed to create project');
      }

      const projectId = projectResult.data.id;

      const boardResponse = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Main Board',
          filters: { parentId: projectId, types: ['task'] }
        })
      });

      const boardResult = await boardResponse.json();

      if (!boardResult.success) {
        console.error('Failed to create board:', boardResult.error);
        toast.warning('Project created, but board initialization failed');
      }

      const boardId = boardResult.data?.id;

      setOpen(false);
      form.reset();
      toast.success(`Project "${name}" created`);

      router.refresh();
      onSuccess?.();

      if (boardId) {
        router.push(`/project/${projectId}/board/${boardId}`);
      } else {
        router.push(`/project/${projectId}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>
        </form>
        <DialogFooter>
          <Button
            type='submit'
            form='create-project-form'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
