"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

/** ---------- Types ---------- **/
type ProductFromApi = {
  _id?: string;
  id?: string | number;
  name: string;
  originalPrice?: number;
  price?: number;
};

type ProductsApiResponse = ProductFromApi[] | { products: ProductFromApi[] };

/** ---------- Type Guards & Helpers ---------- **/
function isProductsArray(x: unknown): x is ProductFromApi[] {
  return Array.isArray(x) && x.every((it) => typeof (it as ProductFromApi).name === "string");
}

function isProductsWrapper(x: unknown): x is { products: unknown } {
  return typeof x === "object" && x !== null && "products" in (x as object);
}

/** Safely normalize unknown product shapes into ProductFromApi */
function normalizeApiProduct(p: unknown): ProductFromApi {
  const obj = (p as Record<string, unknown>) ?? {};

  const _id =
    typeof obj._id === "string"
      ? obj._id
      : typeof obj.id === "string"
      ? obj.id
      : typeof obj.id === "number"
      ? String(obj.id)
      : undefined;

  const name =
    typeof obj.name === "string"
      ? obj.name
      : typeof obj.product_name === "string"
      ? obj.product_name
      : "";

  const originalPrice =
    typeof obj.originalPrice === "number"
      ? obj.originalPrice
      : typeof obj.original_price === "number"
      ? obj.original_price
      : typeof obj.price === "number"
      ? obj.price
      : undefined;

  const price = typeof obj.price === "number" ? obj.price : undefined;

  return { _id, id: _id ?? (typeof obj.id === 'string' || typeof obj.id === 'number' ? obj.id : undefined), name, originalPrice, price };
}

/* Customers are still local as before */
const mockCustomers = [
  { id: 1, name: "ABC Traders" },
  { id: 2, name: "Star Beverages" },
  { id: 3, name: "Cool Drinks Mart" },
];

/* last sold mock (still used in helper line) */
const lastSoldPrices: Record<string, Record<string, number>> = {
  "ABC Traders": { "Mango Syrup": 10, "Cola Base": 9 },
  "Star Beverages": { "Orange Flavour": 7 },
};

export default function CreateBillPage() {
  const [customer, setCustomer] = useState<string | null>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [supplyDate, setSupplyDate] = useState("");

  // products list fetched from API (used in dropdown)
  const [productsList, setProductsList] = useState<ProductFromApi[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Start with one empty row by default
  const [items, setItems] = useState<
    {
      id: number;
      name: string;
      original: number;
      lastSold?: number;
      price: number;
      qty: number;
      vat: number; // percentage
    }[]
  >([
    {
      // eslint-disable-next-line react-hooks/purity
      id: Date.now(),
      name: "",
      original: 0,
      lastSold: undefined,
      price: 0,
      qty: 1,
      vat: 5,
    },
  ]);

  // fetch products from API on mount
  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      setProductsLoading(true);
      setProductsError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/product/products`);
        if (!res.ok) {
          // try to get body text or json safely
          let bodyText = `Failed to fetch products: ${res.status}`;
          try {
            const maybeJson = (await res.json()) as unknown;
            if (isProductsArray(maybeJson)) {
              // unlikely because res.ok was false, but handle gracefully
              if (!mounted) return;
              setProductsList(maybeJson.map(normalizeApiProduct));
              return;
            }
            // if json with message:
            if (typeof maybeJson === "object" && maybeJson !== null && "message" in maybeJson) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              bodyText = String((maybeJson as Record<string, unknown>).message ?? bodyText);
            }
          } catch {
            try {
              const txt = await res.text();
              if (txt) bodyText = txt;
            } catch {
              /* ignore */
            }
          }
          throw new Error(bodyText);
        }

        const payload = (await res.json()) as unknown;

        let arr: ProductFromApi[] = [];

        if (isProductsArray(payload)) {
          arr = payload.map(normalizeApiProduct);
        } else if (isProductsWrapper(payload)) {
          const maybe = (payload as { products: unknown }).products;
          if (isProductsArray(maybe)) {
            arr = maybe.map(normalizeApiProduct);
          } else {
            throw new Error("Invalid products response shape (wrapper.products not array)");
          }
        } else {
          throw new Error("Invalid products response shape");
        }

        if (!mounted) return;
        setProductsList(arr);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn("Failed to fetch products list:", errMsg);
        if (mounted) {
          setProductsError(errMsg);
          setProductsList([]); // keep empty until API returns successfully
        }
      } finally {
        if (mounted) setProductsLoading(false);
      }
    };

    fetchProducts();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: "",
        original: 0,
        lastSold: undefined,
        price: 0,
        qty: 1,
        vat: 5, // default VAT 5%
      },
    ]);
  };

  const handleItemChange = (id: number, name: string) => {
    // find product by name from fetched list
    const foundApi = productsList.find((i) => i.name === name);

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              name,
              original: foundApi?.originalPrice ?? 0,
              lastSold: customer ? lastSoldPrices[customer]?.[name] : undefined,
              // default price: last sold for that customer if available, otherwise original
              price: customer
                ? lastSoldPrices[customer]?.[name] ?? foundApi?.originalPrice ?? 0
                : foundApi?.originalPrice ?? 0,
            }
          : item
      )
    );
  };

  const handleChange = (id: number, field: string, value: unknown) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              // ensure numeric fields are converted properly
              [field]:
                field === "price" || field === "vat"
                  ? parseFloat(String(value)) || 0
                  : field === "qty"
                  ? parseInt(String(value)) || 1
                  : value,
            }
          : item
      )
    );
  };

  const handleRemove = (id: number) => {
    // prevent removing the last remaining row
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((i) => i.id !== id);
    });
  };

  // Per-item final calculation: qty * price * (1 + vat/100)
  const itemFinal = (item: { qty: number; price: number; vat: number }): number => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    const vat = Number(item.vat) || 0;
    return qty * price * (1 + vat / 100);
  };

  const total = items.reduce((sum, i) => sum + itemFinal(i), 0);

  const disableDelete = items.length === 1; // true when only one row exists

  // New: Disable Save when NO item selected (i.e., every row has empty name)
  const hasSelectedItem = items.some((i) => String(i.name || "").trim() !== "");
  const saveDisabled = !hasSelectedItem;

  const handleSaveInvoice = () => {
    if (saveDisabled) return; // guard
    const invoice = {
      customer,
      invoiceNo,
      invoiceDate,
      supplyDate,
      items,
      total,
    };
    console.log("Save invoice:", invoice);
    alert("Invoice saved (mock). Check console for payload.");
  };

  /**
   * ItemSelect subcomponent
   * - uses your Select components
   * - shows a loader message while products are loading
   * - shows an inline search box to filter the products list
   */
  function ItemSelect({
    value,
    onValueChange,
    products,
    loading,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    products: ProductFromApi[];
    loading: boolean;
  }) {
    const [query, setQuery] = useState("");
    const lower = query.trim().toLowerCase();

    const filtered =
      lower === "" ? products : products.filter((p) => String(p.name).toLowerCase().includes(lower));

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
            <div className="px-3 py-2 text-sm text-gray-500">No items match {query}</div>
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

  return (
    <div className="p-8 mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-1">Create Invoice</h1>
        <p className="text-gray-600">Enter invoice details and add items below.</p>
      </div>

      <div className="bg-transparent">
        {/* Invoice Details */}
        <div className="mb-6">
          <div className="grid sm:grid-cols-2 grid-cols-1 md:grid-cols-5 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <Select onValueChange={setCustomer}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {mockCustomers.map((cust) => (
                    <SelectItem key={cust.id} value={cust.name}>
                      {cust.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
              <Input
                type="text"
                placeholder="INV-001"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
              <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supply Date</label>
              <Input type="date" value={supplyDate} onChange={(e) => setSupplyDate(e.target.value)} />
            </div>
          </div>

          {/* Distinct divider line */}
          <div className="mt-6 border-t border-gray-200" />
        </div>

        {/* Items header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Items</h2>
          <div className="text-sm text-gray-500">Add products and set price / VAT / quantity</div>
        </div>

        {/* Items table (Original & Last Sold removed from columns) */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left w-[45%]">Item</th>
                <th className="px-3 py-2 text-left">Price (OMR)</th>
                <th className="px-3 py-2 text-left">Qty</th>
                <th className="px-3 py-2 text-left">VAT %</th>
                <th className="px-3 py-2 text-left">Final Amount</th>
                <th className="px-3 py-2 text-left"> </th>
              </tr>
            </thead>

            <tbody>
              <AnimatePresence>
                {items.map((item) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    {/* Item (select full width in first column) */}
                    <td className="px-3 py-2 align-top">
                      <div className="w-full">
                        {/* Use ItemSelect to provide search inside dropdown */}
                        <ItemSelect
                          value={item.name}
                          onValueChange={(value) => handleItemChange(item.id, value)}
                          products={productsList}
                          loading={productsLoading}
                        />

                        {/* helper line with original + last-sold below the select */}
                        <div className="mt-1 text-xs text-gray-500 flex gap-3">
                          <span>Orignal price: ₹{item.original ?? "-"}</span>
                          <span>
                            Last sold at:{" "}
                            {item.lastSold ? (
                              <span className="text-gray-700 font-medium">₹{item.lastSold}</span>
                            ) : (
                              "-"
                            )}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Price (input) */}
                    <td className="px-3 py-2 align-top">
                      <Input
                        type="number"
                        step="0.001" // Allow 3 decimal places
                        value={item.price} // Format the value to 3 decimal places
                        onChange={(e) => handleChange(item.id, "price", parseFloat(e.target.value).toFixed(3))}
                        className="w-28"
                      />
                    </td>

                    {/* Qty */}
                    <td className="px-3 py-2 align-top">
                      <Input
                        type="number"
                        min={1}
                        value={String(item.qty)}
                        onChange={(e) => handleChange(item.id, "qty", e.target.value)}
                        className="w-20"
                      />
                    </td>

                    {/* VAT % */}
                    <td className="px-3 py-2 align-top">
                      <Input
                        type="number"
                        min={0}
                        value={String(item.vat)}
                        onChange={(e) => handleChange(item.id, "vat", e.target.value)}
                        className="w-20"
                      />
                    </td>

                    {/* Final Amount */}
                    <td className="px-3 py-2 align-top font-medium">₹{itemFinal(item).toFixed(2)}</td>

                    {/* Remove */}
                    <td className="px-3 py-2 align-top">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={disableDelete}
                        onClick={() => handleRemove(item.id)}
                        aria-disabled={disableDelete}
                        title={disableDelete ? "At least one item is required" : "Remove item"}
                      >
                        <Trash2 className={`h-4 w-4 ${disableDelete ? "text-gray-300" : "text-red-500"}`} />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between mt-6">
          <Button onClick={handleAddItem} className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 text-sm">
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>

          <div className="text-lg font-semibold">
            Total: <span className="text-purple-700">₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Sticky bottom actions */}
      <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm py-3 px-4 flex justify-end gap-3 border-t mt-6">
        <Button variant="outline" className="px-6 py-2">
          Cancel
        </Button>
        <Button
          className={`px-6 py-2 ${saveDisabled ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 text-white"}`}
          onClick={handleSaveInvoice}
          disabled={saveDisabled}
          aria-disabled={saveDisabled}
          title={saveDisabled ? "Select at least one item to enable Save" : "Save invoice"}
        >
          Save Invoice
        </Button>
      </div>
    </div>
  );
}
