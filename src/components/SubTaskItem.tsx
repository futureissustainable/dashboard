"use client";

import { useStore, type SubTask } from "@/store/useStore";
import { X, Check } from "@phosphor-icons/react";

interface SubTaskItemProps {
  projectId: string;
  taskId: string;
  subtask: SubTask;
  color: string;
}

export default function SubTaskItem({
  projectId,
  taskId,
  subtask,
  color,
}: SubTaskItemProps) {
  const { toggleSubTask, deleteSubTask } = useStore();

  return (
    <div className="group flex items-center gap-3 py-1.5">
      <button
        onClick={() => toggleSubTask(projectId, taskId, subtask.id)}
        className="flex-shrink-0 w-3.5 h-3.5 border flex items-center justify-center transition-colors duration-100"
        style={{
          borderColor: subtask.completed ? color : "#555",
          backgroundColor: subtask.completed ? color : "transparent",
        }}
      >
        {subtask.completed && (
          <Check size={9} weight="bold" color="#000" />
        )}
      </button>
      <span
        className={`text-[13px] flex-1 ${
          subtask.completed ? "line-through text-muted" : "text-foreground/80"
        }`}
      >
        {subtask.title}
      </span>
      <button
        onClick={() => deleteSubTask(projectId, taskId, subtask.id)}
        className="opacity-0 group-hover:opacity-100 text-muted hover:text-foreground transition-opacity duration-100"
      >
        <X size={12} weight="bold" />
      </button>
    </div>
  );
}
