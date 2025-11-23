"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type ProductFromApi = {
  _id?: string;
  id?: string | number;
  name: string;
  originalPrice?: number;
  price?: number;
  vat?: number;
};

export function ItemSelect({
  value,
  onValueChange,
  products,
  loading,
  productsError,
}: {
  value: string;
  onValueChange: (v: string) => void;
  products: ProductFromApi[];
  loading: boolean;
  productsError?: string | null;
}) {
  const [query, setQuery] = useState("");
  const lower = query.trim().toLowerCase();

  const filtered =
    lower === ""
      ? products
      : products.filter((p) => String(p.name).toLowerCase().includes(lower));

  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // open and focus the input, then reset list scroll to top to keep the search at top
  const openAndFocusInput = (seedQuery?: string) => {
    // seed first char if present
    if (typeof seedQuery !== "undefined") {
      setQuery((prev) => (prev === "" ? seedQuery : prev + seedQuery));
    }

    setOpen(true);

    // wait for the dropdown to mount, then focus input without scrolling and reset list scroll
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          inputRef.current?.focus?.({ preventScroll: true });
        } catch {
          inputRef.current?.focus?.();
        }

        // reset the list scroll so the search stays visible even if a SelectItem was auto-focused
        // run after microtask to let any default focus/scroll happen first
        setTimeout(() => {
          if (listRef.current) {
            listRef.current.scrollTop = 0;
          }
        }, 0);
      });
    });
  };

  // handle typing when the trigger (select button) is focused
  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      openAndFocusInput(e.key);
    }
  };

  // prevent mousedown focus jump from mouse click on the trigger
  const onTriggerMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.button === 0) {
      e.preventDefault();
      if (!open) openAndFocusInput();
      else setOpen(false);
    }
  };

  // keep control if Select provides external open-change props
  const onOpenChange = (next: boolean) => {
    setOpen(next);
  };

  // prevent key presses inside the input from bubbling to the SelectTrigger (avoid duplicate handling)
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  return (
    <Select value={value} onValueChange={onValueChange} open={open} onOpenChange={onOpenChange}>
      <SelectTrigger
        className="w-full"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={triggerRef as any}
        onKeyDown={onTriggerKeyDown}
        onMouseDown={onTriggerMouseDown}
        aria-expanded={open}
      >
        <SelectValue placeholder={loading ? "Loading items..." : "Select item"} />
      </SelectTrigger>

      {/* dropdown: fixed max height, search header sticky, list scrollable */}
      <SelectContent className="w-[min(28rem,100%)] overflow-hidden max-h-60">
        {/* sticky search header */}
        <div className="sticky top-0 z-20 bg-white border-b px-3 py-2">
          <Input
            placeholder={loading ? "Loading..." : "Search items..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full"
            disabled={loading}
            ref={inputRef}
            inputMode="search"
            autoComplete="off"
            onKeyDown={onInputKeyDown}
          />
        </div>
        {/* scrollable list area */}
        <div ref={listRef} className="overflow-auto max-h-[calc(15rem)]">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading products…</div>
          ) : products.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              {productsError ? `Failed to load products` : "No products available"}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No items match {query}</div>
          ) : (
            filtered.map((p) => (
              <SelectItem key={String(p._id ?? p.id ?? p.name)} value={p.name}>
                {p.name}
              </SelectItem>
            ))
          )}
        </div>
      </SelectContent>
    </Select>
  );
}
