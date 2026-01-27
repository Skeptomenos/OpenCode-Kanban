'use client';

import { useState, useMemo } from 'react';
import { IconLink, IconSearch } from '@tabler/icons-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';
import { formatTimestamp } from '@/lib/date-utils';
import { DIALOG_DIMENSIONS } from '@/lib/constants/ui-dimensions';
import { useDebounce } from '@/hooks/use-debounce';

import { useSessions } from '../hooks/use-sessions';
import { useLinkSession, useSessionLinks } from '../hooks/use-session-mutations';
import type { SessionLink } from '../types';

interface LinkSessionDialogProps {
  issueId: string;
  issueTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * @see ralph-wiggum/specs/4.10-link-session-ui.md:L372-537
 */
export function LinkSessionDialog({
  issueId,
  issueTitle,
  isOpen,
  onClose,
}: LinkSessionDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery.trim() || undefined, 300);
  const { sessions, isLoading: sessionsLoading } = useSessions(debouncedQuery);
  const { sessionLinks } = useSessionLinks(issueId);
  const linkSession = useLinkSession();

  const availableSessions = useMemo(() => {
    const linkedIds = new Set(
      sessionLinks.map((link: SessionLink) => link.sessionId)
    );
    return sessions.filter((session) => !linkedIds.has(session.id));
  }, [sessions, sessionLinks]);

  const handleLink = async (sessionId: string) => {
    try {
      await linkSession.mutateAsync({ issueId, sessionId });
      toast.success('Session linked successfully');
    } catch (error) {
      logger.error('Failed to link session in dialog', { error: String(error) });
      toast.error('Failed to link session');
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Link Session</DialogTitle>
          <DialogDescription>
            Link an OpenCode session to &quot;{issueTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search sessions"
            />
          </div>

          <div className={`${DIALOG_DIMENSIONS.SESSION_LIST_MAX_HEIGHT} overflow-y-auto space-y-2`}>
            {sessionsLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : availableSessions.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {searchQuery
                  ? 'No sessions match your search'
                  : sessions.length === 0
                    ? 'No sessions available'
                    : 'All sessions are already linked'}
              </div>
            ) : (
              availableSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium truncate">
                      {session.title || session.slug || session.id}
                    </p>
                    {session.summary && (
                      <p className="text-xs text-muted-foreground truncate">
                        +{session.summary.additions ?? 0} / -{session.summary.deletions ?? 0} ({session.summary.files ?? 0} files)
                      </p>
                    )}
                    {session.time?.created && (
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(session.time.created)}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLink(session.id)}
                    disabled={linkSession.isPending}
                    aria-label={`Link session ${session.title || session.slug || session.id}`}
                  >
                    <IconLink className="h-4 w-4 mr-1" />
                    Link
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
