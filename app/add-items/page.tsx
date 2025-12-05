"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
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
    _id: String(p?._id ?? p?.id ?? ""),
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
  /* products list & top-level states */
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false); // delete dialog
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ADD modal state (new)
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false);
  const [addName, setAddName] = useState<string>("");
  const [addPrice, setAddPrice] = useState<string>("0.000");
  const [addVat, setAddVat] = useState<string>("5");
  const [addError, setAddError] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState<boolean>(false);

  // EDIT modal state (existing)
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editPrice, setEditPrice] = useState<string>("0.000");
  const [editVat, setEditVat] = useState<string>("0");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState<boolean>(false);

  // Search + pagination
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 10;

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
          console.warn("Failed to fetch products from API");
          return;
        }
        const fetched = await response.json();
        const fetchedArr = fetched?.products ?? fetched;
        const fetchedProducts = normalizeProducts(Array.isArray(fetchedArr) ? fetchedArr : []);
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
          setPage(1);
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

  /* ---------- ADD Modal handlers ---------- */
  const openAddDialog = () => {
    setAddError(null);
    setAddName("");
    setAddPrice("0.000");
    setAddVat("5");
    setAddDialogOpen(true);
  };
  const closeAddDialog = () => {
    setAddDialogOpen(false);
    setAddError(null);
  };

  const validateAdd = (): boolean => {
    if (!addName.trim()) {
      setAddError("Product name is required.");
      return false;
    }
    const p = parseFloat(addPrice);
    if (Number.isNaN(p) || p <= 0) {
      setAddError("Price must be a number greater than 0.");
      return false;
    }
    const v = parseFloat(addVat);
    if (Number.isNaN(v) || v < 0) {
      setAddError("VAT must be a valid non-negative number.");
      return false;
    }
    setAddError(null);
    return true;
  };

  const handleAddSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateAdd()) return;

    setAddSaving(true);
    const tempId = `temp-${Date.now()}`;
    const p = parseFloat(addPrice);
    const v = parseFloat(addVat);
    const newItem: Product = {
      _id: tempId,
      name: addName.trim(),
      price: p,
      vat: v,
    };

    // optimistic add
    setProducts((prev) => [newItem, ...prev]);
    setPage(1); // show newest on first page

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

      const savedRaw = await response.json();
      const savedProduct = normalizeProduct(savedRaw?.product ?? savedRaw);

      // replace the temp with the saved
      setProducts((prev) => prev.map((prod) => (prod._id === tempId ? savedProduct : prod)));
      closeAddDialog();
    } catch (err: unknown) {
      // remove temp item
      setProducts((prev) => prev.filter((prod) => prod._id !== tempId));
      setAddError((err as { message?: string })?.message ?? "An error occurred while saving the product.");
    } finally {
      setAddSaving(false);
    }
  };

  /* ---------- DELETE ---------- */
  const openDeleteDialog = (id: string) => {
    setProductToDelete(id);
    setIsDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setProductToDelete(null);
    setIsDialogOpen(false);
  };

  const confirmDelete = async () => {
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

      // if current page became empty after deletion, go back a page
      setTimeout(() => {
        const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
        if (page > totalPages) setPage(totalPages);
      }, 0);
    } catch (err: unknown) {
      setProducts(prev);
      setError((err as { message?: string })?.message ?? "An error occurred while deleting the product.");
      closeDeleteDialog();
    } finally {
      setIsDeleting(false);
    }
  };

  /* ---------- EDIT MODAL ---------- */
  const openEditDialog = (id: string) => {
    const prod = products.find((p) => p._id === id);
    if (!prod) return;
    setEditProduct(prod);
    setEditName(prod.name);
    setEditPrice(prod.price?.toFixed(3) ?? "0.000");
    setEditVat(String(prod.vat ?? 0));
    setEditError(null);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditProduct(null);
    setEditError(null);
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editProduct) return;

    // basic validation
    if (!editName.trim()) {
      setEditError("Product name is required.");
      return;
    }
    const p = parseFloat(editPrice);
    if (Number.isNaN(p) || p <= 0) {
      setEditError("Price must be a number greater than 0.");
      return;
    }
    const v = parseFloat(editVat);
    if (Number.isNaN(v) || v < 0) {
      setEditError("VAT must be a valid non-negative number.");
      return;
    }

    setEditSaving(true);
    const prev = products;
    // optimistic update
    setProducts((cur) => cur.map((prod) => (prod._id === editProduct._id ? { ...prod, name: editName.trim(), price: p, vat: v } : prod)));

    try {
      const response = await fetch(
        `${API_BASE_URL}/product/update-product/${encodeURIComponent(editProduct._id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editName.trim(), price: p, vat: v }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message ?? "Failed to update product.");
      }

      const updatedRaw = await response.json();
      const updatedProduct = normalizeProduct(updatedRaw?.product ?? updatedRaw);

      setProducts((cur) => cur.map((prod) => (prod._id === updatedProduct._id ? updatedProduct : prod)));
      closeEditDialog();
    } catch (err: unknown) {
      // rollback
      setProducts(prev);
      setEditError((err as { message?: string })?.message ?? "An error occurred while updating the product.");
    } finally {
      setEditSaving(false);
    }
  };

  /* ---------- Search & Pagination logic ---------- */
  // filtered list based on searchQuery
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));

  // ensure page is within bounds when filteredProducts changes
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // current page slice
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageSlice = filteredProducts.slice(pageStart, pageStart + PAGE_SIZE);

  const handleSearchChange = (v: string) => {
    setSearchQuery(v);
    setPage(1);
  };

  const gotoPage = (n: number) => {
    const pg = Math.min(Math.max(1, n), totalPages);
    setPage(pg);
  };

  /* ---------- Render ---------- */
  return (
    <div className="p-10 mx-auto">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Add / Manage Products</h1>
          <p className="text-sm text-gray-600">Create products used in billing.</p>
        </div>

        {/* Right-side controls: search + add product button */}
        <div className="flex items-center gap-3">
          <div className="w-64">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#800080] hover:bg-[#660066] text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Product</DialogTitle>
                <DialogDescription>Fill product details and click Add.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddSubmit} className="grid grid-cols-1 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product name</label>
                  <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. Mango Syrup" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <Input value={addPrice} onChange={(e) => setAddPrice(e.target.value)} placeholder="0.000" inputMode="decimal" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VAT %</label>
                  <Input value={addVat} onChange={(e) => setAddVat(e.target.value)} placeholder="5" inputMode="numeric" />
                </div>

                {addError && <div className="text-sm text-red-600">{addError}</div>}

                <DialogFooter className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={closeAddDialog} disabled={addSaving}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#800080] hover:bg-[#660066] text-white" disabled={addSaving}>
                    {addSaving ? "Adding..." : "Add"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <section>
        <h2 className="text-lg font-medium text-gray-800 mb-3">Products</h2>

        {products.length === 0 ? (
          <div className="text-sm text-gray-500">No products added yet.</div>
        ) : (
          <>
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
                  {pageSlice.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                        No products match your search.
                      </td>
                    </tr>
                  ) : (
                    pageSlice.map((p) => (
                      <tr key={p._id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="px-4 py-3">{p.name}</td>
                        <td className="px-4 py-3">OMR {Number(p.price).toFixed(3)}</td>
                        <td className="px-4 py-3">{p.vat}%</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditDialog(p._id)}
                              title="Edit"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded hover:bg-[#9811fa]/10"
                            >
                              <Edit2 className="h-4 w-4 text-[#800080]" /> <span className="text-sm">Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteDialog(p._id)}
                              title="Delete"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded hover:bg-red-100"
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" /> <span className="text-sm">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Showing <strong>{Math.min(pageStart + 1, filteredProducts.length || 0)}</strong> to{" "}
                <strong>{Math.min(pageStart + PAGE_SIZE, filteredProducts.length)}</strong> of{" "}
                <strong>{filteredProducts.length}</strong> products
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => gotoPage(page - 1)}
                  disabled={page <= 1}
                >
                  Prev
                </Button>

                {/* show a small range of pages around current page */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((pNum) => {
                      // show only pages near current to avoid huge list: current +-2, first and last
                      if (totalPages <= 7) return true;
                      if (pNum === 1 || pNum === totalPages) return true;
                      if (Math.abs(pNum - page) <= 2) return true;
                      return false;
                    })
                    .map((pNum, idx, arr) => {
                      const isGap =
                        idx > 0 && arr[idx - 1] + 1 !== pNum; // detect gap to show ellipsis
                      return (
                        <React.Fragment key={pNum}>
                          {isGap && <span className="px-2">…</span>}
                          <Button
                            size="sm"
                            variant={pNum === page ? undefined : "outline"}
                            onClick={() => gotoPage(pNum)}
                            aria-current={pNum === page ? "page" : undefined}
                            className={pNum === page ? "bg-[#800080]" : ""}
                          >
                            {pNum}
                          </Button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => gotoPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Edit product dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Change details and click Update to save.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="grid grid-cols-1 gap-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Product name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <Input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} placeholder="0.000" inputMode="decimal" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VAT %</label>
              <Input value={editVat} onChange={(e) => setEditVat(e.target.value)} placeholder="5" inputMode="numeric" />
            </div>

            {editError && <div className="text-sm text-red-600">{editError}</div>}

            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={closeEditDialog} disabled={editSaving}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#800080] hover:bg-[#660066] text-white" disabled={editSaving}>
                {editSaving ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
