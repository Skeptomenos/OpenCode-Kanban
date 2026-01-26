'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useInfobar, type InfobarContent } from '@/components/ui/infobar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Task, TaskDragData } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cva } from 'class-variance-authority';
import {
  IconGripVertical,
  IconFolder,
  IconFlag,
  IconTarget,
  IconBook,
  IconSquareCheck
} from '@tabler/icons-react';

/**
 * Icon mapping for parent type display in hierarchy badge.
 * Each issue type maps to a distinctive Tabler icon.
 *
 * WHY: Users need visual cues to quickly identify parent type
 * without reading text. Consistent iconography across the app.
 *
 * @see ralph-wiggum/specs/4.9-hierarchical-display.md:L328-343
 */
const PARENT_TYPE_ICONS: Record<string, typeof IconFolder> = {
  project: IconFolder,
  milestone: IconFlag,
  epic: IconTarget,
  story: IconBook,
  task: IconSquareCheck
};

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
      {task.parent && (
        <div className="flex items-center gap-1 px-3 pt-2 text-xs text-muted-foreground">
          {(() => {
            const Icon = PARENT_TYPE_ICONS[task.parent.type] ?? IconFolder;
            return <Icon className="h-3 w-3 flex-shrink-0" />;
          })()}
          <span className="truncate max-w-[200px]" title={task.parent.title}>
            {task.parent.title}
          </span>
        </div>
      )}
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
