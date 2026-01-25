'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { CreateProjectDialog } from '@/features/projects/components/create-project-dialog';
import { IconFolder, IconPlus } from '@tabler/icons-react';

/**
 * Welcome screen shown when no projects exist.
 * Provides a prominent CTA to create the first project.
 * @see specs/31-route-structure.md:L62
 */
export function WelcomeScreen() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-md text-center'>
        <CardHeader className='space-y-4 pb-2'>
          <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
            <IconFolder className='h-8 w-8 text-primary' />
          </div>
          <CardTitle className='text-2xl'>Welcome to OpenKanban</CardTitle>
          <CardDescription className='text-base'>
            Get started by creating your first project. Projects help you
            organize tasks and track progress on a Kanban board.
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-4'>
          <CreateProjectDialog>
            <Button size='lg' className='w-full sm:w-auto'>
              <IconPlus className='mr-2 h-5 w-5' />
              Create Your First Project
            </Button>
          </CreateProjectDialog>
        </CardContent>
      </Card>
    </div>
  );
}
