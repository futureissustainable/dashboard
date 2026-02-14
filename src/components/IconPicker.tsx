"use client";

import { useEffect, useCallback } from "react";
import { PROJECT_ICONS } from "@/lib/constants";
import { X } from "@phosphor-icons/react";

interface IconPickerProps {
  currentIcon: string;
  color: string;
  onSelect: (iconName: string) => void;
  onClose: () => void;
}

export default function IconPicker({
  currentIcon,
  color,
  onSelect,
  onClose,
}: IconPickerProps) {
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
            Select Icon
          </span>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground p-1 -mr-1 transition-colors duration-100"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
        <div className="grid grid-cols-6 gap-1 p-4">
          {PROJECT_ICONS.map((icon) => {
            const IconComp = icon.component;
            const isActive = icon.name === currentIcon;
            return (
              <button
                key={icon.name}
                onClick={() => {
                  onSelect(icon.name);
                  onClose();
                }}
                className={`flex items-center justify-center p-3 border transition-all duration-100 ${
                  isActive
                    ? "border-foreground/40"
                    : "border-transparent hover:border-border hover:bg-hover"
                }`}
                style={isActive ? { backgroundColor: color + "18" } : {}}
                title={icon.name}
              >
                <IconComp
                  size={20}
                  weight={isActive ? "fill" : "bold"}
                  color={isActive ? color : "#555"}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
