"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import AddCustomerDialog from "./AddCustomerDialog";

type Customer = {
  _id?: string;
  id?: string | number;
  name: string;
  address: string;
  phone: string;
  contactPersonName?: string;
  email?: string;
  deliveryaddress?: string;
  createdAt?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  // form state (match your schema)
  const [name, setName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [contactPersonName, setContactPersonName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [deliveryaddress, setDeliveryaddress] = useState<string>("");

  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch customers on mount
  useEffect(() => {
    let mounted = true;
    const fetchCustomers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/customer/customers`);
        if (!res.ok) {
          // try to extract message safely
          let msg = `Failed to fetch customers (${res.status})`;
          try {
            const json = (await res.json()) as unknown;
            if (json && typeof json === "object" && "message" in (json as Record<string, unknown>)) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              msg = String((json as Record<string, unknown>).message ?? msg);
            }
          } catch {
            // ignore
          }
          throw new Error(msg);
        }

        const payload = (await res.json()) as unknown;

        if (Array.isArray(payload)) {
          if (!mounted) return;
          setCustomers(payload.map(normalizeCustomer));
        } else if (payload && typeof payload === "object" && "customers" in payload) {
          const arr = (payload as Record<string, unknown>).customers;
          if (Array.isArray(arr)) {
            if (!mounted) return;
            setCustomers(arr.map(normalizeCustomer));
          } else {
            throw new Error("Invalid customers response shape");
          }
        } else {
          throw new Error("Invalid customers response shape");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (mounted) setError(msg);
        console.warn("Failed to load customers:", msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCustomers();
    return () => {
      mounted = false;
    };
  }, []);

  // normalize unknown payload to Customer shape (no `any`)
  function normalizeCustomer(input: unknown): Customer {
    const obj = (input as Record<string, unknown>) ?? {};

    const _id =
      typeof obj._id === "string"
        ? obj._id
        : typeof obj.id === "string"
        ? obj.id
        : typeof obj.id === "number"
        ? String(obj.id)
        : undefined;

    const nameVal = typeof obj.name === "string" ? obj.name : "";
    const addressVal = typeof obj.address === "string" ? obj.address : "";
    const phoneVal = typeof obj.phone === "string" ? obj.phone : "";
    const contactPersonNameVal = typeof obj.contactPersonName === "string" ? obj.contactPersonName : "";
    const emailVal = typeof obj.email === "string" ? obj.email : "";
    const deliveryaddressVal = typeof obj.deliveryaddress === "string" ? obj.deliveryaddress : "";
    const createdAtVal = typeof obj.createdAt === "string" ? obj.createdAt : undefined;

    return {
      _id,
      name: nameVal,
      address: addressVal,
      phone: phoneVal,
      contactPersonName: contactPersonNameVal,
      email: emailVal,
      deliveryaddress: deliveryaddressVal,
      createdAt: createdAtVal,
    };
  }

  const closeAddDialog = () => {
    setDialogOpen(false);
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setFormError("Name is required.");
      return false;
    }
    if (!address.trim()) {
      setFormError("Address is required.");
      return false;
    }
    if (!phone.trim()) {
      setFormError("Phone is required.");
      return false;
    }
    // basic phone pattern (allow +, spaces, digits)
    if (!/^[0-9+\-\s()]{6,20}$/.test(phone.trim())) {
      setFormError("Enter a valid phone number (6–20 digits, may include +, -, spaces).");
      return false;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setFormError("Enter a valid email address.");
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleAddCustomer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setFormError(null);

    const payload = {
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      contactPersonName: contactPersonName.trim() || undefined,
      email: email.trim() || undefined,
      deliveryaddress: deliveryaddress.trim() || undefined,
    };

    // optimistic UI
    const tempId = `temp-${Date.now()}`;
    const optimistic: Customer = {
      _id: tempId,
      name: payload.name,
      address: payload.address,
      phone: payload.phone,
      contactPersonName: payload.contactPersonName,
      email: payload.email,
      deliveryaddress: payload.deliveryaddress,
    };

    setCustomers((prev) => [optimistic, ...prev]);

    try {
      const res = await fetch(`${API_BASE_URL}/customer/add-customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // try to get server message
        let msg = `Failed to add customer (${res.status})`;
        try {
          const json = (await res.json()) as unknown;
          if (json && typeof json === "object" && "message" in (json as Record<string, unknown>)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            msg = String((json as Record<string, unknown>).message ?? msg);
          }
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      const created = (await res.json()) as unknown;

      // server may return created object or wrapper { customer: {...} }
      let createdCustomer: Customer | null = null;
      if (Array.isArray(created)) {
        createdCustomer = created.length > 0 ? normalizeCustomer(created[0]) : null;
      } else if (created && typeof created === "object") {
        const asObj = created as Record<string, unknown>;
        if ("customer" in asObj && asObj.customer) {
          createdCustomer = normalizeCustomer(asObj.customer);
        } else {
          createdCustomer = normalizeCustomer(created);
        }
      }

      if (createdCustomer) {
        setCustomers((prev) => prev.map((c) => (c._id === tempId ? createdCustomer! : c)));
        setDialogOpen(false);
      } else {
        // rollback
        setCustomers((prev) => prev.filter((c) => c._id !== tempId));
        setFormError("Server returned invalid customer object.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCustomers((prev) => prev.filter((c) => c._id !== tempId));
      setFormError(msg);
      console.error("Add customer failed:", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Account Ledgers</h1>
          <p className="text-sm text-gray-600">Add new account ledger and view existing ones.</p>
        </div>

        <div className="flex items-center gap-3">
          <AddCustomerDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            name={name}
            setName={setName}
            address={address}
            setAddress={setAddress}
            phone={phone}
            setPhone={setPhone}
            contactPersonName={contactPersonName}
            setContactPersonName={setContactPersonName}
            email={email}
            setEmail={setEmail}
            deliveryaddress={deliveryaddress}
            setDeliveryaddress={setDeliveryaddress}
            formError={formError}
            saving={saving}
            onSubmit={handleAddCustomer}
            onCancel={closeAddDialog}
          />
        </div>
      </div>

      <section className="bg-white rounded-md shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">{loading ? "Loading customers..." : `${customers.length} customers`}</div>
            <div>{error && <div className="text-sm text-red-600">{error}</div>}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-left">Contact Person</th>
                <th className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id ?? `${c.name}-${Math.random()}`} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                    <td className="px-4 py-3">{c.phone ?? "-"}</td>
                    <td className="px-4 py-3">{c.email ?? "-"}</td>
                    <td className="px-4 py-3">{c.address ?? "-"}</td>
                    <td className="px-4 py-3">{c.contactPersonName ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
