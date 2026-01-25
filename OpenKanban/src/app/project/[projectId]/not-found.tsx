import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FolderX } from 'lucide-react';

/**
 * 404 page for invalid project IDs.
 *
 * @see specs/31-route-structure.md:L19-24
 */
export default function ProjectNotFound() {
  return (
    <div className='flex flex-1 flex-col items-center justify-center gap-6 p-8'>
      <FolderX className='h-16 w-16 text-muted-foreground' />
      <div className='text-center'>
        <h2 className='text-2xl font-bold'>Project Not Found</h2>
        <p className='mt-2 text-muted-foreground'>
          The project you&apos;re looking for doesn&apos;t exist or has been
          deleted.
        </p>
      </div>
      <Button asChild>
        <Link href='/'>Go to Home</Link>
      </Button>
    </div>
  );
}
