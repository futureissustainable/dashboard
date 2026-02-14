"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useStore, type Task } from "@/store/useStore";
import DragOverlayCard from "./DragOverlayCard";

// Drag data attached to draggable items
export interface TaskDragData {
  type: "task";
  task: Task;
  sourceProjectId: string;
  color: string;
}

// Drop data attached to droppable targets
export interface ProjectDropData {
  type: "project";
  projectId: string;
}
export interface FolderDropData {
  type: "folder";
  projectId: string;
  folderId: string;
}
export interface TaskDropData {
  type: "task";
  projectId: string;
  taskId: string;
}

export type DropData = ProjectDropData | FolderDropData | TaskDropData;

export default function DndProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { moveTask, convertToSubTask } = useStore();
  const [activeTask, setActiveTask] = useState<{
    task: Task;
    color: string;
  } | null>(null);
  // 150ms delay — the perceptual sweet spot.
  // Fast enough to feel instant, slow enough to not trigger on clicks.
  // Also requires 3px of movement tolerance to prevent jitter-triggers.
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      delay: 150,
      tolerance: 4,
    },
  });

  const sensors = useSensors(pointerSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as TaskDragData | undefined;
    if (data?.type === "task") {
      setActiveTask({ task: data.task, color: data.color });
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);

      const { active, over } = event;
      if (!over) return;

      const dragData = active.data.current as TaskDragData | undefined;
      const dropData = over.data.current as DropData | undefined;
      if (!dragData || !dropData || dragData.type !== "task") return;

      const { task, sourceProjectId } = dragData;

      switch (dropData.type) {
        case "project":
          moveTask(
            sourceProjectId,
            task.id,
            dropData.projectId,
            null
          );
          break;
        case "folder":
          moveTask(
            sourceProjectId,
            task.id,
            dropData.projectId,
            dropData.folderId
          );
          break;
        case "task":
          // Don't drop on self
          if (task.id !== dropData.taskId) {
            convertToSubTask(
              sourceProjectId,
              task.id,
              dropData.projectId,
              dropData.taskId
            );
          }
          break;
      }
    },
    [moveTask, convertToSubTask]
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <DragOverlayCard
            title={activeTask.task.title}
            color={activeTask.color}
            priority={activeTask.task.priority}
            subtaskCount={activeTask.task.subtasks.length}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

