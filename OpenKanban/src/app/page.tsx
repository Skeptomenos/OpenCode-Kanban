import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db/connection';
import { SqlitePMRepository } from '@/lib/db/repository';
import { WelcomeScreen } from '@/features/projects/components/welcome-screen';

/**
 * Root page: Smart redirect to first project or show empty state.
 * @see specs/31-route-structure.md:L57-62
 */
export default function Home() {
  const db = getDb();
  const repo = new SqlitePMRepository(db);

  const projects = repo.listIssues({ types: ['project'] });

  if (projects.length > 0) {
    redirect(`/project/${projects[0].id}`);
  }

  return <WelcomeScreen />;
}
