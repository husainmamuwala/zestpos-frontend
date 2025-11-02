import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { ProductFromApi, Customer, Item } from "./types";

export function useCreateBillState() {
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

  const [items, setItems] = useState<Item[]>([
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
        // Optionally handle error
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
        vat: 5,
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

  const itemFinal = (item: { qty: number; price: number; vat: number }): number => {
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

  return {
    customer,
    setCustomer,
    invoiceNo,
    setInvoiceNo,
    invoiceDate,
    setInvoiceDate,
    supplyDate,
    setSupplyDate,
    productsList,
    productsLoading,
    productsError,
    customers,
    filteredCustomers,
    searchQuery,
    setSearchQuery,
    selectedCustomer,
    setSelectedCustomer,
    items,
    setItems,
    handleSearch,
    handleCustomerSelect,
    handleAddItem,
    handleItemChange,
    handleChange,
    handleRemove,
    itemFinal,
    total,
    disableDelete,
    hasSelectedItem,
    saveDisabled,
    handleSaveInvoice,
  };
}

// Types for use in the hook and page
export type { ProductFromApi, Customer, Item };