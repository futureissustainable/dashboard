"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import ProjectColumn from "@/components/ProjectColumn";
import { Plus, X } from "@phosphor-icons/react";

export default function Home() {
  const { projects, addProject } = useStore();
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddProject = () => {
    if (!newProjectName.trim()) return;
    addProject(newProjectName.trim());
    setNewProjectName("");
    setShowAddProject(false);
  };

  // Sort projects by priority (1 first)
  const sortedProjects = [...projects].sort(
    (a, b) => a.priority - b.priority
  );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted">
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-baseline gap-4">
          <h1 className="font-mono text-[20px] font-bold tracking-[-0.02em]">
            taskido
          </h1>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted">
            {projects.length} Project{projects.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Add project button */}
        {showAddProject ? (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddProject();
                if (e.key === "Escape") {
                  setShowAddProject(false);
                  setNewProjectName("");
                }
              }}
              placeholder="Project name..."
              className="text-[14px] border-b border-border py-1 w-[200px] focus:border-foreground"
              autoFocus
            />
            <button
              onClick={handleAddProject}
              className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted hover:text-foreground border border-border px-3 py-1.5 hover:border-foreground transition-colors duration-100"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowAddProject(false);
                setNewProjectName("");
              }}
              className="text-muted hover:text-foreground"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddProject(true)}
            className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.15em] text-muted hover:text-foreground border border-border px-3 py-1.5 hover:border-foreground transition-colors duration-100"
          >
            <Plus size={12} weight="bold" />
            New Project
          </button>
        )}
      </header>

      {/* Main content - horizontal scrolling columns */}
      <main className="flex-1 overflow-x-auto">
        {sortedProjects.length === 0 ? (
          <div className="flex items-center justify-center h-[calc(100vh-80px)]">
            <div className="text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted mb-6">
                No projects yet
              </p>
              <button
                onClick={() => setShowAddProject(true)}
                className="font-mono text-[11px] uppercase tracking-[0.15em] border border-border px-5 py-2.5 text-muted hover:text-foreground hover:border-foreground transition-colors duration-200"
              >
                <span className="flex items-center gap-2">
                  <Plus size={12} weight="bold" />
                  Create your first project
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-0 p-6 min-h-[calc(100vh-80px)]">
            {sortedProjects.map((project, i) => (
              <ProjectColumn key={project.id} project={project} index={i} />
            ))}

            {/* Quick add column */}
            <button
              onClick={() => setShowAddProject(true)}
              className="flex-shrink-0 w-[60px] border border-dashed border-border/40 flex items-center justify-center hover:border-border transition-colors duration-200 group"
            >
              <Plus
                size={18}
                weight="bold"
                className="text-muted/30 group-hover:text-muted transition-colors duration-200"
              />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
