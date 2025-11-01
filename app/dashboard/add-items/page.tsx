"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, Plus } from "lucide-react";

type Product = {
  _id: string;
  name: string;
  price: number;
  vat: number;
};

const STORAGE_KEY = "zestpos_items";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

/** ---------- Helpers ---------- **/
type ProductInput = {
  _id?: string | number;
  id?: string | number;
  name?: string;
  price?: number;
  vat?: number;
};

function normalizeProduct(p: ProductInput): Product {
  return {
    _id: String(p?._id ?? p?.id ?? ""), // tolerate various shapes
    name: String(p?.name ?? ""),
    price: Number(p?.price ?? 0),
    vat: Number(p?.vat ?? 0),
  };
}
function normalizeProducts(list: unknown[]): Product[] {
  if (!Array.isArray(list)) return [];
  return list.map((item) => normalizeProduct(item as ProductInput));
}

/** ---------- Component ---------- **/
export default function AddItemsPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [vat, setVat] = useState<string>("5"); // default 5%
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null); // _id string when editing
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load from localStorage (if present) on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown[];
        setProducts(normalizeProducts(parsed));
      }
    } catch (e) {
      console.warn("Failed to load products from localStorage", e);
    }
  }, []);

  // Fetch latest products from API on mount
  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/product/products`);
        if (!response.ok) {
          // don't throw to avoid noisy user errors on temporary network issues
          console.warn("Failed to fetch products from API");
          return;
        }
        const fetched = await response.json();
        // try to extract array in either { products: [...] } or raw array shape
        const fetchedArr = fetched?.products ?? fetched;
        const fetchedProducts = normalizeProducts(fetchedArr);

        if (!Array.isArray(fetchedProducts)) return;

        // preserve local temp items (temp- prefix)
        let localTemps: Product[] = [];
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as unknown[];
            localTemps = normalizeProducts(parsed).filter((p) => p._id.startsWith("temp-"));
          }
        } catch {
          // ignore
        }

        if (mounted) {
          setProducts([...fetchedProducts, ...localTemps]);
        }
      } catch (e) {
        console.warn("Failed to load products from API", e);
      }
    };

    fetchProducts();
    return () => {
      mounted = false;
    };
  }, []);

  // Persist to localStorage whenever products change
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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    const p = parseFloat(price);
    const v = parseFloat(vat);

    // EDIT flow
    if (editingId) {
      setIsSaving(true);
      const prev = products;
      // optimistic update
      setProducts((cur) =>
        cur.map((prod) => (prod._id === editingId ? { ...prod, name: name.trim(), price: p, vat: v } : prod))
      );

      try {
        const response = await fetch(
          `${API_BASE_URL}/product/update-product/${encodeURIComponent(editingId)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), price: p, vat: v }),
          }
        );
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.message ?? "Failed to update product.");
        }
        const updated = normalizeProduct(await response.json());
        setProducts((cur) => cur.map((prod) => (prod._id === editingId ? updated : prod)));
        resetForm();
      } catch (err: unknown) {
        setProducts(prev); // rollback
        setError((err as { message?: string })?.message ?? "An error occurred while updating the product.");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // CREATE flow
    setIsSaving(true);
    const tempId = `temp-${Date.now()}`;
    const newItem: Product = {
      _id: tempId,
      name: name.trim(),
      price: p,
      vat: v,
    };

    // optimistic add
    setProducts((prev) => [newItem, ...prev]);

    try {
      const response = await fetch(`${API_BASE_URL}/product/add-product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newItem.name,
          price: newItem.price,
          vat: newItem.vat,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message ?? "Failed to add product.");
      }

      // server might return either the created product or a wrapper; normalize both
      const savedRaw = await response.json();
      // savedRaw might be { product: {...} } or the product object directly
      const savedProduct = normalizeProduct(savedRaw?.product ?? savedRaw);

      // replace the temp with the saved
      setProducts((prev) => prev.map((prod) => (prod._id === tempId ? savedProduct : prod)));
      resetForm();
    } catch (err: unknown) {
      // remove temp item
      setProducts((prev) => prev.filter((prod) => prod._id !== tempId));
      setError((err as { message?: string })?.message ?? "An error occurred while saving the product.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (id: string) => {
    const prod = products.find((p) => p._id === id);
    if (!prod) return;
    setEditingId(prod._id);
    setName(prod.name);
    setPrice(String(prod.price));
    setVat(String(prod.vat));
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDeleteDialog = (id: string) => {
    setProductToDelete(id);
    setIsDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setProductToDelete(null);
    setIsDialogOpen(false);
  };

  const confirmDelete = async () => {
    console.log("Deleting product with ID:", productToDelete);
    if (!productToDelete) return;

    setIsDeleting(true);
    const prev = products;
    // optimistic remove
    setProducts((cur) => cur.filter((p) => p._id !== productToDelete));

    try {
      const response = await fetch(
        `${API_BASE_URL}/product/delete-product/${encodeURIComponent(productToDelete)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message ?? "Failed to delete product.");
      }

      closeDeleteDialog();
    } catch (err: unknown) {
      // rollback
      setProducts(prev);
      console.error("Error deleting product:", err);
      setError((err as { message?: string })?.message ?? "An error occurred while deleting the product.");
      closeDeleteDialog();
    } finally {
      setIsDeleting(false);
    }
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
            placeholder="0.000"
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
            disabled={isSaving}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isSaving ? (editingId ? "Updating..." : "Adding...") : editingId ? "Update" : "Add"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="px-4 py-2"
            onClick={resetForm}
            disabled={isSaving}
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
          <div className="overflow-x-auto bg-white rounded-md shadow-sm">
            <table className="w-full text-[14px]">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Price (OMR)</th>
                  <th className="px-4 py-2 text-left">VAT %</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((p) => (
                  <tr key={p._id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3">OMR {Number(p.price).toFixed(3)}</td>
                    <td className="px-4 py-3">{p.vat}%</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(p._id)}
                          title="Edit"
                          className="inline-flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100"
                        >
                          <Edit2 className="h-4 w-4 text-indigo-600" /> <span className="text-sm">Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteDialog(p._id)}
                          title="Delete"
                          className="inline-flex items-center gap-2 px-3 py-1 rounded hover:bg-red-100"
                          disabled={isDeleting}
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

      {/* Delete confirmation dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              Once deleted, this products information will be permanently removed from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeDeleteDialog} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
