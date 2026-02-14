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
    <div className="group flex items-center gap-3 py-2 px-1 -mx-1 rounded-sm hover:bg-hover transition-colors duration-100">
      <button
        onClick={() => toggleSubTask(projectId, taskId, subtask.id)}
        className="flex-shrink-0 w-4 h-4 border flex items-center justify-center transition-all duration-150"
        style={{
          borderColor: subtask.completed ? color : "#333",
          backgroundColor: subtask.completed ? color : "transparent",
        }}
      >
        {subtask.completed && (
          <Check size={10} weight="bold" color="#000" />
        )}
      </button>
      <span
        className={`text-[13px] leading-snug flex-1 transition-colors duration-150 ${
          subtask.completed
            ? "line-through text-muted"
            : "text-foreground-secondary"
        }`}
      >
        {subtask.title}
      </span>
      <button
        onClick={() => deleteSubTask(projectId, taskId, subtask.id)}
        className="opacity-0 group-hover:opacity-100 text-muted hover:text-foreground transition-opacity duration-100 p-1"
      >
        <X size={11} weight="bold" />
      </button>
    </div>
  );
}
