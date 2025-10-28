"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, Plus } from "lucide-react";

type Product = {
  id: number;
  name: string;
  price: number;
  vat: number; // percentage
};

const STORAGE_KEY = "zestpos_items";

export default function AddItemsPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [vat, setVat] = useState<string>("5"); // default 5%
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsedProducts = JSON.parse(raw);
        setTimeout(() => {
          setProducts((prev) => [...prev, ...parsedProducts]);
        }, 0);
      }
    } catch (e) {
      console.warn("Failed to load products from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
      console.warn("Failed to save products to localStorage", e);
    }
  }, [products]);

  const resetForm = () => {
    setName("");
    setPrice("");
    setVat("5");
    setEditingId(null);
    setError(null);
  };

  const validate = () => {
    if (!name.trim()) {
      setError("Product name is required.");
      return false;
    }
    const p = parseFloat(price);
    if (Number.isNaN(p) || p <= 0) {
      setError("Price must be a number greater than 0.");
      return false;
    }
    const v = parseFloat(vat);
    if (Number.isNaN(v) || v < 0) {
      setError("VAT must be a valid non-negative number.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    const p = parseFloat(price);
    const v = parseFloat(vat);

    if (editingId) {
      setProducts((prev) =>
        prev.map((prod) =>
          prod.id === editingId ? { ...prod, name: name.trim(), price: p, vat: v } : prod
        )
      );
    } else {
      const newItem: Product = {
        id: Date.now(),
        name: name.trim(),
        price: p,
        vat: v,
      };
      setProducts((prev) => [newItem, ...prev]);
    }

    resetForm();
  };

  const handleEdit = (id: number) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;
    setEditingId(prod.id);
    setName(prod.name);
    setPrice(String(prod.price));
    setVat(String(prod.vat));
    setError(null);
    // scroll to top of form if necessary (optional)
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this product?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) resetForm();
  };

  return (
    <div className="p-10 mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Add / Manage Products</h1>
        <p className="text-sm text-gray-600">Create products used in billing. VAT defaults to 5%.</p>
      </header>

      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-6"
        aria-label="Add product form"
      >
        <div className="md:col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Product name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mango Syrup"
            aria-label="Product name"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            aria-label="Product price"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">VAT %</label>
          <Input
            value={vat}
            onChange={(e) => setVat(e.target.value)}
            placeholder="5"
            inputMode="numeric"
            aria-label="VAT percent"
          />
        </div>

        <div className="md:col-span-2 flex gap-2">
          <Button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {editingId ? "Update" : "Add"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="px-4 py-2"
            onClick={resetForm}
          >
            Reset
          </Button>
        </div>

        {error && (
          <div className="md:col-span-12 text-sm text-red-600" role="alert">
            {error}
          </div>
        )}
      </form>

      <section>
        <h2 className="text-lg font-medium text-gray-800 mb-3">Products</h2>

        {products.length === 0 ? (
          <div className="text-sm text-gray-500">No products added yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm bg-white">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Price (₹)</th>
                  <th className="px-3 py-2 text-left">VAT %</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2">₹{p.price.toFixed(2)}</td>
                    <td className="px-3 py-2">{p.vat}%</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(p.id)}
                          title="Edit"
                          className="inline-flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100"
                        >
                          <Edit2 className="h-4 w-4 text-indigo-600" /> <span className="text-sm">Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          title="Delete"
                          className="inline-flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" /> <span className="text-sm">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
