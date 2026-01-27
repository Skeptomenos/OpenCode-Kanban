'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { updateIssue } from '../api';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { IconCheck } from '@tabler/icons-react';

/**
 * TaskDescriptionEditor - Auto-saving textarea for task descriptions.
 *
 * WHY: Users need inline editing without explicit save buttons.
 * Saves on blur or Cmd+Enter for efficient workflow.
 *
 * @see ralph-wiggum/specs/5.2-task-card-editor.md:L15-25
 */
interface TaskDescriptionEditorProps {
  taskId: string;
  initialDescription: string;
  className?: string;
}

export function TaskDescriptionEditor({
  taskId,
  initialDescription,
  className
}: TaskDescriptionEditorProps) {
  const [value, setValue] = React.useState(initialDescription);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showSaved, setShowSaved] = React.useState(false);
  const lastSavedValueRef = React.useRef(initialDescription);

  const hasChanges = value !== lastSavedValueRef.current;

  const saveDescription = React.useCallback(async () => {
    if (!hasChanges || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await updateIssue(taskId, { description: value });
      lastSavedValueRef.current = value;

      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);

      logger.debug('TaskDescriptionEditor: saved', { taskId });
    } catch (error) {
      logger.error('TaskDescriptionEditor: save failed', {
        taskId,
        error: String(error)
      });
    } finally {
      setIsSaving(false);
    }
  }, [taskId, value, hasChanges, isSaving]);

  const handleBlur = React.useCallback(() => {
    void saveDescription();
  }, [saveDescription]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        void saveDescription();
      }
    },
    [saveDescription]
  );

  return (
    <div className={cn('relative', className)}>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Add a description..."
        className={cn(
          'min-h-24 resize-none text-sm',
          isSaving && 'opacity-70'
        )}
        disabled={isSaving}
      />
      <div
        className={cn(
          'absolute bottom-2 right-2 flex items-center gap-1 text-xs text-muted-foreground transition-opacity duration-200',
          showSaved ? 'opacity-100' : 'opacity-0'
        )}
        aria-live="polite"
      >
        <IconCheck className="size-3 text-green-500" />
        <span>Saved</span>
      </div>
    </div>
  );
}
