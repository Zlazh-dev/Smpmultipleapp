"use client";

import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface OpsFilterBarProps {
  placeholder?: string;
  value?: string;
  onSearch?: (value: string) => void;
  children?: React.ReactNode; // filter chips, dropdowns, etc.
  className?: string;
}

export function OpsFilterBar({
  placeholder = "Cari...",
  value: controlledValue,
  onSearch,
  children,
  className,
}: OpsFilterBarProps) {
  const [internalValue, setInternalValue] = useState("");
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (v: string) => {
    if (controlledValue === undefined) setInternalValue(v);
    onSearch?.(v);
  };

  return (
    <div className={cn("flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4", className)}>
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full h-9 rounded-lg border border-border/50 bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
        />
        {value && (
          <button
            onClick={() => handleChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}
