"use client"

import { IconBrandGithub, IconBrandNotion, IconBrandSlack, IconBug, IconTag, IconStar, IconGitCommit } from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { fetchGitHubActivitiesWithSession, type GitHubActivity, type Repository } from "@/lib/github"
import { ExternalLink, RefreshCw } from "lucide-react"

interface Activity {
  id: number | string
  type: "notion" | "slack" | "github"
  user: string
  avatar: string
  action: string
  target: string
  time: string
  details?: string
  url?: string
  labels?: string[]
  assignees?: string[]
}

// Mock data for non-GitHub activities
const mockActivities: Activity[] = [
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

const getIcon = (type: Activity["type"], action?: string) => {
  switch (type) {
    case "github":
      if (action === 'committed') return <IconGitCommit className="size-4" />
      if (action?.includes('pull request')) return <IconBrandGithub className="size-4" />
      if (action?.includes('issue')) return <IconBug className="size-4" />
      if (action?.includes('release')) return <IconTag className="size-4" />
      if (action === 'starred') return <IconStar className="size-4" />
      // Default to GitHub icon for any GitHub activity
      return <IconBrandGithub className="size-4" />
    case "slack":
      return <IconBrandSlack className="size-4" />
    case "notion":
      return <IconBrandNotion className="size-4" />
    default:
      return <IconBrandGithub className="size-4" />
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

interface ActivityFeedProps {
  selectedRepository?: Repository | null
}

export function ActivityFeed({ selectedRepository }: ActivityFeedProps) {
  const [githubActivities, setGithubActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadGitHubData = async () => {
    if (!selectedRepository) {
      setGithubActivities([])
      setError("Please select a repository to see GitHub activity.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const activities = await fetchGitHubActivitiesWithSession(
        selectedRepository.owner, 
        selectedRepository.name
      )
      setGithubActivities(activities)
      setLastUpdated(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load GitHub data"
      if (errorMessage.includes("GitHub account not connected")) {
        setError("Please connect your GitHub account to see real activity data.")
      } else {
        setError(errorMessage)
      }
      console.error("Error loading GitHub activities:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadGitHubData()
  }, [selectedRepository])

  // Combine GitHub activities with mock activities and sort by time
  const allActivities = [...githubActivities, ...mockActivities].sort((a, b) => {
    // Simple sorting - in a real app, you'd parse the time strings properly
    const timeOrder = (time: string) => {
      if (time.includes('seconds')) return 0
      if (time.includes('minutes')) return 1
      if (time.includes('hours')) return 2
      if (time.includes('days')) return 3
      return 4
    }
    return timeOrder(a.time) - timeOrder(b.time)
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team Activity Feed</CardTitle>
            <CardDescription>Real-time updates from Notion, Slack, and GitHub</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadGitHubData}
              disabled={isLoading}
            >
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadGitHubData}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}
        
        <div className="space-y-4">
          {allActivities.map((activity) => (
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
                    {getIcon(activity.type, activity.action)}
                  </Badge>
                </div>
                <div className="text-sm font-medium">{activity.target}</div>
                {activity.details && <div className="text-xs text-muted-foreground">{activity.details}</div>}
                
                {/* Show labels for issues */}
                {activity.labels && activity.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {activity.labels.slice(0, 3).map((label, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0">
                        {label}
                      </Badge>
                    ))}
                    {activity.labels.length > 3 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        +{activity.labels.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Show assignees for issues */}
                {activity.assignees && activity.assignees.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">Assigned to:</span>
                    <div className="flex -space-x-1">
                      {activity.assignees.slice(0, 3).map((assignee, index) => (
                        <div
                          key={index}
                          className="w-4 h-4 rounded-full bg-muted border border-background flex items-center justify-center text-xs font-medium"
                          title={assignee}
                        >
                          {assignee.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {activity.assignees.length > 3 && (
                        <div className="w-4 h-4 rounded-full bg-muted border border-background flex items-center justify-center text-xs">
                          +{activity.assignees.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">{activity.time}</div>
                  {activity.url && (
                    <a
                      href={activity.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      View <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
