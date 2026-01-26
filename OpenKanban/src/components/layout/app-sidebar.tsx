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
import {
  CreateBoardDialog,
  BoardActionsMenu,
  useBoards,
} from '@/features/boards';
import { IconFolder, IconPlus, IconLayoutKanban } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams<{ projectId?: string }>();
  const projectId = params.projectId;

  const { projects, isLoading, error, refresh } = useProjects();
  
  // Fetch boards only when inside a project
  // Note: Hook is safe to call with empty string - `enabled` guard prevents fetch
  const {
    boards,
    isLoading: boardsLoading,
    error: boardsError,
  } = useBoards(projectId ?? '');

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

        {projectId && (
          <SidebarGroup>
            <SidebarGroupLabel>Project Boards</SidebarGroupLabel>
            <CreateBoardDialog parentId={projectId}>
              <SidebarGroupAction title='Create Board' aria-label='Create Board'>
                <IconPlus className='h-4 w-4' />
                <span className='sr-only'>Create Board</span>
              </SidebarGroupAction>
            </CreateBoardDialog>
            <SidebarMenu>
              {boardsLoading ? (
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
                </>
              ) : boardsError ? (
                <SidebarMenuItem>
                  <div className='px-2 py-1.5 text-sm text-muted-foreground'>
                    Failed to load boards
                  </div>
                </SidebarMenuItem>
              ) : boards.length === 0 ? (
                <SidebarMenuItem>
                  <div className='px-2 py-1.5 text-sm text-muted-foreground'>
                    No boards yet
                  </div>
                </SidebarMenuItem>
              ) : (
                boards.map((board) => {
                  const isBoardActive = pathname.includes(`/board/${board.id}`);

                  return (
                    <SidebarMenuItem key={board.id} className='group/board'>
                      <SidebarMenuButton
                        asChild
                        tooltip={board.name}
                        isActive={isBoardActive}
                      >
                        <Link href={`/project/${projectId}/board/${board.id}`}>
                          <IconLayoutKanban className='h-4 w-4' />
                          <span>{board.name}</span>
                        </Link>
                      </SidebarMenuButton>
                      <BoardActionsMenu
                        boardId={board.id}
                        boardName={board.name}
                        projectId={projectId}
                      />
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
