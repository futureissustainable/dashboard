"use client";

interface WorkflowColumnProps {
  title: string;
  accent: "yellow" | "green" | "blue";
  count: number;
  index: number;
  children: React.ReactNode;
  emptyMessage: string;
  showPulse?: boolean;
  className?: string;
}

const ACCENT_STYLES = {
  yellow: {
    border: "border-t-yellow-400",
    text: "text-yellow-400",
    pulse: "bg-yellow-400",
  },
  green: {
    border: "border-t-green-400",
    text: "text-green-400",
    pulse: "bg-green-400",
  },
  blue: {
    border: "border-t-blue-400",
    text: "text-blue-400",
    pulse: "bg-blue-400",
  },
};

export default function WorkflowColumn({
  title,
  accent,
  count,
  index,
  children,
  emptyMessage,
  showPulse,
  className = "",
}: WorkflowColumnProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div
      className={`column-enter border border-border bg-surface flex flex-col max-h-[calc(100vh-100px)] sm:max-h-[calc(100vh-140px)] ${styles.border} border-t-2 ${className}`}
      style={{ animationDelay: `${index * 80}ms`, flex: "1 1 0", minWidth: "300px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          {showPulse && count > 0 && (
            <span className={`w-1.5 h-1.5 ${styles.pulse} animate-pulse flex-shrink-0`} />
          )}
          <span className={`font-mono text-[11px] font-bold uppercase tracking-wider ${styles.text}`}>
            {title}
          </span>
        </div>
        <span className="font-mono text-[10px] text-muted tabular-nums">
          {count}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {count === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-[11px] font-mono text-muted">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
