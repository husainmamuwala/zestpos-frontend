import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";
import { ProductFromApi, Customer, Item } from "./types";
import { useInvoice } from "../invoice-table/useInvoice";

const STORAGE_KEY = "zestpos_create_bill_state";

interface StoredState {
    customer: string | null;
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
    const { handleDownload } = useInvoice();
    const [customer, setCustomer] = useState<string | null>(savedState.customer ?? null);
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
                qty: 0,
                vat: 5,
            },
        ]
    );
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

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
        if (!productsList || productsList.length === 0) return;

        // Only reset items whose product name no longer exists in the fetched products.
        setItems((prevItems) => {
            let changed = false;
            const cleaned = prevItems.map((item) => {
                const nameStr = String(item.name || "").trim();
                if (nameStr === "") return item;
                // case-insensitive existence check
                const exists = productsList.some((p) => p.name.toLowerCase() === nameStr.toLowerCase());
                if (!exists) {
                    changed = true;
                    return {
                        ...item,
                        name: "",
                        price: 0,
                        vat: 5,
                    };
                }
                return item;
            });

            if (changed) {
                // persist cleaned items to localStorage
                saveStateToStorage({ items: cleaned });
                return cleaned;
            }
            return prevItems;
        });
    }, [productsList]);

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
                    qty: 0,
                    vat: 5,
                },
            ];
            saveStateToStorage({ items: newItems });
            return newItems;
        });
    };

    const handleItemChange = (id: number, name: string) => {
        const foundApi = productsList.find((i) => i.name.toLowerCase() === name.toLowerCase());
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
                                        return Number.isFinite(n) ? n : 0;
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
    const saveDisabled = !hasSelectedItem || !selectedCustomer || !invoiceDate || !supplyDate;

    const handleSaveInvoice = async () => {
        if (saveDisabled) return;
        setSaving(true);
        setSaveError(null);

        try {
            const today = new Date().toISOString().slice(0, 10);
            const payload = {
                customerId: selectedCustomer,
                invoiceDate: invoiceDate || today,
                supplyDate: supplyDate || today,
                items: items.map((it) => ({
                    itemName: it.name,
                    price: Number(it.price) || 0,
                    qty: Number(it.qty) || 0,
                    vat: Number(it.vat) || 0,
                })),
            };

            // Use authApi which has baseURL set and attaches token if present
            const res = await authApi.post(`/invoice/create`, payload);
            if (res.data.invoice) {
                handleDownload(res.data.invoice);
                toast.success("Invoice PDF downloaded successfully");
            }

            // On success, clear persisted state and reset local state
            try {
                if (typeof window !== "undefined") {
                    localStorage.removeItem(STORAGE_KEY);
                }
            } catch (e) {
                // ignore
            }

            setItems([
                {
                    id: Date.now(),
                    name: "",
                    price: 0,
                    qty: 1,
                    vat: 5,
                },
            ]);
            setSelectedCustomer("");
            setCustomer(null);
            setInvoiceDate("");
            setSupplyDate("");

            // notify success
            try {
                const successMsg = res?.data?.message || "Invoice created successfully";
                toast.success(successMsg);
            } catch (e) {
                // ignore
            }

            return res.data;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setSaveError(msg);
            console.error("Error saving invoice:", err);
            toast.error(msg || "Error saving invoice");
            throw err;
        } finally {
            setSaving(false);
        }
    };

    // Extra guard: persist items whenever items array changes.
    useEffect(() => {
        saveStateToStorage({ items });
    }, [items]);

    return {
        customer,
        setCustomer,
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
        saving,
        saveError,
    };
}