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
import { authApi } from "@/lib/api";
import { ItemSelect } from "@/app/components/ItemSelect";

type ProductFromApi = {
  _id?: string;
  id?: string | number;
  name: string;
  originalPrice?: number;
  price?: number;
  vat?: number;
};

type Customer = {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
};

export default function CreateBillPage() {
  const [customer, setCustomer] = useState<string | null>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [supplyDate, setSupplyDate] = useState("");

  const [productsList, setProductsList] = useState<ProductFromApi[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");

  const [items, setItems] = useState<
    {
      id: number;
      name: string;
      original: number;
      lastSold?: number;
      price: number;
      qty: number;
      vat: number;
    }[]
  >([
    {
      id: Date.now(),
      name: "",
      original: 0,
      lastSold: undefined,
      price: 0,
      qty: 1,
      vat: 5,
    },
  ]);

  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      setProductsError(null);
      try {
        const res = await authApi.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product/products`);
        setProductsList(res.data.products);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn("Failed to fetch products list:", errMsg);
        setProductsError(errMsg);
        setProductsList([]);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await authApi.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customer/customers`);
        setCustomers(res.data.customers);
        setFilteredCustomers(res.data.customers);
      } catch (err: unknown) {
        console.warn("Error fetching customers:", err);
      }
    };
    fetchCustomers();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = customers.filter((cust) =>
      cust.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCustomers(filtered);
  };

  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomer(custId);
    const found = customers.find((c) => c._id === custId);
    setCustomer(found ? found.name : null);
  };

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
    const foundApi = productsList.find((i) => i.name === name);

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
            ...item,
            name,
            original: foundApi?.originalPrice ?? 0,
            lastSold: undefined,
            price: foundApi?.originalPrice ?? 0,
            vat: typeof foundApi?.vat === "number" ? foundApi.vat : item.vat,
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
            [field]:
              field === "price" || field === "vat"
                ? (() => {
                  const n = Number(value);
                  return Number.isFinite(n) ? n : 0;
                })()
                : field === "qty"
                  ? (() => {
                    const n = parseInt(String(value), 10);
                    return Number.isFinite(n) ? n : 1;
                  })()
                  : value,
          }
          : item
      )
    );
  };

  const handleRemove = (id: number) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((i) => i.id !== id);
    });
  };

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

  const disableDelete = items.length === 1;

  const hasSelectedItem = items.some((i) => String(i.name || "").trim() !== "");
  const saveDisabled = !hasSelectedItem;

  const handleSaveInvoice = () => {
    if (saveDisabled) return;
    alert("Invoice saved (mock). Check console for payload.");
  };

  return (
    <div className="p-8 mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-1">
          Create Invoice
        </h1>
        <p className="text-gray-600">
          Enter invoice details and add items below.
        </p>
      </div>

      <div className="bg-transparent">
        {/* Invoice Details */}
        <div className="mb-6">
          <div className="grid sm:grid-cols-2 grid-cols-1 md:grid-cols-5 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer
              </label>
              <Select
                onValueChange={handleCustomerSelect}
                value={selectedCustomer}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Search and select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {/* Search Input */}
                  <div className="p-2">
                    <Input
                      type="text"
                      placeholder="Search customers..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  {/* Customer List */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCustomers.slice(0, 50).map((cust) => (
                      <SelectItem key={cust._id} value={cust._id}>
                        {cust.name}
                        <span className="">{cust.address ? ` - ${cust.address}` : ""}</span>
                      </SelectItem>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <div className="p-2 text-sm text-gray-500">
                        No customers found
                      </div>
                    )}
                  </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date
              </label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supply Date
              </label>
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
          <div className="text-sm text-gray-500">
            Add products and set price / VAT / quantity
          </div>
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
                        <ItemSelect
                          value={item.name}
                          onValueChange={(value: string) =>
                            handleItemChange(item.id, value)
                          }
                          products={productsList}
                          loading={productsLoading}
                          productsError={productsError}
                        />

                        {/* helper line with original + last-sold below the select */}
                        <div className="mt-1 text-xs text-gray-500 flex gap-3">
                          <span>Orignal price: ₹{item.original ?? "-"}</span>
                          <span>
                            Last sold at:{" "}
                            {item.lastSold ? (
                              <span className="text-gray-700 font-medium">
                                ₹{item.lastSold}
                              </span>
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
                        value={String(item.price)}
                        onChange={(e) =>
                          handleChange(item.id, "price", e.target.value)
                        }
                        className="w-28"
                      />
                    </td>

                    {/* Qty */}
                    <td className="px-3 py-2 align-top">
                      <Input
                        type="number"
                        min={1}
                        value={String(item.qty)}
                        onChange={(e) =>
                          handleChange(item.id, "qty", e.target.value)
                        }
                        className="w-20"
                      />
                    </td>

                    {/* VAT % */}
                    <td className="px-3 py-2 align-top">
                      <Input
                        type="number"
                        min={0}
                        value={String(item.vat ?? "")}
                        onChange={(e) =>
                          handleChange(item.id, "vat", e.target.value)
                        }
                        className="w-20"
                      />
                    </td>

                    {/* Final Amount */}
                    <td className="px-3 py-2 align-top font-medium">
                      ₹{itemFinal(item).toFixed(2)}
                    </td>

                    {/* Remove */}
                    <td className="px-3 py-2 align-top">
                      <Button
                        className="cursor-pointer"
                        variant="ghost"
                        size="icon"
                        disabled={disableDelete}
                        onClick={() => handleRemove(item.id)}
                        aria-disabled={disableDelete}
                        title={
                          disableDelete
                            ? "At least one item is required"
                            : "Remove item"
                        }
                      >
                        <Trash2
                          className={`h-4 w-4 ${disableDelete ? "text-gray-300" : "text-red-500"
                            }`}
                        />
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
            className="bg-purple-600 cursor-pointer text-white hover:bg-purple-700 px-4 py-2 text-sm"
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
        <Button
          className={`px-6 py-2 ${saveDisabled
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          onClick={handleSaveInvoice}
          disabled={saveDisabled}
          aria-disabled={saveDisabled}
          title={
            saveDisabled
              ? "Select at least one item to enable Save"
              : "Save invoice"
          }
        >
          Save Invoice
        </Button>
      </div>
    </div>
  );
}
