import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-background p-4'>
      <div className='w-full max-w-md space-y-4 text-center'>
        <Skeleton className='mx-auto h-16 w-16 rounded-full' />
        <Skeleton className='mx-auto h-8 w-48' />
        <Skeleton className='mx-auto h-4 w-64' />
        <Skeleton className='mx-auto h-10 w-40' />
      </div>
    </div>
  );
}
