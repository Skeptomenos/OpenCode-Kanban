import PageContainer from '@/components/layout/page-container';
import { KanbanBoard } from './kanban-board';
import NewTaskDialog from './new-task-dialog';

interface KanbanViewPageProps {
  projectId?: string;
  boardId?: string;
}

export default function KanbanViewPage({ projectId, boardId }: KanbanViewPageProps) {
  return (
    <PageContainer
      pageTitle='Kanban'
      pageDescription='Manage tasks by dnd'
      pageHeaderAction={<NewTaskDialog />}
    >
      <KanbanBoard projectId={projectId} boardId={boardId} />
    </PageContainer>
  );
}
