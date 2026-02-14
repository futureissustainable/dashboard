"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import DndProvider from "@/components/DndProvider";
import ProjectColumn from "@/components/ProjectColumn";
import { Plus, X, SquaresFour } from "@phosphor-icons/react";

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

  const totalTasks = projects.reduce((s, p) => s + p.tasks.length, 0);
  const completedTasks = projects.reduce(
    (s, p) => s + p.tasks.filter((t) => t.completed).length,
    0
  );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-1 h-1 bg-muted rounded-full animate-pulse" />
          <div className="w-1 h-1 bg-muted rounded-full animate-pulse [animation-delay:150ms]" />
          <div className="w-1 h-1 bg-muted rounded-full animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  return (
    <DndProvider>
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ── */}
      <header className="border-b border-border flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <h1 className="font-mono text-[18px] sm:text-[20px] font-bold tracking-[-0.03em] flex-shrink-0">
              taskido
            </h1>
            <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-muted tabular-nums tracking-wide">
              <span>
                {projects.length} project{projects.length !== 1 ? "s" : ""}
              </span>
              {totalTasks > 0 && (
                <>
                  <span className="text-border">|</span>
                  <span>
                    {completedTasks}/{totalTasks} tasks
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Add project */}
          {showAddProject ? (
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
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
                className="text-[13px] sm:text-[14px] border-b border-border py-1 w-[140px] sm:w-[200px] focus:border-foreground"
                autoFocus
              />
              <button
                onClick={handleAddProject}
                className="text-[11px] font-mono uppercase tracking-wider text-muted hover:text-foreground border border-border px-3 py-1.5 hover:border-foreground transition-colors duration-100 flex-shrink-0"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowAddProject(false);
                  setNewProjectName("");
                }}
                className="text-muted hover:text-foreground p-1"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddProject(true)}
              className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-muted hover:text-foreground border border-border px-3 py-1.5 hover:border-foreground transition-colors duration-100 flex-shrink-0"
            >
              <Plus size={12} weight="bold" />
              <span className="hidden sm:inline">New Project</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden">
        {sortedProjects.length === 0 ? (
          /* Empty state */
          <div className="flex items-center justify-center h-[calc(100vh-72px)]">
            <div className="text-center px-6 max-w-[320px]">
              <div className="w-16 h-16 border border-border flex items-center justify-center mx-auto mb-6">
                <SquaresFour size={28} weight="light" className="text-muted/30" />
              </div>
              <p className="text-[13px] text-foreground-secondary mb-2">
                No projects yet
              </p>
              <p className="text-[12px] text-muted/60 mb-8 leading-relaxed">
                Create a project to start organizing your tasks into columns.
              </p>
              <button
                onClick={() => setShowAddProject(true)}
                className="font-mono text-[11px] uppercase tracking-wider border border-border px-6 py-3 text-muted hover:text-foreground hover:border-foreground transition-colors duration-200 inline-flex items-center gap-2"
              >
                <Plus size={12} weight="bold" />
                Create Project
              </button>
            </div>
          </div>
        ) : (
          /* Column layout */
          <div className="flex gap-3 sm:gap-4 p-4 sm:p-6 lg:p-8 h-[calc(100vh-72px)]">
            {sortedProjects.map((project, i) => (
              <ProjectColumn key={project.id} project={project} index={i} />
            ))}

            {/* Quick add column */}
            <button
              onClick={() => setShowAddProject(true)}
              className="flex-shrink-0 w-12 sm:w-14 border border-dashed border-border/30 flex items-center justify-center hover:border-border/60 transition-colors duration-200 group"
            >
              <Plus
                size={16}
                weight="bold"
                className="text-muted/20 group-hover:text-muted/50 transition-colors duration-200"
              />
            </button>
          </div>
        )}
      </main>
    </div>
    </DndProvider>
  );
}
