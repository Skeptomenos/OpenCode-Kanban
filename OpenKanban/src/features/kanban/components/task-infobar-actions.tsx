'use client';

import { useState } from 'react';
import { IconLink, IconUnlink, IconExternalLink, IconEye, IconGitBranch } from '@tabler/icons-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';
import { useInfobar, type InfobarContent } from '@/components/ui/infobar';
import {
  LinkSessionDialog,
  SessionViewer,
  useSessionLinks,
  useUnlinkSession,
  type SessionLink,
} from '@/features/sessions';
import { TaskDescriptionEditor } from './task-description-editor';
import { useTaskStore } from '../utils/store';

interface TaskInfobarActionsProps {
  taskId: string;
  taskTitle: string;
}

/**
 * Converts a task title to a git-branch-safe slug.
 * @example slugify("Fix login bug") => "fix-login-bug"
 * @see ralph-wiggum/specs/5.5-deferred-features.md:L16-26
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function TaskInfobarActions({ taskId, taskTitle }: TaskInfobarActionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { sessionLinks, isLoading, error } = useSessionLinks(taskId);
  const unlinkSession = useUnlinkSession();
  const { setContent } = useInfobar();
  const task = useTaskStore((state) => state.tasks.find((t) => t.id === taskId));

  /**
   * Restores the task details view in the InfoSidebar.
   * Called when user clicks "back" from SessionViewer.
   *
   * WHY: Users need to navigate back from session transcript to task details.
   * This rebuilds the original InfobarContent that was shown before viewing session.
   *
   * @see ralph-wiggum/specs/5.5-deferred-features.md:L7-13
   */
  const restoreTaskContent = () => {
    const content: InfobarContent = {
      title: task?.title ?? taskTitle,
      sections: [
        {
          title: 'Description',
          description: (
            <TaskDescriptionEditor
              taskId={taskId}
              initialDescription={task?.description || ''}
            />
          ),
          links: []
        }
      ],
      actions: <TaskInfobarActions taskId={taskId} taskTitle={task?.title ?? taskTitle} />
    };
    setContent(content);
  };

  /**
   * Opens the SessionViewer in the InfoSidebar, replacing task details.
   *
   * WHY: Provides master-detail navigation within the InfoSidebar.
   * Users can view session transcripts without leaving the board context.
   *
   * @see ralph-wiggum/specs/5.5-deferred-features.md:L8-13
   */
  const handleViewSession = (sessionId: string) => {
    const content: InfobarContent = {
      title: 'Session Transcript',
      sections: [],
      actions: (
        <SessionViewer
          sessionId={sessionId}
          taskTitle={task?.title ?? taskTitle}
          onBack={restoreTaskContent}
        />
      )
    };
    setContent(content);
  };

  const handleUnlink = async (sessionId: string) => {
    try {
      await unlinkSession.mutateAsync({ issueId: taskId, sessionId });
      toast.success('Session unlinked');
    } catch (err) {
      logger.error('Failed to unlink session', { error: String(err) });
      toast.error('Failed to unlink session');
    }
  };

  const formatSessionId = (sessionId: string): string => {
    if (sessionId.length <= 12) return sessionId;
    return `${sessionId.slice(0, 8)}...${sessionId.slice(-4)}`;
  };

  const handleCreateBranch = async () => {
    const slug = slugify(taskTitle);
    const branchName = `task/${taskId}-${slug}`;
    const command = `git checkout -b ${branchName}`;

    try {
      await navigator.clipboard.writeText(command);
      toast.success('Branch command copied to clipboard', {
        description: command,
      });
    } catch (err) {
      logger.error('Failed to copy to clipboard', { error: String(err) });
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Linked Sessions</h3>
        
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Failed to load sessions</p>
        ) : sessionLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions linked</p>
        ) : (
          <ul className="space-y-2">
            {sessionLinks.map((link: SessionLink) => (
              <li
                key={link.id}
                className="flex items-center justify-between gap-2 p-2 border rounded-md text-sm"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <IconExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate" title={link.sessionId}>
                    {formatSessionId(link.sessionId)}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleViewSession(link.sessionId)}
                    aria-label={`View session ${link.sessionId}`}
                  >
                    <IconEye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleUnlink(link.sessionId)}
                    disabled={unlinkSession.isPending}
                    aria-label={`Unlink session ${link.sessionId}`}
                  >
                    <IconUnlink className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setIsDialogOpen(true)}
      >
        <IconLink className="h-4 w-4 mr-2" />
        Link Session
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleCreateBranch}
      >
        <IconGitBranch className="h-4 w-4 mr-2" />
        Create Branch
      </Button>

      <LinkSessionDialog
        issueId={taskId}
        issueTitle={taskTitle}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
}
