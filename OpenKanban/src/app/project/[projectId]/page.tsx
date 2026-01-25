import { redirect } from 'next/navigation';

/**
 * Project root page - redirects to the first available board.
 *
 * Current implementation: Simple placeholder that redirects to a default board.
 * Full implementation (Task 1.3) will:
 * - Query boards filtered by parentId
 * - Auto-create a board if none exist
 *
 * @see specs/31-route-structure.md:L37-46
 */
export default async function ProjectPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  // TODO (Task 1.3): Fetch boards for this project and redirect to first one
  // For now, redirect to a placeholder board ID
  // This will be replaced with actual board fetching logic
  redirect(`/project/${projectId}/board/default`);
}
