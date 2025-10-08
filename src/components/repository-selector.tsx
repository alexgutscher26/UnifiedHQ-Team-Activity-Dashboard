"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Github, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { loadUserPreferences, saveUserPreferences } from "@/lib/user-preferences"

interface Repository {
  id: number
  name: string
  fullName: string
  owner: string
  description: string | null
  isPrivate: boolean
  updatedAt: string
  defaultBranch: string
}

interface RepositorySelectorProps {
  onRepositorySelect?: (repo: Repository | null) => void
  selectedRepository?: Repository | null
}

export function RepositorySelector({ onRepositorySelect, selectedRepository }: RepositorySelectorProps) {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const loadRepositories = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/github/repositories')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load repositories')
      }

      const data = await response.json()
      setRepositories(data.data.repositories)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load repositories'
      setError(errorMessage)
      console.error('Error loading repositories:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSavedPreferences = async () => {
    try {
      const preferences = await loadUserPreferences()
      if (preferences.githubRepoId && repositories.length > 0) {
        const savedRepo = repositories.find(r => r.id === preferences.githubRepoId)
        if (savedRepo) {
          onRepositorySelect?.(savedRepo)
        }
      }
    } catch (error) {
      console.error('Error loading saved preferences:', error)
    }
  }

  useEffect(() => {
    loadRepositories()
  }, [])

  // Load saved preferences when repositories are loaded
  useEffect(() => {
    if (repositories.length > 0) {
      loadSavedPreferences()
    }
  }, [repositories])

  const handleRepositoryChange = async (value: string) => {
    if (value === 'none') {
      onRepositorySelect?.(null)
      return
    }

    const repo = repositories.find(r => r.id.toString() === value)
    if (repo) {
      onRepositorySelect?.(repo)
      
      // Save to database
      setSaving(true)
      try {
        const success = await saveUserPreferences({
          githubOwner: repo.owner,
          githubRepo: repo.name,
          githubRepoId: repo.id
        })
        
        if (!success) {
          setError('Failed to save repository selection')
        }
      } catch (err) {
        setError('Failed to save repository selection')
        console.error('Error saving repository:', err)
      } finally {
        setSaving(false)
      }
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return `${Math.floor(diffInDays / 30)} months ago`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Github className="size-5" />
              Select Repository
            </CardTitle>
            <CardDescription>
              Choose which repository to track for activity data
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadRepositories}
            disabled={isLoading}
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {repositories.length > 0 && (
          <div className="space-y-2">
            <Select
              value={selectedRepository?.id.toString() || 'none'}
              onValueChange={handleRepositoryChange}
              disabled={isLoading || saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a repository..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <span>No repository selected</span>
                  </div>
                </SelectItem>
                {repositories.map((repo) => (
                  <SelectItem key={repo.id} value={repo.id.toString()}>
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{repo.fullName}</span>
                          {repo.isPrivate && (
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Private</span>
                          )}
                        </div>
                        {repo.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {repo.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Updated {formatTimeAgo(repo.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedRepository && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Tracking activity from <strong>{selectedRepository.fullName}</strong>
              {saving && <span className="ml-2 text-sm">(Saving...)</span>}
            </AlertDescription>
          </Alert>
        )}

        {repositories.length === 0 && !isLoading && !error && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              No repositories found. Make sure your GitHub account has access to repositories.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
