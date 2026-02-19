"use client";

interface WorkflowColumnProps {
  title: string;
  icon?: React.ReactNode;
  count: number;
  index: number;
  children: React.ReactNode;
  emptyMessage: string;
  className?: string;
}

export default function WorkflowColumn({
  title,
  icon,
  count,
  index,
  children,
  emptyMessage,
  className = "",
}: WorkflowColumnProps) {
  return (
    <div
      className={`column-enter border border-border bg-surface flex flex-col max-h-[calc(100vh-100px)] sm:max-h-[calc(100vh-140px)] ${className}`}
      style={{ animationDelay: `${index * 80}ms`, flex: "1 1 0", minWidth: "340px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
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

/**
 * Section divider within a column — separates pending from completed items
 */
export function ColumnSection({
  label,
  count,
  muted,
}: {
  label: string;
  count?: number;
  muted?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 pt-3 pb-1 ${muted ? "opacity-50" : ""}`}>
      <span className="flex-1 border-t border-border" />
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted whitespace-nowrap">
        {label}
        {count !== undefined && count > 0 && (
          <span className="tabular-nums ml-1">({count})</span>
        )}
      </span>
      <span className="flex-1 border-t border-border" />
    </div>
  );
}
