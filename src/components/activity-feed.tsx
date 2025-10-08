"use client"

import { IconBrandGithub, IconBrandNotion, IconBrandSlack } from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Activity {
  id: number
  type: "notion" | "slack" | "github"
  user: string
  avatar: string
  action: string
  target: string
  time: string
  details?: string
}

const activities: Activity[] = [
  {
    id: 1,
    type: "github",
    user: "Sarah Chen",
    avatar: "/placeholder.svg?height=32&width=32",
    action: "merged pull request",
    target: "#234 - Add authentication flow",
    time: "2 minutes ago",
    details: "3 files changed, +245 -12",
  },
  {
    id: 2,
    type: "slack",
    user: "Mike Johnson",
    avatar: "/placeholder.svg?height=32&width=32",
    action: "posted in",
    target: "#engineering",
    time: "5 minutes ago",
    details: "Deployment to staging complete",
  },
  {
    id: 3,
    type: "notion",
    user: "Emma Wilson",
    avatar: "/placeholder.svg?height=32&width=32",
    action: "updated page",
    target: "Q1 Product Roadmap",
    time: "12 minutes ago",
    details: "Added 3 new features",
  },
  {
    id: 4,
    type: "github",
    user: "Alex Chen",
    avatar: "/placeholder.svg?height=32&width=32",
    action: "opened pull request",
    target: "#235 - Fix navigation bug",
    time: "15 minutes ago",
    details: "2 files changed, +67 -23",
  },
  {
    id: 5,
    type: "slack",
    user: "Lisa Park",
    avatar: "/placeholder.svg?height=32&width=32",
    action: "started thread in",
    target: "#design",
    time: "18 minutes ago",
    details: "New mockups for review",
  },
  {
    id: 6,
    type: "notion",
    user: "David Kim",
    avatar: "/placeholder.svg?height=32&width=32",
    action: "commented on",
    target: "Sprint Planning Notes",
    time: "22 minutes ago",
    details: "Added capacity estimates",
  },
  {
    id: 7,
    type: "github",
    user: "Rachel Green",
    avatar: "/placeholder.svg?height=32&width=32",
    action: "reviewed pull request",
    target: "#233 - Update dependencies",
    time: "28 minutes ago",
    details: "Approved with suggestions",
  },
  {
    id: 8,
    type: "slack",
    user: "Tom Anderson",
    avatar: "/placeholder.svg?height=32&width=32",
    action: "posted in",
    target: "#general",
    time: "35 minutes ago",
    details: "Team standup starting in 5 mins",
  },
]

const getIcon = (type: Activity["type"]) => {
  switch (type) {
    case "github":
      return <IconBrandGithub className="size-4" />
    case "slack":
      return <IconBrandSlack className="size-4" />
    case "notion":
      return <IconBrandNotion className="size-4" />
  }
}

const getColor = (type: Activity["type"]) => {
  switch (type) {
    case "github":
      return "bg-foreground text-background"
    case "slack":
      return "bg-[#4A154B] text-white"
    case "notion":
      return "bg-foreground text-background"
  }
}

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Activity Feed</CardTitle>
        <CardDescription>Real-time updates from Notion, Slack, and GitHub</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <Avatar className="size-8">
                <AvatarImage src={activity.avatar || "/placeholder.svg"} alt={activity.user} />
                <AvatarFallback>
                  {activity.user
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{activity.user}</span>
                  <span className="text-sm text-muted-foreground">{activity.action}</span>
                  <Badge variant="outline" className={`${getColor(activity.type)} flex items-center gap-1 px-1.5 py-0`}>
                    {getIcon(activity.type)}
                  </Badge>
                </div>
                <div className="text-sm font-medium">{activity.target}</div>
                {activity.details && <div className="text-xs text-muted-foreground">{activity.details}</div>}
                <div className="text-xs text-muted-foreground">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
