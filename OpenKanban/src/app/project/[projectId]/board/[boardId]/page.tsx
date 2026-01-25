import { KanbanViewPage } from '@/features/kanban/components/kanban-view-page';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db/connection';
import { SqlitePMRepository } from '@/lib/db/repository';

export const metadata = {
  title: 'OpenKanban: Board'
};

/**
 * Board page - renders the Kanban board for a specific project/board.
 *
 * Validates that both projectId and boardId exist in the database,
 * then passes them as props to KanbanViewPage for context-aware rendering.
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
  if (!projectId || !boardId) {
    notFound();
  }

  // DB validation: check if project and board exist
  const db = getDb();
  const repo = new SqlitePMRepository(db);

  const project = repo.getIssue(projectId);
  if (!project || project.type !== 'project') {
    notFound();
  }

  const board = repo.getBoard(boardId);
  if (!board) {
    notFound();
  }

  // Optional: Verify board belongs to this project
  // Board filters contain parentId which should match projectId
  if (board.filters?.parentId && board.filters.parentId !== projectId) {
    notFound();
  }

  return <KanbanViewPage projectId={projectId} boardId={boardId} />;
}
