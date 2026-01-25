import { KBar } from '@/components/kbar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { InfoSidebar } from '@/components/layout/info-sidebar';
import { InfobarProvider } from '@/components/ui/infobar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'OpenKanban',
  description: 'Project management with Kanban boards'
};

/**
 * Project layout - wraps all /project/[projectId]/* routes.
 * Reuses the dashboard layout pattern: Sidebar + Header + Content.
 *
 * @see specs/31-route-structure.md:L29-35
 */
export default async function ProjectLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <KBar>
      <SidebarProvider defaultOpen={defaultOpen}>
        <InfobarProvider defaultOpen={false}>
          <AppSidebar />
          <SidebarInset>
            <Header />
            {/* page main content */}
            {children}
            {/* page main content ends */}
          </SidebarInset>
          <InfoSidebar side='right' />
        </InfobarProvider>
      </SidebarProvider>
    </KBar>
  );
}
