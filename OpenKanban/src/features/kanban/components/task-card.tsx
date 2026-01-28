'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useInfobar, type InfobarContent } from '@/components/ui/infobar';

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
import { TaskInfobarActions } from './task-infobar-actions';
import { TaskDescriptionEditor } from './task-description-editor';

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
          description: (
            <TaskDescriptionEditor
              taskId={task.id}
              initialDescription={task.description || ''}
            />
          ),
          links: []
        }
      ],
      actions: <TaskInfobarActions taskId={task.id} taskTitle={task.title} />
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
        'cursor-pointer p-3 w-full max-w-full',
        'transition-all duration-150',
        'hover:border-primary/50 hover:shadow-md'
      )}
      onClick={handleCardClick}
    >
      <div className="flex flex-row items-start justify-between gap-2">
        <h3 className="font-medium text-sm leading-tight flex-1 min-w-0 break-words">
          {task.title}
        </h3>
        <Button
          variant="ghost"
          {...attributes}
          {...listeners}
          className="text-muted-foreground/50 hover:text-foreground h-auto cursor-grab p-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="sr-only">Move task</span>
          <IconGripVertical className="h-4 w-4" />
        </Button>
      </div>

      {task.description && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-3 break-words">
          {task.description}
        </p>
      )}

      {task.parent && (
        <div className="mt-3 pt-2 border-t flex items-center gap-1">
          {(() => {
            const Icon = PARENT_TYPE_ICONS[task.parent.type] ?? IconFolder;
            return <Icon className="size-3 shrink-0 text-muted-foreground" />;
          })()}
          <span
            className="text-[10px] text-muted-foreground font-medium truncate"
            title={task.parent.title}
          >
            {task.parent.title}
          </span>
        </div>
      )}
    </Card>
  );
}
