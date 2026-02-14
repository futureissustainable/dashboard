"use client";

import { useState } from "react";
import { useStore, type Project, type Priority } from "@/store/useStore";
import {
  DotsThree,
  Plus,
  Trash,
  FolderPlus,
  X,
} from "@phosphor-icons/react";
import { getIconComponent } from "@/lib/constants";
import PriorityDots from "./PriorityDots";
import TaskItem from "./TaskItem";
import TaskFolder from "./TaskFolder";
import IconPicker from "./IconPicker";

interface ProjectColumnProps {
  project: Project;
  index: number;
}

export default function ProjectColumn({ project, index }: ProjectColumnProps) {
  const {
    deleteProject,
    updateProjectName,
    updateProjectIcon,
    updateProjectPriority,
    addTask,
    addFolder,
  } = useStore();

  const [showMenu, setShowMenu] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

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

  // Tasks not in any folder
  const looseTasks = project.tasks
    .filter((t) => !t.folderId)
    .sort((a, b) => a.priority - b.priority);

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((t) => t.completed).length;

  return (
    <div
      className="column-enter flex-shrink-0 w-[340px] border border-border bg-surface flex flex-col max-h-[calc(100vh-140px)]"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Column header */}
      <div
        className="p-4 border-b border-border"
        style={{ borderBottomColor: color + "44" }}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <button
            onClick={() => setShowIconPicker(true)}
            className="mt-0.5 flex-shrink-0 w-8 h-8 flex items-center justify-center border transition-colors duration-100 hover:border-foreground/30"
            style={{
              borderColor: color + "55",
              backgroundColor: color + "11",
            }}
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
                className="text-[16px] font-semibold w-full border-b border-border py-0.5"
                autoFocus
              />
            ) : (
              <h3
                className="text-[16px] font-semibold truncate cursor-pointer hover:opacity-70"
                onDoubleClick={() => setIsEditingName(true)}
              >
                {project.name}
              </h3>
            )}

            <div className="flex items-center gap-3 mt-1.5">
              <PriorityDots
                priority={project.priority}
                color={color}
                onChangePriority={(p: Priority) =>
                  updateProjectPriority(project.id, p)
                }
                size="md"
              />
              {totalTasks > 0 && (
                <span className="text-[10px] font-mono text-muted tracking-wider">
                  {completedTasks}/{totalTasks} DONE
                </span>
              )}
            </div>
          </div>

          {/* Menu toggle */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-muted hover:text-foreground p-1"
            >
              <DotsThree size={18} weight="bold" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 z-40 border border-border bg-surface-elevated min-w-[160px]">
                <button
                  onClick={() => {
                    setShowAddFolder(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[12px] font-mono uppercase tracking-wider text-left hover:bg-hover transition-colors"
                >
                  <FolderPlus size={14} weight="bold" />
                  Add Folder
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[12px] font-mono uppercase tracking-wider text-left hover:bg-hover transition-colors"
                >
                  Rename
                </button>
                <button
                  onClick={() => {
                    setShowIconPicker(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[12px] font-mono uppercase tracking-wider text-left hover:bg-hover transition-colors"
                >
                  Change Icon
                </button>
                <div className="border-t border-border" />
                <button
                  onClick={() => {
                    deleteProject(project.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[12px] font-mono uppercase tracking-wider text-left hover:bg-hover text-red-400 transition-colors"
                >
                  <Trash size={14} weight="bold" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Color bar */}
        <div
          className="h-[2px] mt-3 w-full"
          style={{ backgroundColor: color }}
        />
      </div>

      {/* Column body - scrollable */}
      <div className="flex-1 overflow-y-auto p-3">
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
          <div className="flex items-center gap-2 py-2 px-1 mb-2">
            <FolderPlus size={14} weight="bold" className="text-muted" />
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
              className="flex-1 text-[12px] font-mono uppercase tracking-wider border-b border-border/50 py-1 focus:border-foreground/30"
              autoFocus
            />
            <button
              onClick={() => {
                setShowAddFolder(false);
                setNewFolderName("");
              }}
              className="text-muted hover:text-foreground"
            >
              <X size={12} weight="bold" />
            </button>
          </div>
        )}

        {/* Loose tasks (no folder) */}
        {looseTasks.length > 0 && project.folders.length > 0 && (
          <div className="mt-3 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted/50 px-1">
              Uncategorized
            </span>
          </div>
        )}
        {looseTasks.map((task) => (
          <TaskItem
            key={task.id}
            projectId={project.id}
            task={task}
            color={color}
          />
        ))}

        {/* Add task input */}
        {showAddTask ? (
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
              className="flex-1 text-[13px] border-b border-border/50 py-1 focus:border-foreground/30"
              autoFocus
            />
            <button
              onClick={() => {
                setShowAddTask(false);
                setNewTaskTitle("");
              }}
              className="text-muted hover:text-foreground"
            >
              <X size={12} weight="bold" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Column footer - add task */}
      <div className="border-t border-border/40 p-3">
        <button
          onClick={() => setShowAddTask(true)}
          className="flex items-center gap-2 w-full text-[11px] font-mono uppercase tracking-[0.12em] text-muted hover:text-foreground transition-colors duration-100 py-1"
        >
          <Plus size={12} weight="bold" />
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
    </div>
  );
}
