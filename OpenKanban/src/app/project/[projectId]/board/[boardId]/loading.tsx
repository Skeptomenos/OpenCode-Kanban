import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state for board routes.
 *
 * @see specs/31-route-structure.md:L19-24
 */
export default function BoardLoading() {
  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-10 w-32' />
      </div>
      <div className='flex gap-4 overflow-x-auto pb-4'>
        <div className='flex min-w-[280px] flex-col gap-2'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-24 w-full' />
          <Skeleton className='h-24 w-full' />
        </div>
        <div className='flex min-w-[280px] flex-col gap-2'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-24 w-full' />
        </div>
        <div className='flex min-w-[280px] flex-col gap-2'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-24 w-full' />
          <Skeleton className='h-24 w-full' />
          <Skeleton className='h-24 w-full' />
        </div>
      </div>
    </div>
  );
}
