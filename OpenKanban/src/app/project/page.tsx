import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db/connection';
import { SqlitePMRepository } from '@/lib/db/repository';
import { WelcomeScreen } from '@/features/projects/components/welcome-screen';

/**
 * @see docs/phase3-issues-report.md Issue #26
 */
export default async function ProjectListPage() {
  const db = getDb();
  const repo = new SqlitePMRepository(db);

  const projects = repo.listIssues({ types: ['project'], parentId: null });

  if (projects.length > 0) {
    const mostRecentProject = projects.sort((a, b) => b.createdAt - a.createdAt)[0];
    redirect(`/project/${mostRecentProject.id}`);
  }

  return <WelcomeScreen />;
}
