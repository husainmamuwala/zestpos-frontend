import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { ProductFromApi, Customer, Item } from "./types";

const STORAGE_KEY = "zestpos_create_bill_state";

interface StoredState {
  customer: string | null;
  invoiceNo: string;
  invoiceDate: string;
  supplyDate: string;
  items: Item[];
  selectedCustomer: string;
}

const loadStateFromStorage = (): Partial<StoredState> => {
  if (typeof window === "undefined") return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error loading state from localStorage:", error);
    return {};
  }
};

export function useCreateBillState() {
  const savedState = loadStateFromStorage();
  const [customer, setCustomer] = useState<string | null>(savedState.customer ?? null);
  const [invoiceNo, setInvoiceNo] = useState(savedState.invoiceNo ?? "");
  const [invoiceDate, setInvoiceDate] = useState(savedState.invoiceDate ?? "");
  const [supplyDate, setSupplyDate] = useState(savedState.supplyDate ?? "");

  const [productsList, setProductsList] = useState<ProductFromApi[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>(savedState.selectedCustomer ?? "");

  const [items, setItems] = useState<Item[]>(
    savedState.items ?? [
      {
        id: Date.now(),
        name: "",
        price: 0,
        qty: 1,
        vat: 5,
      },
    ]
  );

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

  const saveStateToStorage = (newState: Partial<StoredState>) => {
    if (typeof window === "undefined") return;

    try {
      const currentState = loadStateFromStorage();
      const updatedState = { ...currentState, ...newState };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
    } catch (error) {
      console.error("Error saving state to localStorage:", error);
    }
  };

  const handleCustomerSelect = (custId: string) => {
    const found = customers.find((c) => c._id === custId);
    const newCustomerName = found ? found.name : null;
    
    setSelectedCustomer(custId);
    setCustomer(newCustomerName);
    saveStateToStorage({
      selectedCustomer: custId,
      customer: newCustomerName,
    });
  };

  const handleAddItem = () => {
    setItems((prev) => {
      const newItems = [
        ...prev,
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          name: "",
          price: 0,
          qty: 1,
          vat: 5,
        },
      ];
      saveStateToStorage({ items: newItems });
      return newItems;
    });
  };

  const handleItemChange = (id: number, name: string) => {
    const foundApi = productsList.find((i) => i.name === name);
    setItems((prev) => {
      const newItems = prev.map((item) =>
        item.id === id
          ? {
              ...item,
              name,
              price: foundApi?.price ?? 0,
              vat: typeof foundApi?.vat === "number" ? foundApi.vat : item.vat,
            }
          : item
      );
      saveStateToStorage({ items: newItems });
      return newItems;
    });
  };

  const handleChange = (id: number, field: string, value: unknown) => {
    setItems((prev) => {
      const newItems = prev.map((item) =>
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
      );
      saveStateToStorage({ items: newItems });
      return newItems;
    });
  };

  const handleRemove = (id: number) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      const newItems = prev.filter((i) => i.id !== id);
      saveStateToStorage({ items: newItems });
      return newItems;
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
    // Clear storage after successful save
    localStorage.removeItem(STORAGE_KEY);
  };

  // Wrap state setters to save to localStorage
  const wrappedSetInvoiceNo = (value: string) => {
    setInvoiceNo(value);
    saveStateToStorage({ invoiceNo: value });
  };

  const wrappedSetInvoiceDate = (value: string) => {
    setInvoiceDate(value);
    saveStateToStorage({ invoiceDate: value });
  };

  const wrappedSetSupplyDate = (value: string) => {
    setSupplyDate(value);
    saveStateToStorage({ supplyDate: value });
  };

  // Clear storage after successful save
  const handleSaveAndClearStorage = () => {
    if (saveDisabled) return;
    handleSaveInvoice();
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    customer,
    setCustomer,
    invoiceNo,
    setInvoiceNo: wrappedSetInvoiceNo,
    invoiceDate,
    setInvoiceDate: wrappedSetInvoiceDate,
    supplyDate,
    setSupplyDate: wrappedSetSupplyDate,
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