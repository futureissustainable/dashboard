"use client";

import { useState } from "react";
import { useStore, type Task, type Folder } from "@/store/useStore";
import {
  FolderSimple,
  CaretRight,
  Trash,
  Plus,
} from "@phosphor-icons/react";
import TaskItem from "./TaskItem";

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
    <div className="mt-2">
      {/* Folder header */}
      <div
        className="flex items-center gap-2 py-2 px-1 cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <CaretRight
          size={10}
          weight="bold"
          className={`text-muted transition-transform duration-200 ${
            expanded ? "rotate-90" : ""
          }`}
        />
        <FolderSimple size={14} weight="bold" style={{ color }} />

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
            className="text-[11px] font-mono uppercase tracking-[0.12em] border-b border-border py-0.5"
            autoFocus
          />
        ) : (
          <span
            className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            {folder.name}
          </span>
        )}

        <span className="text-[10px] font-mono text-muted/50">
          {tasks.length}
        </span>

        <div className="flex-1" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowAddTask(true);
            setExpanded(true);
          }}
          className="opacity-0 group-hover:opacity-100 text-muted hover:text-foreground transition-opacity duration-100"
        >
          <Plus size={12} weight="bold" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteFolder(projectId, folder.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-muted hover:text-foreground transition-opacity duration-100"
        >
          <Trash size={12} weight="bold" />
        </button>
      </div>

      {/* Folder contents */}
      <div
        className={`accordion-content ${expanded ? "expanded" : "collapsed"}`}
      >
        <div className="pl-4 border-l border-border/30 ml-2">
          {sortedTasks.map((task) => (
            <TaskItem
              key={task.id}
              projectId={projectId}
              task={task}
              color={color}
            />
          ))}

          {showAddTask && (
            <div className="flex items-center gap-2 py-2 px-1">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
