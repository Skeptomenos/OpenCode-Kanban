import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db/connection';
import { SqlitePMRepository } from '@/lib/db/repository';

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

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">Welcome to OpenKanban</h1>
        <p className="text-muted-foreground">
          No projects found. Create your first project to get started.
        </p>
      </div>
    </div>
  );
}
