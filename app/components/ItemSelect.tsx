"use client";

import { useState } from "react";
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

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? "Loading items..." : "Select item"} />
      </SelectTrigger>

      <SelectContent>
        {/* Search input inside dropdown — doesn't alter outer UI */}
        <div className="px-3 py-2">
          <Input
            placeholder={loading ? "Loading..." : "Search items..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full"
            disabled={loading}
          />
        </div>

        {/* loading / empty / list */}
        {loading ? (
          <div className="px-3 py-2 text-sm text-gray-500">Loading products…</div>
        ) : products.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500">
            {productsError ? `Failed to load products` : "No products available"}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500">
            No items match {query}
          </div>
        ) : (
          filtered.map((p) => (
            <SelectItem key={String(p._id ?? p.id ?? p.name)} value={p.name}>
              {p.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}