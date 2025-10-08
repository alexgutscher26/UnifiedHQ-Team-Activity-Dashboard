import {
  IconBrandGithub,
  IconBrandNotion,
  IconBrandSlack,
  IconSparkles,
} from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function SectionCards() {
  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription className='flex items-center gap-2'>
            <IconBrandNotion className='size-4' />
            Notion Updates
          </CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            24
          </CardTitle>
          <CardAction>
            <Badge variant='outline' className='bg-background'>
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 font-medium'>
            12 pages edited, 8 comments
          </div>
          <div className='text-muted-foreground'>Last update 5 minutes ago</div>
        </CardFooter>
      </Card>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription className='flex items-center gap-2'>
            <IconBrandSlack className='size-4' />
            Slack Messages
          </CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            156
          </CardTitle>
          <CardAction>
            <Badge variant='outline' className='bg-background'>
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 font-medium'>8 channels, 23 threads</div>
          <div className='text-muted-foreground'>
            Last message 2 minutes ago
          </div>
        </CardFooter>
      </Card>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription className='flex items-center gap-2'>
            <IconBrandGithub className='size-4' />
            GitHub Activity
          </CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            18
          </CardTitle>
          <CardAction>
            <Badge variant='outline' className='bg-background'>
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 font-medium'>
            7 commits, 3 PRs, 2 reviews
          </div>
          <div className='text-muted-foreground'>
            Last commit 15 minutes ago
          </div>
        </CardFooter>
      </Card>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription className='flex items-center gap-2'>
            <IconSparkles className='size-4' />
            AI Summary
          </CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            Ready
          </CardTitle>
          <CardAction>
            <Badge variant='outline' className='bg-background'>
              Generated
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 font-medium'>
            Daily insights available
          </div>
          <div className='text-muted-foreground'>Updated 10 minutes ago</div>
        </CardFooter>
      </Card>
    </div>
  );
}
