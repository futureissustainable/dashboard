"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useStore, type Project, type Priority } from "@/store/useStore";
import {
  DotsThree,
  Plus,
  Trash,
  FolderPlus,
  PencilSimple,
  Palette,
  X,
} from "@phosphor-icons/react";
import { getIconComponent } from "@/lib/constants";
import PriorityDots from "./PriorityDots";
import TaskItem from "./TaskItem";
import TaskFolder from "./TaskFolder";
import IconPicker from "./IconPicker";
import ColorPicker from "./ColorPicker";
import type { ProjectDropData } from "./DndProvider";
import type { SortMode } from "@/store/useStore";

interface ProjectColumnProps {
  project: Project;
  index: number;
  sortMode: SortMode;
}

export default function ProjectColumn({ project, index, sortMode }: ProjectColumnProps) {
  const {
    deleteProject,
    updateProjectName,
    updateProjectIcon,
    updateProjectColor,
    updateProjectPriority,
    addTask,
    addFolder,
  } = useStore();

  const [showMenu, setShowMenu] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);

  // ── Droppable (drop on this project = move to root, no folder) ──
  const projectDropData: ProjectDropData = {
    type: "project",
    projectId: project.id,
  };
  const { setNodeRef: setProjectDropRef, isOver: isProjectOver } = useDroppable({
    id: `project-drop-${project.id}`,
    data: projectDropData,
  });

  // Click-outside for dropdown menu
  const closeMenu = useCallback(() => setShowMenu(false), []);
  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu, closeMenu]);

  const IconComp = getIconComponent(project.iconName);
  const color = project.color.bg;

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    addTask(project.id, newTaskTitle.trim(), null);
    setNewTaskTitle("");
    setShowAddTask(false);
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    addFolder(project.id, newFolderName.trim());
    setNewFolderName("");
    setShowAddFolder(false);
  };

  const handleRename = () => {
    if (editName.trim()) {
      updateProjectName(project.id, editName.trim());
    }
    setIsEditingName(false);
  };

  const allTasksByPriority = [...project.tasks].sort(
    (a, b) => a.priority - b.priority
  );
  const looseTasks = project.tasks
    .filter((t) => !t.folderId)
    .sort((a, b) => a.priority - b.priority);
  const isImportanceMode = sortMode === "importance";

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((t) => t.completed).length;
  const progressPct = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div
      className="column-enter border border-border bg-surface flex flex-col max-h-[calc(100vh-100px)] sm:max-h-[calc(100vh-120px)]"
      style={{ animationDelay: `${index * 80}ms`, flex: "1 1 0", minWidth: "300px" }}
    >
      {/* ── Header ── */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Icon button */}
          <button
            onClick={() => setShowIconPicker(true)}
            className="mt-0.5 flex-shrink-0 w-9 h-9 flex items-center justify-center border transition-all duration-150 hover:scale-105"
            style={{
              borderColor: color + "40",
              backgroundColor: color + "10",
            }}
            title="Change icon"
          >
            <IconComp size={18} weight="bold" style={{ color }} />
          </button>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") {
                    setEditName(project.name);
                    setIsEditingName(false);
                  }
                }}
                className="text-[15px] sm:text-[16px] font-semibold w-full border-b border-border py-0.5 -mb-0.5"
                autoFocus
              />
            ) : (
              <h3
                className="text-[15px] sm:text-[16px] font-semibold truncate cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => setIsEditingName(true)}
                title="Click to rename"
              >
                {project.name}
              </h3>
            )}

            <div className="flex items-center gap-2 mt-2">
              <PriorityDots
                priority={project.priority}
                color={color}
                onChangePriority={(p: Priority) =>
                  updateProjectPriority(project.id, p)
                }
                size="md"
              />
              {totalTasks > 0 && (
                <span className="text-[11px] font-mono text-muted tabular-nums tracking-wide">
                  {completedTasks}/{totalTasks}
                </span>
              )}
            </div>
          </div>

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-muted hover:text-foreground p-1.5 -mr-1.5 transition-colors duration-100"
            >
              <DotsThree size={18} weight="bold" />
            </button>

            {showMenu && (
              <div className="dropdown-enter absolute right-0 top-9 z-40 border border-border bg-surface-elevated min-w-[190px] py-2">
                {!isImportanceMode && (
                  <button
                    onClick={() => {
                      setShowAddFolder(true);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-left text-foreground-secondary hover:bg-hover hover:text-foreground transition-colors"
                  >
                    <FolderPlus size={14} weight="bold" className="text-muted" />
                    Add Folder
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsEditingName(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-left text-foreground-secondary hover:bg-hover hover:text-foreground transition-colors"
                >
                  <PencilSimple size={14} weight="bold" className="text-muted" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    setShowIconPicker(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-left text-foreground-secondary hover:bg-hover hover:text-foreground transition-colors"
                >
                  <Palette size={14} weight="bold" className="text-muted" />
                  Change Icon
                </button>
                <button
                  onClick={() => {
                    setShowColorPicker(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-left text-foreground-secondary hover:bg-hover hover:text-foreground transition-colors"
                >
                  <div
                    className="w-3.5 h-3.5 flex-shrink-0 border border-white/20"
                    style={{ backgroundColor: color }}
                  />
                  Change Color
                </button>
                <div className="h-px bg-border my-2 mx-4" />
                <button
                  onClick={() => {
                    deleteProject(project.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-left text-red-400/80 hover:bg-hover hover:text-red-400 transition-colors"
                >
                  <Trash size={14} weight="bold" />
                  Delete Project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-track mt-4">
          <div
            className="progress-fill"
            style={{
              width: `${progressPct}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>

      {/* ── Body — scrollable + project drop target ── */}
      <div
        ref={setProjectDropRef}
        className={`flex-1 overflow-y-auto px-4 sm:px-5 pb-2 transition-colors duration-150 ${
          isProjectOver ? "bg-hover/60" : ""
        }`}
      >
        {isImportanceMode ? (
          /* ── Importance mode: flat list sorted by priority with group headers ── */
          <>
            {([1, 2, 3] as const).map((p) => {
              const group = allTasksByPriority.filter((t) => t.priority === p);
              if (group.length === 0) return null;
              return (
                <div key={p}>
                  <div className="flex items-center gap-2 mt-2 mb-1 px-1">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: p }).map((_, i) => (
                        <span
                          key={i}
                          className="w-[5px] h-[5px] rounded-full"
                          style={{ backgroundColor: color + "60" }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted/30">
                      Priority {p}
                    </span>
                    <span className="text-[11px] font-mono text-muted/20 tabular-nums">
                      {group.length}
                    </span>
                  </div>
                  {group.map((task) => (
                    <TaskItem
                      key={task.id}
                      projectId={project.id}
                      task={task}
                      color={color}
                    />
                  ))}
                </div>
              );
            })}
          </>
        ) : (
          /* ── Grouped mode: folders + uncategorized ── */
          <>
            {/* Folders */}
            {project.folders.map((folder) => {
              const folderTasks = project.tasks.filter(
                (t) => t.folderId === folder.id
              );
              return (
                <TaskFolder
                  key={folder.id}
                  projectId={project.id}
                  folder={folder}
                  tasks={folderTasks}
                  color={color}
                />
              );
            })}

            {/* Add folder input */}
            {showAddFolder && (
              <div className="flex items-center gap-2.5 py-2 px-1 mb-2">
                <FolderPlus size={14} weight="bold" className="text-muted flex-shrink-0" />
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddFolder();
                    if (e.key === "Escape") {
                      setShowAddFolder(false);
                      setNewFolderName("");
                    }
                  }}
                  placeholder="Folder name..."
                  className="flex-1 text-[12px] font-mono uppercase tracking-wider border-b border-border py-1.5 focus:border-foreground"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowAddFolder(false);
                    setNewFolderName("");
                  }}
                  className="text-muted hover:text-foreground p-1"
                >
                  <X size={12} weight="bold" />
                </button>
              </div>
            )}

            {/* Uncategorized label */}
            {looseTasks.length > 0 && project.folders.length > 0 && (
              <div className="mt-3 mb-1 px-1">
                <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted/40">
                  Uncategorized
                </span>
              </div>
            )}

            {/* Loose tasks */}
            {looseTasks.map((task) => (
              <TaskItem
                key={task.id}
                projectId={project.id}
                task={task}
                color={color}
              />
            ))}
          </>
        )}

        {/* Inline add task input */}
        {showAddTask && (
          <div className="flex items-center gap-2 py-2 px-1 mt-1">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTask();
                if (e.key === "Escape") {
                  setShowAddTask(false);
                  setNewTaskTitle("");
                }
              }}
              placeholder="Task name..."
              className="flex-1 text-[13px] border-b border-border py-1.5 focus:border-foreground"
              autoFocus
            />
            <button
              onClick={() => {
                setShowAddTask(false);
                setNewTaskTitle("");
              }}
              className="text-muted hover:text-foreground p-1"
            >
              <X size={12} weight="bold" />
            </button>
          </div>
        )}

        {/* Empty column state */}
        {totalTasks === 0 && !showAddTask && !showAddFolder && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className="w-10 h-10 flex items-center justify-center mb-4"
              style={{ backgroundColor: color + "08" }}
            >
              <IconComp size={20} weight="light" style={{ color: color + "40" }} />
            </div>
            <p className="text-[12px] text-muted/50 font-mono uppercase tracking-wider">
              No tasks yet
            </p>
          </div>
        )}
      </div>

      {/* ── Footer — add task ── */}
      <div className="border-t border-border px-4 sm:px-5 py-3">
        <button
          onClick={() => setShowAddTask(true)}
          className="flex items-center gap-2 w-full text-[12px] font-mono uppercase tracking-[0.1em] text-muted/60 hover:text-foreground transition-colors duration-100 py-1 group"
        >
          <Plus
            size={13}
            weight="bold"
            className="group-hover:rotate-90 transition-transform duration-200"
          />
          Add Task
        </button>
      </div>

      {/* Icon picker modal */}
      {showIconPicker && (
        <IconPicker
          currentIcon={project.iconName}
          color={color}
          onSelect={(iconName) => updateProjectIcon(project.id, iconName)}
          onClose={() => setShowIconPicker(false)}
        />
      )}

      {/* Color picker modal */}
      {showColorPicker && (
        <ColorPicker
          currentColor={color}
          onSelect={(c) => updateProjectColor(project.id, c)}
          onClose={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
}
