"use client";

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
import { ItemSelect } from "@/app/components/ItemSelect";
import { useCreateBillState } from "./useCreateBillState";

export default function CreateBillPage() {
  const {
    invoiceDate,
    setInvoiceDate,
    supplyDate,
    setSupplyDate,
    productsList,
    productsLoading,
    productsError,
    filteredCustomers,
    searchQuery,
    handleSearch,
    selectedCustomer,
    handleCustomerSelect,
    items,
    handleAddItem,
    handleItemChange,
    handleChange,
    handleRemove,
    itemFinal,
    total,
    disableDelete,
    saveDisabled,
    handleSaveInvoice,
  } = useCreateBillState();

  return (
    <div className="">
      <div
        className="mx-auto overflow-auto h-screen"
      >
        {/* Header */}
        <div className="p-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">Create Invoice</h1>
          <p className="text-gray-600">Enter invoice details and add items below.</p>
        </div>
        <div className="bg-transparent mb-6 px-8">
          <div className="grid sm:grid-cols-2 grid-cols-1 md:grid-cols-5 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <Select onValueChange={handleCustomerSelect} value={selectedCustomer}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Search and select a customer" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      type="text"
                      placeholder="Search customers..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCustomers.slice(0, 50).map((cust) => (
                      <SelectItem key={cust._id} value={cust._id}>
                        {cust.name}
                        <span className="">{cust.address ? ` - ${cust.address}` : ""}</span>
                      </SelectItem>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <div className="p-2 text-sm text-gray-500">No customers found</div>
                    )}
                  </div>
                </SelectContent>
              </Select>
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

          <div className="mt-6 border-t border-gray-200" />
        </div>

        {/* Items header */}
        <div className="flex items-center justify-between mb-3 px-8">
          <h2 className="text-lg font-semibold text-gray-800">Items</h2>
          <div className="text-sm text-gray-500">Add products and set price / VAT / quantity</div>
        </div>

        <div className="overflow-x-auto px-8">
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
                    <td className="px-3 py-2 align-top">
                      <div className="w-full">
                        <ItemSelect
                          value={item.name}
                          onValueChange={(value: string) => handleItemChange(item.id, value)}
                          products={productsList}
                          loading={productsLoading}
                          productsError={productsError}
                        />
                      </div>
                    </td>

                    {/* Price (input) — unchanged from your previous code */}
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
                        step="0.001"
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
                        onChange={(e) => handleChange(item.id, "vat", e.target.value)}
                        className="w-20"
                      />
                    </td>

                    {/* Final Amount */}
                    <td className="px-3 py-2 align-top font-medium">₹{itemFinal(item).toFixed(2)}</td>

                    {/* Remove */}
                    <td className="px-3 py-2 align-top">
                      <Button
                        className="cursor-pointer"
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

        <div className="flex items-center justify-between mt-6 px-8">
          <Button onClick={handleAddItem} className="bg-purple-600 cursor-pointer text-white hover:bg-purple-700 px-4 py-2 text-sm">
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
          <div />
        </div>
        <div
          className="sticky bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t px-4 py-4 mt-8 flex items-center justify-between gap-3"
          style={{ zIndex: 30 }}
        >
          <div className="flex items-center gap-3">
            <Button variant="outline" className="px-6 py-2">
              Cancel
            </Button>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-lg font-semibold">
              Total: <span className="text-purple-700">₹{total.toFixed(2)}</span>
            </div>

            <div>
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
        </div>
      </div>
    </div>
  );
}
