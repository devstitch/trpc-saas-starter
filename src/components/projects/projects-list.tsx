"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useOrganization } from "@/hooks/use-organization"
import { listProjects, createProject } from "@/lib/queries/projects.queries"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { FolderKanban } from "lucide-react"

interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
}

export function ProjectsList() {
  const { currentOrg, loading: orgLoading } = useOrganization()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [newProject, setNewProject] = useState({ name: "", description: "" })
  const [error, setError] = useState<string | null>(null)
  const [isLimitError, setIsLimitError] = useState(false)

  useEffect(() => {
    if (currentOrg) {
      fetchProjects()
    }
  }, [currentOrg])

  const fetchProjects = async () => {
    if (!currentOrg) return

    try {
      const data = await listProjects({
        organizationId: currentOrg.id,
      })
      setProjects(data?.projects || [])
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrg) return

    setError(null)
    try {
      await createProject({
        organizationId: currentOrg.id,
        name: newProject.name,
        description: newProject.description,
      })

      setNewProject({ name: "", description: "" })
      setIsOpen(false)
      await fetchProjects()
    } catch (error: any) {
      const errorMessage = error.message || "Failed to create project. Please try again."
      setError(errorMessage)
      
      // Check if it's a limit error
      const isLimitReached = errorMessage.toLowerCase().includes("limit reached") || 
                            errorMessage.toLowerCase().includes("project limit")
      setIsLimitError(isLimitReached)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Projects</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Create Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>Add a new project to your workspace</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>{error}</p>
                    {isLimitError && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => {
                          setIsOpen(false)
                          router.push("/dashboard/billing")
                        }}
                      >
                        Upgrade Plan
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              <div>
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  value={newProject.name}
                  onChange={(e) => {
                    setNewProject({ ...newProject, name: e.target.value })
                    setError(null)
                    setIsLimitError(false)
                  }}
                  placeholder="My Project"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Input
                  value={newProject.description}
                  onChange={(e) => {
                    setNewProject({ ...newProject, description: e.target.value })
                    setError(null)
                    setIsLimitError(false)
                  }}
                  placeholder="Project description"
                />
              </div>
              <Button type="submit" className="w-full">
                Create
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {orgLoading || loading ? (
        <div className="text-center py-8">Loading projects...</div>
      ) : !currentOrg ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Please create or select an organization first</p>
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No projects yet</p>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>Create your first project</Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="group hover:shadow-xl hover:border-primary/20 transition-all duration-300 cursor-pointer border-2 hover:-translate-y-1"
              onClick={() => router.push(`/dashboard/projects`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="mt-1.5 line-clamp-2">
                      {project.description || "No description"}
                    </CardDescription>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <FolderKanban className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
