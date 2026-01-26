'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useInfobar, type InfobarContent } from '@/components/ui/infobar';
import type { Task, TaskDragData } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cva } from 'class-variance-authority';
import { IconGripVertical } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
}

export function TaskCard({ task, isOverlay }: TaskCardProps) {
  const { setContent, setOpen } = useInfobar();
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task
    } satisfies TaskDragData,
    attributes: {
      roleDescription: 'Task'
    }
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform)
  };

  const variants = cva('mb-2', {
    variants: {
      dragging: {
        over: 'ring-2 opacity-30',
        overlay: 'ring-2 ring-primary'
      }
    }
  });

  const handleCardClick = () => {
    // Don't trigger during drag operations
    if (isOverlay || isDragging) return;

    const content: InfobarContent = {
      title: task.title,
      sections: [
        {
          title: 'Description',
          description: task.description || 'No description provided.',
          links: []
        }
      ]
    };

    setContent(content);
    setOpen(true);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        variants({
          dragging: isOverlay ? 'overlay' : isDragging ? 'over' : undefined
        }),
        'cursor-pointer'
      )}
      onClick={handleCardClick}
    >
      <CardHeader className='space-between border-secondary relative flex flex-row border-b-2 px-3 py-3'>
        <Button
          variant={'ghost'}
          {...attributes}
          {...listeners}
          className='text-secondary-foreground/50 -ml-2 h-auto cursor-grab p-1'
        >
          <span className='sr-only'>Move task</span>
          <IconGripVertical />
        </Button>
        <Badge variant={'outline'} className='ml-auto font-semibold'>
          Task
        </Badge>
      </CardHeader>
      <CardContent className='px-3 pt-3 pb-6 text-left whitespace-pre-wrap'>
        {task.title}
      </CardContent>
    </Card>
  );
}
