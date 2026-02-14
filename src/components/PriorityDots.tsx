"use client";

import { type Priority } from "@/store/useStore";

interface PriorityDotsProps {
  priority: Priority;
  color?: string;
  onChangePriority?: (priority: Priority) => void;
  size?: "sm" | "md";
}

export default function PriorityDots({
  priority,
  color = "#FFFFFF",
  onChangePriority,
  size = "sm",
}: PriorityDotsProps) {
  const dotSize = size === "sm" ? 5 : 7;
  const gap = size === "sm" ? 3 : 4;
  const padX = size === "sm" ? 6 : 8;
  const padY = size === "sm" ? 4 : 5;

  const cyclePriority = () => {
    if (!onChangePriority) return;
    const next = priority === 1 ? 2 : priority === 2 ? 3 : 1;
    onChangePriority(next as Priority);
  };

  return (
    <button
      onClick={cyclePriority}
      className={`inline-flex items-center rounded-full transition-opacity duration-100 ${
        onChangePriority
          ? "cursor-pointer hover:opacity-70 active:opacity-50"
          : "cursor-default"
      }`}
      style={{
        gap: `${gap}px`,
        padding: `${padY}px ${padX}px`,
        backgroundColor: color + "12",
      }}
      title={`Priority ${priority} — click to cycle`}
      type="button"
    >
      {Array.from({ length: priority }).map((_, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            backgroundColor: color,
          }}
        />
      ))}
    </button>
  );
}
