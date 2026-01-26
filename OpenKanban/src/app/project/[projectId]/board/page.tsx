import { redirect, notFound } from 'next/navigation';
import { getDb } from '@/lib/db/connection';
import { SqlitePMRepository } from '@/lib/db/repository';
import type { BoardFilters } from '@/lib/db/repository';
import { ISSUE_STATUSES } from '@/lib/constants/statuses';

/**
 * @see docs/phase3-issues-report.md Issue #27
 */
export default async function BoardListPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const db = getDb();
  const repo = new SqlitePMRepository(db);

  const project = repo.getIssue(projectId);
  if (!project || project.type !== 'project') {
    notFound();
  }

  const allBoards = repo.listBoards();
  const projectBoards = allBoards.filter(
    (board) => board.filters?.parentId === projectId
  );

  if (projectBoards.length > 0) {
    redirect(`/project/${projectId}/board/${projectBoards[0].id}`);
  }

  const defaultFilters: BoardFilters = {
    parentId: projectId,
    types: ['task']
  };

  const newBoard = repo.createBoard({
    name: 'Main Board',
    filters: defaultFilters,
    columnConfig: [
      { id: ISSUE_STATUSES.BACKLOG, title: 'Backlog', statusMappings: [ISSUE_STATUSES.BACKLOG] },
      { id: ISSUE_STATUSES.IN_PROGRESS, title: 'In Progress', statusMappings: [ISSUE_STATUSES.IN_PROGRESS] },
      { id: ISSUE_STATUSES.DONE, title: 'Done', statusMappings: [ISSUE_STATUSES.DONE] }
    ]
  });

  redirect(`/project/${projectId}/board/${newBoard.id}`);
}
