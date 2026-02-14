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
  const dotSize = size === "sm" ? "w-[5px] h-[5px]" : "w-[7px] h-[7px]";
  const gap = size === "sm" ? "gap-[3px]" : "gap-[4px]";

  const cyclePriority = () => {
    if (!onChangePriority) return;
    const next = priority === 1 ? 2 : priority === 2 ? 3 : 1;
    onChangePriority(next as Priority);
  };

  return (
    <button
      onClick={cyclePriority}
      className={`flex items-center ${gap} ${onChangePriority ? "cursor-pointer hover:opacity-70" : "cursor-default"}`}
      title={`Priority ${priority} — click to cycle`}
      type="button"
    >
      {Array.from({ length: priority }).map((_, i) => (
        <span
          key={i}
          className={`${dotSize} rounded-full`}
          style={{ backgroundColor: color }}
        />
      ))}
    </button>
  );
}
