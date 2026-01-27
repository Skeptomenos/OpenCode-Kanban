'use client';

import { IconUser, IconRobot, IconArrowLeft } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatTimestamp } from '@/lib/date-utils';

import { useSession } from '../hooks/use-session';
import type { Message, MessagePart } from '../types';

interface SessionViewerProps {
  sessionId: string;
  taskTitle: string;
  onBack: () => void;
}

function MessagePartContent({ part }: { part: MessagePart }) {
  if (part.type !== 'text' || !part.text) {
    return null;
  }
  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed">
      {part.text}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const Icon = isUser ? IconUser : IconRobot;
  
  const textParts = message.parts.filter(p => p.type === 'text' && p.text);
  if (textParts.length === 0) return null;
  
  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className={cn(
        'flex-1 max-w-[80%] rounded-lg px-4 py-3',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      )}>
        {textParts.map(part => (
          <MessagePartContent key={part.id} part={part} />
        ))}
        <div className={cn(
          'mt-2 text-xs',
          isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {formatTimestamp(message.time.created)}
        </div>
      </div>
    </div>
  );
}

function TranscriptSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className={cn('flex gap-3', i % 2 === 0 ? 'flex-row-reverse' : 'flex-row')}>
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <Skeleton className="h-24 flex-1 max-w-[80%] rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function SessionViewer({ sessionId, taskTitle, onBack }: SessionViewerProps) {
  const { session, messages, isLoading, error } = useSession(sessionId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 pb-3 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 px-2"
        >
          <IconArrowLeft className="w-4 h-4" />
        </Button>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="truncate max-w-[100px]" title={taskTitle}>{taskTitle}</span>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[150px]" title={session?.title}>
            {session?.title ?? 'Session'}
          </span>
        </nav>
      </div>

      <ScrollArea className="flex-1 mt-4">
        {isLoading ? (
          <TranscriptSkeleton />
        ) : error ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Failed to load session transcript
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No messages in this session
          </div>
        ) : (
          <div className="space-y-4 pr-4">
            {messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
