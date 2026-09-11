import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  placeholder?: string;
  label?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  helperText?: string;
};

export function SearchInput({
  placeholder = "Search...",
  label = "Search",
  className,
  value = "",
  onChange,
  disabled = false,
  helperText,
}: SearchInputProps) {
  return (
    <div className={cn(className)}>
      <label htmlFor="search-input" className="sr-only">{label}</label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="search-input"
          type="search"
          placeholder={placeholder}
          className="pl-9"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          disabled={disabled}
        />
      </div>
      {helperText ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}
