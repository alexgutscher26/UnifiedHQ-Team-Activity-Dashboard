"use client"

import { IconSparkles } from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function AISummary() {
  return (
    <Card className="bg-gradient-to-br from-primary/5 via-card to-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconSparkles className="size-5" />
            <CardTitle>AI Daily Summary</CardTitle>
          </div>
          <Badge variant="secondary">Today</Badge>
        </div>
        <CardDescription>Intelligent insights from your team's activity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Key Highlights</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-primary flex-shrink-0" />
              <span>Engineering team merged 7 pull requests, with authentication flow now complete</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-primary flex-shrink-0" />
              <span>Product roadmap updated with 3 new features prioritized for Q1</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-primary flex-shrink-0" />
              <span>Design team shared new mockups in Slack, awaiting feedback from stakeholders</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-primary flex-shrink-0" />
              <span>156 messages across 8 Slack channels, highest activity in #engineering</span>
            </li>
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Action Items</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-orange-500 flex-shrink-0" />
              <span>2 pull requests awaiting review from senior engineers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-orange-500 flex-shrink-0" />
              <span>Sprint planning notes need capacity estimates from 3 team members</span>
            </li>
          </ul>
        </div>
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">Summary generated at 2:45 PM • Updates every 30 minutes</p>
        </div>
      </CardContent>
    </Card>
  )
}
