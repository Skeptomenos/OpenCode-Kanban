'use client';

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
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTaskStore, type Task } from '../utils/store';
import { createIssue, type CreateIssueInput } from '../api';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/lib/logger';
import { useProjects } from '@/features/projects/hooks/use-projects';

export function NewTaskDialog() {
  const queryClient = useQueryClient();
  const columns = useTaskStore((state) => state.columns);
  const currentProjectId = useTaskStore((state) => state.currentProjectId);
  const currentBoardId = useTaskStore((state) => state.currentBoardId);
  const setTasks = useTaskStore((state) => state.setTasks);
  const tasks = useTaskStore((state) => state.tasks);
  const { projects } = useProjects();

  // Find current project for parent info injection
  // WHY: New tasks should show their parent project immediately in the footer
  // without waiting for a refetch. See specs/5.2-task-card-editor.md:L32-37
  const currentProject = projects.find((p) => p.id === currentProjectId);

  const createIssueMutation = useMutation({
    mutationFn: (input: CreateIssueInput) => createIssue(input),
    onSuccess: (issue) => {
      const newTask: Task = {
        id: issue.id,
        title: issue.title,
        description: issue.description ?? undefined,
        columnId: issue.status,
        // Inject parent info for immediate display in task card footer
        parent: currentProject
          ? { id: currentProject.id, title: currentProject.title, type: 'project' }
          : undefined,
      };
      setTasks([...tasks, newTask]);
    },
    onError: (err) => {
      logger.error('Failed to create task', { error: String(err) });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.kanban(currentProjectId ?? undefined, currentBoardId ?? undefined) });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const { title, description } = Object.fromEntries(formData);

    if (typeof title !== 'string' || typeof description !== 'string') return;

    const defaultColumnId = columns.length > 0 ? columns[0].id.toString() : 'backlog';

    createIssueMutation.mutate({
      type: 'task',
      title,
      description: description || null,
      status: defaultColumnId,
      parentId: currentProjectId ?? undefined,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='secondary' size='sm'>
          ＋ Add New Todo
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Add New Todo</DialogTitle>
          <DialogDescription>
            What do you want to get done today?
          </DialogDescription>
        </DialogHeader>
        <form
          id='new-task-form'
          className='grid gap-4 py-4'
          onSubmit={handleSubmit}
        >
          <div className='grid grid-cols-4 items-center gap-4'>
            <Input
              id='title'
              name='title'
              placeholder='Todo title...'
              className='col-span-4'
              aria-label='Task title'
              required
              maxLength={500}
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Textarea
              id='description'
              name='description'
              placeholder='Description...'
              className='col-span-4'
              aria-label='Task description'
              maxLength={10000}
            />
          </div>
        </form>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button type='submit' size='sm' form='new-task-form'>
              Add Todo
            </Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
