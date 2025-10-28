"use client";

import { useState } from "react";
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

/* Mock Data */
const mockCustomers = [
  { id: 1, name: "ABC Traders" },
  { id: 2, name: "Star Beverages" },
  { id: 3, name: "Cool Drinks Mart" },
];

const mockItems = [
  { id: 1, name: "Mango Syrup", originalPrice: 6 },
  { id: 2, name: "Cola Base", originalPrice: 8 },
  { id: 3, name: "Orange Flavour", originalPrice: 5 },
];

// last sold mock (still used in helper line)
const lastSoldPrices: Record<string, Record<string, number>> = {
  "ABC Traders": { "Mango Syrup": 10, "Cola Base": 9 },
  "Star Beverages": { "Orange Flavour": 7 },
};

export default function CreateBillPage() {
  const [customer, setCustomer] = useState<string | null>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [supplyDate, setSupplyDate] = useState("");

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
  >([]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
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
    const found = mockItems.find((i) => i.name === name);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              name,
              original: found?.originalPrice || 0,
              lastSold: customer ? lastSoldPrices[customer]?.[name] : undefined,
              // default price: last sold for that customer if available, otherwise original
              price: customer
                ? lastSoldPrices[customer]?.[name] ?? found?.originalPrice ?? 0
                : found?.originalPrice ?? 0,
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
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Per-item final calculation: qty * price * (1 + vat/100)
  const itemFinal = (item: {
    qty: number;
    price: number;
    vat: number;
  }): number => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    const vat = Number(item.vat) || 0;
    return qty * price * (1 + vat / 100);
  };

  const total = items.reduce((sum, i) => sum + itemFinal(i), 0);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-1">Create Invoice</h1>
        <p className="text-gray-600">Enter invoice details and add items below.</p>
      </div>

      <div className="bg-transparent">
        {/* Invoice Details */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number
              </label>
              <Input
                type="text"
                placeholder="INV-001"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supply Date</label>
              <Input
                type="date"
                value={supplyDate}
                onChange={(e) => setSupplyDate(e.target.value)}
              />
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
                <th className="px-3 py-2 text-left">Price</th>
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
                        <Select
                          value={item.name}
                          onValueChange={(value) => handleItemChange(item.id, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockItems.map((i) => (
                              <SelectItem key={i.id} value={i.name}>
                                {i.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

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
                        value={String(item.price ?? "")}
                        onChange={(e) => handleChange(item.id, "price", e.target.value)}
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
                    <td className="px-3 py-2 align-top font-medium">
                      ₹{itemFinal(item).toFixed(2)}
                    </td>

                    {/* Remove */}
                    <td className="px-3 py-2 align-top">
                      <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
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
          <Button
            onClick={handleAddItem}
            className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 text-sm"
          >
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
        <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2">
          Save Invoice
        </Button>
      </div>
    </div>
  );
}
