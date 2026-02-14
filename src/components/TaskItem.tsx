"use client";

import { useState, useRef, useCallback } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useStore, type Task, type Priority } from "@/store/useStore";
import {
  CaretRight,
  Plus,
  Trash,
  Check,
} from "@phosphor-icons/react";
import PriorityDots from "./PriorityDots";
import SubTaskItem from "./SubTaskItem";
import type { TaskDragData, TaskDropData } from "./DndProvider";

interface TaskItemProps {
  projectId: string;
  task: Task;
  color: string;
}

export default function TaskItem({ projectId, task, color }: TaskItemProps) {
  const { updateTask, deleteTask, addSubTask } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [newSubTask, setNewSubTask] = useState("");
  const [showSubInput, setShowSubInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      if (node && task.description) {
        node.style.height = "auto";
        node.style.height = node.scrollHeight + "px";
      }
    },
    [task.description]
  );

  // ── Draggable ──
  const dragData: TaskDragData = {
    type: "task",
    task,
    sourceProjectId: projectId,
    color,
  };

  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: `task-drag-${task.id}`,
    data: dragData,
  });

  // ── Droppable (drop ON this task = convert to subtask) ──
  const dropData: TaskDropData = {
    type: "task",
    projectId,
    taskId: task.id,
  };

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `task-drop-${task.id}`,
    data: dropData,
  });

  const handleAddSubTask = () => {
    if (!newSubTask.trim()) return;
    addSubTask(projectId, task.id, newSubTask.trim());
    setNewSubTask("");
    inputRef.current?.focus();
  };

  const handleRename = () => {
    if (editTitle.trim() && editTitle.trim() !== task.title) {
      updateTask(projectId, task.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const completedCount = task.subtasks.filter((s) => s.completed).length;
  const totalSubs = task.subtasks.length;

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      className={`group/task transition-all duration-150 ${
        isDragging ? "opacity-30" : ""
      } ${isOver ? "drop-target-task" : ""}`}
    >
      {/* Header row — entire row is draggable */}
      <div
        className="flex items-center gap-1.5 py-2.5 px-1 -mx-1 cursor-grab active:cursor-grabbing rounded-sm hover:bg-hover transition-colors duration-100 touch-none"
        onClick={() => setExpanded(!expanded)}
        {...dragListeners}
        {...dragAttributes}
      >
        <CaretRight
          size={11}
          weight="bold"
          className={`text-muted/60 flex-shrink-0 transition-transform duration-200 ${
            expanded ? "rotate-90" : ""
          }`}
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            updateTask(projectId, task.id, { completed: !task.completed });
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex-shrink-0 w-[15px] h-[15px] border flex items-center justify-center transition-all duration-150"
          style={{
            borderColor: task.completed ? color : "#333",
            backgroundColor: task.completed ? color : "transparent",
          }}
        >
          {task.completed && <Check size={9} weight="bold" color="#000" />}
        </button>

        {isEditing ? (
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setEditTitle(task.title);
                setIsEditing(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-[13px] sm:text-[14px] leading-snug flex-1 min-w-0 border-b border-border py-0.5 cursor-text"
            autoFocus
          />
        ) : (
          <span
            className={`text-[13px] sm:text-[14px] leading-snug flex-1 min-w-0 truncate transition-colors duration-150 ${
              task.completed
                ? "line-through text-muted"
                : "text-foreground"
            }`}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditTitle(task.title);
              setIsEditing(true);
            }}
            title="Double-click to rename"
          >
            {task.title}
          </span>
        )}

        {/* Sub-task count */}
        {totalSubs > 0 && (
          <span
            className="flex-shrink-0 text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-sm"
            style={{
              color,
              backgroundColor: color + "12",
            }}
          >
            {completedCount}/{totalSubs}
          </span>
        )}

        {/* Priority */}
        <div
          className="flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
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
          onPointerDown={(e) => e.stopPropagation()}
          className="flex-shrink-0 opacity-0 group-hover/task:opacity-100 text-muted hover:text-foreground transition-opacity duration-100 p-1"
        >
          <Trash size={12} weight="bold" />
        </button>
      </div>

      {/* Drop indicator line */}
      {isOver && (
        <div
          className="h-[2px] mx-1 -mt-0.5 mb-0.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}

      {/* Accordion body — CSS grid trick */}
      <div className={`accordion-wrapper ${expanded ? "open" : ""}`}>
        <div className="accordion-inner">
          <div className="pl-[36px] pr-2 pb-3 space-y-0.5">
            {/* Notes */}
            <textarea
              ref={textareaRef}
              value={task.description}
              onChange={(e) =>
                updateTask(projectId, task.id, {
                  description: e.target.value,
                })
              }
              placeholder="Add notes..."
              className="w-full text-[12px] text-muted/80 resize-none bg-transparent leading-relaxed min-h-[28px] py-1 focus:text-foreground-secondary placeholder:text-muted/40"
              rows={1}
              onClick={(e) => e.stopPropagation()}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = target.scrollHeight + "px";
              }}
            />

            {/* Subtasks */}
            {task.subtasks.length > 0 && (
              <div className="pt-1 space-y-0">
                {task.subtasks.map((sub) => (
                  <SubTaskItem
                    key={sub.id}
                    projectId={projectId}
                    taskId={task.id}
                    subtask={sub}
                    color={color}
                  />
                ))}
              </div>
            )}

            {/* Add subtask */}
            {showSubInput ? (
              <div className="flex items-center gap-2 pt-2">
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
                  placeholder="Sub-task title..."
                  className="flex-1 text-[12px] border-b border-border py-1.5 focus:border-muted"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowSubInput(false);
                    setNewSubTask("");
                  }}
                  className="text-muted hover:text-foreground p-1"
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider">
                    Esc
                  </span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSubInput(true)}
                className="flex items-center gap-1.5 text-[11px] text-muted/50 hover:text-muted pt-2 transition-colors duration-100"
              >
                <Plus size={10} weight="bold" />
                <span className="font-mono uppercase tracking-wider">
                  Sub-task
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border-light mx-1" />
    </div>
  );
}
