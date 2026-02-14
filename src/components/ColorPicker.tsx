"use client";

import { useEffect, useCallback } from "react";
import { PROJECT_COLORS } from "@/lib/constants";
import { X, Check } from "@phosphor-icons/react";

interface ColorPickerProps {
  currentColor: string;
  onSelect: (color: { name: string; bg: string; text: string }) => void;
  onClose: () => void;
}

export default function ColorPicker({
  currentColor,
  onSelect,
  onClose,
}: ColorPickerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="modal-content border border-border bg-surface-elevated w-full max-w-[360px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="font-mono text-[12px] uppercase tracking-[0.15em] text-muted">
            Select Color
          </span>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground p-1 -mr-1 transition-colors duration-100"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
        <div className="grid grid-cols-5 gap-2 p-4">
          {PROJECT_COLORS.map((c) => {
            const isActive = c.bg === currentColor;
            return (
              <button
                key={c.name}
                onClick={() => {
                  onSelect(c);
                  onClose();
                }}
                className="group relative flex items-center justify-center aspect-square border transition-all duration-100"
                style={{
                  backgroundColor: c.bg,
                  borderColor: isActive ? "#fff" : c.bg,
                }}
                title={c.name}
              >
                {isActive && (
                  <Check size={14} weight="bold" color="#fff" />
                )}
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono uppercase tracking-wider text-muted/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}
