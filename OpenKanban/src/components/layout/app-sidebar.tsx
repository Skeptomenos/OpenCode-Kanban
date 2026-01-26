'use client';
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { DialogErrorBoundary } from '@/components/ui/dialog-error-boundary';
import { CreateProjectDialog } from '@/features/projects/components/create-project-dialog';
import { ProjectActionsMenu } from '@/features/projects/components/project-actions-menu';
import { useProjects } from '@/features/projects/hooks/use-projects';
import {
  CreateBoardDialog,
  BoardActionsMenu,
  useBoards,
} from '@/features/boards';
import { IconFolder, IconPlus, IconLayoutKanban, IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ProjectTreeItemProps {
  project: { id: string; title: string };
  isActive: boolean;
  pathname: string;
}

/**
 * Collapsible project item with nested boards.
 * @see specs/5.1-sidebar-overhaul.md:L7-15
 */
function ProjectTreeItem({ project, isActive, pathname }: ProjectTreeItemProps) {
  const [isOpen, setIsOpen] = useState(isActive);

  const { boards, isLoading: boardsLoading, error: boardsError } = useBoards(
    isOpen ? project.id : ''
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible">
      <SidebarMenuItem className="group/project">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={project.title}
            isActive={isActive}
            className="pr-8"
          >
            <IconChevronRight
              className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
            />
            <IconFolder className="h-4 w-4 shrink-0" />
            <span className="truncate">{project.title}</span>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        
        <DialogErrorBoundary>
          <ProjectActionsMenu
            projectId={project.id}
            projectTitle={project.title}
          />
        </DialogErrorBoundary>
      </SidebarMenuItem>

      <CollapsibleContent>
        <SidebarMenuSub>
          <SidebarMenuSubItem>
            <CreateBoardDialog parentId={project.id}>
              <SidebarMenuSubButton
                className="cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <IconPlus className="h-3 w-3" />
                <span>New Board</span>
              </SidebarMenuSubButton>
            </CreateBoardDialog>
          </SidebarMenuSubItem>

          {boardsLoading && (
            <>
              <SidebarMenuSubItem>
                <div className="flex items-center gap-2 px-2 py-1">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </SidebarMenuSubItem>
            </>
          )}

          {boardsError && !boardsLoading && (
            <SidebarMenuSubItem>
              <div className="px-2 py-1 text-xs text-muted-foreground">
                Failed to load boards
              </div>
            </SidebarMenuSubItem>
          )}

          {!boardsLoading && !boardsError && boards.map((board) => {
            const isBoardActive = pathname.includes(`/board/${board.id}`);

            return (
              <SidebarMenuSubItem key={board.id} className="group/board">
                <SidebarMenuSubButton
                  asChild
                  isActive={isBoardActive}
                >
                  <Link href={`/project/${project.id}/board/${board.id}`}>
                    <IconLayoutKanban className="h-3.5 w-3.5" />
                    <span>{board.name}</span>
                  </Link>
                </SidebarMenuSubButton>
                <DialogErrorBoundary>
                  <BoardActionsMenu
                    boardId={board.id}
                    boardName={board.name}
                    projectId={project.id}
                  />
                </DialogErrorBoundary>
              </SidebarMenuSubItem>
            );
          })}

          {!boardsLoading && !boardsError && boards.length === 0 && (
            <SidebarMenuSubItem>
              <div className="px-2 py-1 text-xs text-muted-foreground">
                No boards yet
              </div>
            </SidebarMenuSubItem>
          )}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** @see specs/5.1-sidebar-overhaul.md:L7-15 */
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
                  <ProjectTreeItem
                    key={project.id}
                    project={project}
                    isActive={isActive}
                    pathname={pathname}
                  />
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
