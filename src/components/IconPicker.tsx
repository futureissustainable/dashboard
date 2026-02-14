"use client";

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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div
        className="border border-border bg-surface-elevated p-6 w-[360px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
            Select Icon
          </span>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={16} weight="bold" />
          </button>
        </div>
        <div className="grid grid-cols-6 gap-2">
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
                className={`flex items-center justify-center p-2.5 border transition-colors duration-100 ${
                  isActive
                    ? "border-foreground"
                    : "border-transparent hover:border-border"
                }`}
                style={isActive ? { backgroundColor: color + "22" } : {}}
                title={icon.name}
              >
                <IconComp
                  size={20}
                  weight="bold"
                  color={isActive ? color : "#888"}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
