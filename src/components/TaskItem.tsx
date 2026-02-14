"use client";

import { useState, useRef } from "react";
import { useStore, type Task, type Priority } from "@/store/useStore";
import {
  CaretRight,
  Plus,
  Trash,
  Check,
} from "@phosphor-icons/react";
import PriorityDots from "./PriorityDots";
import SubTaskItem from "./SubTaskItem";

interface TaskItemProps {
  projectId: string;
  task: Task;
  color: string;
}

export default function TaskItem({ projectId, task, color }: TaskItemProps) {
  const { updateTask, deleteTask, addSubTask } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [newSubTask, setNewSubTask] = useState("");
  const [showSubInput, setShowSubInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddSubTask = () => {
    if (!newSubTask.trim()) return;
    addSubTask(projectId, task.id, newSubTask.trim());
    setNewSubTask("");
    inputRef.current?.focus();
  };

  const completedCount = task.subtasks.filter((s) => s.completed).length;
  const totalSubs = task.subtasks.length;

  return (
    <div className="border-b border-border/40 last:border-b-0">
      {/* Header row */}
      <div
        className="flex items-center gap-3 py-3 px-1 cursor-pointer group hover:bg-hover/50 transition-colors duration-100"
        onClick={() => setExpanded(!expanded)}
      >
        <CaretRight
          size={12}
          weight="bold"
          className={`text-muted flex-shrink-0 transition-transform duration-200 ${
            expanded ? "rotate-90" : ""
          }`}
        />

        {/* Completion checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateTask(projectId, task.id, { completed: !task.completed });
          }}
          className="flex-shrink-0 w-4 h-4 border flex items-center justify-center transition-colors duration-100"
          style={{
            borderColor: task.completed ? color : "#444",
            backgroundColor: task.completed ? color : "transparent",
          }}
        >
          {task.completed && <Check size={10} weight="bold" color="#000" />}
        </button>

        <span
          className={`text-[14px] flex-1 ${
            task.completed
              ? "line-through text-muted"
              : "text-foreground"
          }`}
        >
          {task.title}
        </span>

        {/* Sub-task count badge */}
        {totalSubs > 0 && (
          <span
            className="text-[10px] font-mono px-1.5 py-0.5"
            style={{
              color: color,
              border: `1px solid ${color}44`,
            }}
          >
            {completedCount}/{totalSubs}
          </span>
        )}

        {/* Priority dots */}
        <div onClick={(e) => e.stopPropagation()}>
          <PriorityDots
            priority={task.priority}
            color={color}
            onChangePriority={(p: Priority) =>
              updateTask(projectId, task.id, { priority: p })
            }
          />
        </div>

        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTask(projectId, task.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-muted hover:text-foreground transition-opacity duration-100"
        >
          <Trash size={13} weight="bold" />
        </button>
      </div>

      {/* Accordion body */}
      <div
        className={`accordion-content ${expanded ? "expanded" : "collapsed"}`}
      >
        <div className="pl-10 pr-2 pb-3 space-y-1">
          {/* Description */}
          <textarea
            value={task.description}
            onChange={(e) =>
              updateTask(projectId, task.id, { description: e.target.value })
            }
            placeholder="Add notes..."
            className="w-full text-[12px] text-muted resize-none bg-transparent border-none focus:text-foreground/70 leading-relaxed min-h-[24px]"
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = target.scrollHeight + "px";
            }}
          />

          {/* Subtasks list */}
          {task.subtasks.map((sub) => (
            <SubTaskItem
              key={sub.id}
              projectId={projectId}
              taskId={task.id}
              subtask={sub}
              color={color}
            />
          ))}

          {/* Add subtask */}
          {showSubInput ? (
            <div className="flex items-center gap-2 pt-1">
              <input
                ref={inputRef}
                type="text"
                value={newSubTask}
                onChange={(e) => setNewSubTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSubTask();
                  if (e.key === "Escape") {
                    setShowSubInput(false);
                    setNewSubTask("");
                  }
                }}
                placeholder="Sub-task..."
                className="flex-1 text-[12px] border-b border-border/50 py-1 focus:border-foreground/30"
                autoFocus
              />
              <button
                onClick={handleAddSubTask}
                className="text-[10px] font-mono uppercase tracking-wider text-muted hover:text-foreground"
              >
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSubInput(true)}
              className="flex items-center gap-1.5 text-[11px] text-muted hover:text-foreground pt-1 font-mono uppercase tracking-wider"
            >
              <Plus size={10} weight="bold" />
              Sub-task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
