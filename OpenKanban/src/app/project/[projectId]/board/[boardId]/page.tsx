import KanbanViewPage from '@/features/kanban/components/kanban-view-page';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'OpenKanban: Board'
};

/**
 * Board page - renders the Kanban board for a specific project/board.
 *
 * Current implementation: Placeholder that renders KanbanViewPage.
 * Full implementation (Task 1.4) will:
 * - Validate projectId and boardId exist
 * - Pass projectId/boardId props to KanbanViewPage
 *
 * @see specs/31-route-structure.md:L48-55
 */
export default async function BoardPage({
  params
}: {
  params: Promise<{ projectId: string; boardId: string }>;
}) {
  const { projectId, boardId } = await params;

  // Basic validation - ensure IDs are present
  // TODO (Task 1.4): Add DB validation to check if project/board exist
  if (!projectId || !boardId) {
    notFound();
  }

  // TODO (Task 3.4): Pass projectId and boardId as props to KanbanViewPage
  // <KanbanViewPage projectId={projectId} boardId={boardId} />
  return <KanbanViewPage />;
}
