'use client';

import { useState } from 'react';
import { IconLink, IconUnlink, IconExternalLink } from '@tabler/icons-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';
import {
  LinkSessionDialog,
  useSessionLinks,
  useUnlinkSession,
  type SessionLink,
} from '@/features/sessions';

interface TaskInfobarActionsProps {
  taskId: string;
  taskTitle: string;
}

export function TaskInfobarActions({ taskId, taskTitle }: TaskInfobarActionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { sessionLinks, isLoading, error } = useSessionLinks(taskId);
  const unlinkSession = useUnlinkSession();

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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 flex-shrink-0"
                  onClick={() => handleUnlink(link.sessionId)}
                  disabled={unlinkSession.isPending}
                  aria-label={`Unlink session ${link.sessionId}`}
                >
                  <IconUnlink className="h-4 w-4" />
                </Button>
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

      <LinkSessionDialog
        issueId={taskId}
        issueTitle={taskTitle}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
}
