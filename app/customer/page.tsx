"use client";

import React, { useEffect, useState } from "react";
import AddCustomerDialog from "./AddCustomerDialog";
import Loader from "@/utils/loader";
import { authApi } from "@/lib/api";

interface Customer {
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
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
    const fetchCustomers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authApi.get(`${API_BASE_URL}/customer/customers`)
        setCustomers(res.data.customers)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("Failed to load customers:", msg);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();

  }, []);

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
    // if (!phone.trim()) {
    //   setFormError("Phone is required.");
    //   return false;
    // }
    // basic phone pattern (allow +, spaces, digits)
    if (phone && !/^[0-9+\-\s()]{6,20}$/.test(phone.trim())) {
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
      phone: phone.trim() || undefined,
      contactPersonName: contactPersonName.trim() || undefined,
      email: email.trim() || undefined,
      deliveryaddress: deliveryaddress.trim() || undefined,
    };

    try {
      const res = await authApi.post(`${API_BASE_URL}/customer/add-customer`, payload);
      const createdCustomer = res.data.customer;
      if (createdCustomer) {
        setCustomers((prev) => [...prev, createdCustomer]);
        setDialogOpen(false);
      }
    } catch (err: unknown) {
      console.error("Add customer failed:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (<Loader />)
  }

  return (
    <div className="p-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Suppliers List</h1>
          <p className="text-sm text-gray-600">Add new suppliers account and view existing ones.</p>
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
            <div className="text-sm text-gray-600">{loading ? "Loading customers..." : `${customers.length} Suppliers`}</div>
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
                {/* <th className="px-4 py-3 text-left">Created</th> */}
              </tr>
            </thead>

            <tbody>
              {customers.length === 0 ? (
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
                    {/* <td className="px-4 py-3 text-sm text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "-"}</td> */}
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
