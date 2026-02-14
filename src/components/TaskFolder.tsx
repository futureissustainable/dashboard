"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useStore, type Task, type Folder } from "@/store/useStore";
import {
  FolderSimple,
  CaretRight,
  Trash,
  Plus,
  X,
} from "@phosphor-icons/react";
import TaskItem from "./TaskItem";
import type { FolderDropData } from "./DndProvider";

interface TaskFolderProps {
  projectId: string;
  folder: Folder;
  tasks: Task[];
  color: string;
}

export default function TaskFolder({
  projectId,
  folder,
  tasks,
  color,
}: TaskFolderProps) {
  const { deleteFolder, renameFolder, addTask } = useStore();

  const dropData: FolderDropData = {
    type: "folder",
    projectId,
    folderId: folder.id,
  };

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `folder-drop-${folder.id}`,
    data: dropData,
  });
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleRename = () => {
    if (editName.trim()) {
      renameFolder(projectId, folder.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    addTask(projectId, newTaskTitle.trim(), folder.id);
    setNewTaskTitle("");
    setShowAddTask(false);
  };

  const sortedTasks = [...tasks].sort((a, b) => a.priority - b.priority);

  return (
    <div
      ref={setDropRef}
      className={`mb-1 transition-all duration-150 ${
        isOver ? "rounded-sm bg-hover/50" : ""
      }`}
      style={isOver ? { outlineColor: color + "60", outline: `1px solid ${color}60` } : {}}
    >
      {/* Folder header */}
      <div
        className="flex items-center gap-2 py-2.5 px-2 -mx-1 cursor-pointer group rounded-sm hover:bg-hover transition-colors duration-100"
        onClick={() => setExpanded(!expanded)}
      >
        <CaretRight
          size={10}
          weight="bold"
          className={`text-muted/50 transition-transform duration-200 ${
            expanded ? "rotate-90" : ""
          }`}
        />
        <FolderSimple size={14} weight="fill" style={{ color: color + "88" }} />

        {isEditing ? (
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setEditName(folder.name);
                setIsEditing(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="text-[12px] font-mono uppercase tracking-[0.1em] border-b border-border py-0.5 min-w-0"
            autoFocus
          />
        ) : (
          <span
            className="text-[12px] font-mono uppercase tracking-[0.1em] text-muted cursor-pointer hover:text-foreground-secondary transition-colors"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Double-click to rename"
          >
            {folder.name}
          </span>
        )}

        <span className="text-[10px] font-mono text-muted/30 tabular-nums">
          {tasks.length}
        </span>

        <div className="flex-1" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowAddTask(true);
            setExpanded(true);
          }}
          className="opacity-0 group-hover:opacity-100 text-muted hover:text-foreground transition-opacity duration-100 p-1"
        >
          <Plus size={12} weight="bold" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteFolder(projectId, folder.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-muted hover:text-foreground transition-opacity duration-100 p-1"
        >
          <Trash size={12} weight="bold" />
        </button>
      </div>

      {/* Folder contents */}
      <div className={`accordion-wrapper ${expanded ? "open" : ""}`}>
        <div className="accordion-inner">
          <div className="pl-5 ml-1.5" style={{ borderLeft: `1px solid ${color}20` }}>
            {sortedTasks.map((task) => (
              <TaskItem
                key={task.id}
                projectId={projectId}
                task={task}
                color={color}
              />
            ))}

            {showAddTask && (
              <div className="flex items-center gap-2 py-2 px-2">
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

            {sortedTasks.length === 0 && !showAddTask && (
              <button
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-1.5 text-[11px] text-muted/40 hover:text-muted py-2 px-2 transition-colors"
              >
                <Plus size={10} weight="bold" />
                <span className="font-mono uppercase tracking-wider">
                  Add task
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
