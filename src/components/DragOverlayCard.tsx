"use client";

import { type Priority } from "@/store/useStore";

interface DragOverlayCardProps {
  title: string;
  color: string;
  priority: Priority;
  subtaskCount: number;
}

export default function DragOverlayCard({
  title,
  color,
  priority,
  subtaskCount,
}: DragOverlayCardProps) {
  return (
    <div
      className="bg-surface-elevated border border-border px-4 py-3 w-[280px] shadow-2xl shadow-black/50 cursor-grabbing"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-[13px] text-foreground truncate flex-1">
          {title}
        </span>

        <div className="flex items-center gap-1 flex-shrink-0">
          {Array.from({ length: priority }).map((_, i) => (
            <span
              key={i}
              className="w-[5px] h-[5px] rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {subtaskCount > 0 && (
        <span
          className="text-[10px] font-mono mt-1.5 inline-block tabular-nums"
          style={{ color: color + "aa" }}
        >
          {subtaskCount} sub-task{subtaskCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
