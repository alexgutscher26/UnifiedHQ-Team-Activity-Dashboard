'use client';

import {
  IconBrandNotion,
  IconBrandSlack,
  IconBug,
  IconTag,
  IconStar,
  IconGitCommit,
} from '@tabler/icons-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data for demonstration
const mockActivities = [
  {
    id: '1',
    type: 'notion',
    title: 'New page created',
    description: 'Created "Project Planning" page in Notion',
    timestamp: '2 hours ago',
    user: {
      name: 'John Doe',
      avatar: '/placeholder-user.jpg',
    },
    metadata: {
      workspace: 'Team Workspace',
    },
  },
  {
    id: '2',
    type: 'slack',
    title: 'Message in #general',
    description: 'Posted a message about the new project timeline',
    timestamp: '4 hours ago',
    user: {
      name: 'Jane Smith',
      avatar: '/placeholder-user.jpg',
    },
    metadata: {
      channel: '#general',
    },
  },
  {
    id: '3',
    type: 'notion',
    title: 'Database updated',
    description: 'Updated the project tasks database',
    timestamp: '6 hours ago',
    user: {
      name: 'Mike Johnson',
      avatar: '/placeholder-user.jpg',
    },
    metadata: {
      database: 'Project Tasks',
    },
  },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'notion':
      return IconBrandNotion;
    case 'slack':
      return IconBrandSlack;
    default:
      return IconGitCommit;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'notion':
      return 'text-black';
    case 'slack':
      return 'text-purple-600';
    default:
      return 'text-gray-600';
  }
};

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <IconGitCommit className='size-5' />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest updates from your connected integrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {mockActivities.map(activity => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);

            return (
              <div
                key={activity.id}
                className='flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors'
              >
                <div className={`p-2 rounded-lg bg-muted ${colorClass}`}>
                  <Icon className='size-4' />
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h4 className='font-medium text-sm'>{activity.title}</h4>
                    <Badge variant='secondary' className='text-xs'>
                      {activity.type}
                    </Badge>
                  </div>
                  <p className='text-sm text-muted-foreground mb-2'>
                    {activity.description}
                  </p>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <Avatar className='size-4'>
                      <AvatarImage src={activity.user.avatar} />
                      <AvatarFallback>
                        {activity.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{activity.user.name}</span>
                    <span>•</span>
                    <span>{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className='mt-6 pt-4 border-t'>
          <p className='text-sm text-muted-foreground text-center mb-4'>
            Connect more integrations to see activity from all your tools
          </p>
          <Button variant='outline' className='w-full'>
            View All Activity
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
