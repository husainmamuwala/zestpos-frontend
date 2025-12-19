/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
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
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

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

        setTimeout(() => {
          if (listRef.current) {
            listRef.current.scrollTop = 0;
          }
        }, 0);
      });
    });
  };

  // keep input focused when dropdown is open
  useEffect(() => {
    if (!open) return;
    try {
      inputRef.current?.focus?.({ preventScroll: true });
    } catch {
      inputRef.current?.focus?.();
    }
  }, [open]);

  // reset highlight when filtered changes (or when opening)
  useEffect(() => {
    if (!open) {
      setHighlightedIndex(null);
      return;
    }
    if (filtered.length > 0) {
      setHighlightedIndex(0);
      // ensure first item visible
      requestAnimationFrame(() => {
        const el = listRef.current?.querySelector<HTMLElement>(`[data-index="0"]`);
        if (el) el.scrollIntoView({ block: "nearest" });
      });
    } else {
      setHighlightedIndex(null);
    }
  }, [filtered.length, open]);

  // scroll highlighted item into view
  const scrollHighlightIntoView = (index: number | null) => {
    if (index === null) return;
    requestAnimationFrame(() => {
      const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`);
      if (el) el.scrollIntoView({ block: "nearest" });
    });
  };

  // when input loses focus while dropdown is still open, re-focus it (preserve caret)
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!open) return;
    setTimeout(() => {
      if (open) {
        try {
          inputRef.current?.focus?.({ preventScroll: true });
        } catch {
          inputRef.current?.focus?.();
        }
      }
    }, 0);
  };

  // keyboard handling inside input: keep keys local and manage highlight/select
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();

    if (loading) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filtered.length === 0) return;
      setHighlightedIndex((prev) => {
        const next = prev === null ? 0 : Math.min(filtered.length - 1, prev + 1);
        scrollHighlightIntoView(next);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filtered.length === 0) return;
      setHighlightedIndex((prev) => {
        const next = prev === null ? filtered.length - 1 : Math.max(0, prev - 1);
        scrollHighlightIntoView(next);
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex !== null && filtered[highlightedIndex]) {
        const picked = filtered[highlightedIndex];
        onValueChange(String(picked.name));
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  // handle typing when the trigger (select button) is focused
  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      openAndFocusInput(e.key);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      openAndFocusInput();
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

  const onOpenChange = (next: boolean) => {
    setOpen(next);
  };

  // clicking/hovering a list item
  const handleMouseEnterItem = (index: number) => {
    setHighlightedIndex(index);
  };

  const handleClickItem = (index: number) => {
    const picked = filtered[index];
    if (picked) {
      onValueChange(String(picked.name));
      setOpen(false);
    }
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
      <SelectContent className="w-full overflow-hidden max-h-80">
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
            onBlur={handleInputBlur}
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
            filtered.map((p, idx) => {
              const isActive = highlightedIndex === idx;
              // `data-index` helps scrolling into view
              return (
                <div
                  key={String(p._id ?? p.id ?? p.name)}
                  data-index={idx}
                  onMouseEnter={() => handleMouseEnterItem(idx)}
                  onClick={() => handleClickItem(idx)}
                >
                  {/* Using SelectItem for a11y - we still wrap it in a div for hover/active */}
                  <SelectItem
                    value={p.name}
                    className={`flex items-center px-3 py-2 cursor-pointer ${
                      isActive ? "bg-gray-100 text-black" : "bg-white text-gray-700"
                    }`}
                  >
                    {p.name}Price: OMR{p.price}
                  </SelectItem>
                </div>
              );
            })
          )}
        </div>
      </SelectContent>
    </Select>
  );
}
