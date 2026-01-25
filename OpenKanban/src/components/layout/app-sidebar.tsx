'use client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateProjectDialog } from '@/features/projects/components/create-project-dialog';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { IconFolder, IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppSidebar() {
  const pathname = usePathname();
  const { projects, isLoading, error, refresh } = useProjects();

  return (
    <Sidebar collapsible='icon'>
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <CreateProjectDialog onSuccess={refresh}>
            <SidebarGroupAction title='Create Project' aria-label='Create Project'>
              <IconPlus className='h-4 w-4' />
              <span className='sr-only'>Create Project</span>
            </SidebarGroupAction>
          </CreateProjectDialog>
          <SidebarMenu>
            {isLoading ? (
              <>
                <SidebarMenuItem>
                  <div className='flex items-center gap-2 px-2 py-1.5'>
                    <Skeleton className='h-4 w-4' />
                    <Skeleton className='h-4 w-24' />
                  </div>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <div className='flex items-center gap-2 px-2 py-1.5'>
                    <Skeleton className='h-4 w-4' />
                    <Skeleton className='h-4 w-20' />
                  </div>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <div className='flex items-center gap-2 px-2 py-1.5'>
                    <Skeleton className='h-4 w-4' />
                    <Skeleton className='h-4 w-28' />
                  </div>
                </SidebarMenuItem>
              </>
            ) : error ? (
              <SidebarMenuItem>
                <div className='px-2 py-1.5 text-sm text-muted-foreground'>
                  Failed to load projects
                </div>
              </SidebarMenuItem>
            ) : projects.length === 0 ? (
              <SidebarMenuItem>
                <div className='px-2 py-1.5 text-sm text-muted-foreground'>
                  No projects yet
                </div>
              </SidebarMenuItem>
            ) : (
              projects.map((project) => {
                const isActive = pathname.includes(`/project/${project.id}`);
                
                return (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton
                      asChild
                      tooltip={project.title}
                      isActive={isActive}
                    >
                      <Link href={`/project/${project.id}`}>
                        <IconFolder className='h-4 w-4' />
                        <span>{project.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
