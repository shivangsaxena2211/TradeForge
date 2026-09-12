"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Input } from "@/components/ui/input";

export function TopbarSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();

    if (trimmed) {
      router.push(`/markets?search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/markets");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="hidden min-w-0 flex-1 max-w-xs md:block lg:max-w-sm"
      role="search"
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search stocks..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-8 border-border/50 bg-card/60 pl-8 text-xs"
          aria-label="Search stocks"
        />
      </div>
    </form>
  );
}
