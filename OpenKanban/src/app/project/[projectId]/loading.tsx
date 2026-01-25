import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state for project routes.
 *
 * @see specs/31-route-structure.md:L19-24
 */
export default function ProjectLoading() {
  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-10 w-32' />
      </div>
      <div className='grid gap-4 md:grid-cols-3'>
        <Skeleton className='h-64' />
        <Skeleton className='h-64' />
        <Skeleton className='h-64' />
      </div>
    </div>
  );
}
