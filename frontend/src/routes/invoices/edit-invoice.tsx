import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";

export default function EditInvoiceRoute() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [allDescriptions, setAllDescriptions] = useState<string[]>([]);
    const [showSuggestionsIndex, setShowSuggestionsIndex] = useState<number | null>(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    useEffect(() => {
        if (invoiceId) {
            api.get(`/invoices/${invoiceId}`)
                .then((res) => {
                    setInvoice(res.data);
                    setItems(res.data.items || []);
                })
                .catch((err) => console.error("Error loading invoice", err))
                .finally(() => setLoading(false));
        }
    }, [invoiceId]);

    const fetchDescriptions = async (query: string) => {
        if (!query.trim()) return setAllDescriptions([]);
        try {
            const res = await api.get("/line-items/descriptions", {
                params: { q: encodeURIComponent(query) },
            });
            const data = res.data;
            if (Array.isArray(data)) setAllDescriptions(data);
        } catch (err) {
            console.error("Error fetching suggestions", err);
            setAllDescriptions([]);
        }
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleClone = async () => {
        if (!invoice) return;
        try {
            const res = await api.post(`/invoices/${invoice.id}/clone?is_estimate=false`);
            const newInvoice = res.data;
            navigate(`/edit-invoice/${newInvoice.id}`);
        } catch (err) {
            console.error("Error cloning invoice", err);
            alert("Failed to clone invoice.");
        }
    };

    const handleSave = async () => {
        try {
            await api.put(`/invoices/${invoice.id}`, {
                customer_id: invoice.customer_id,
                status: invoice.status,
                due_date: invoice.due_date,
                notes: invoice.notes,
                payment_type: invoice.payment_type,
                discount: invoice.discount,
                tax: invoice.tax,
                tech_id: invoice.tech_id,
                is_active: invoice.is_active,
                items: items,
            });
            alert("Invoice saved successfully.");
            navigate("/customers");
        } catch (err) {
            console.error("Error saving invoice", err);
            alert("Failed to save invoice.");
        }
    };

    if (loading) return <div className="p-4">Loading...</div>;
    if (!invoice) return <div className="p-4 text-red-600">Invoice not found.</div>;

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Edit {invoice.number}</h1>

            {invoice.is_estimate && invoice.is_active && (
                <div className="mb-6">
                    <button
                        type="button"
                        onClick={handleClone}
                        className="bg-green-600 text-white px-4 py-2 rounded"
                    >
                        Clone as Invoice
                    </button>
                </div>
            )}

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSave();
                }}
                className="space-y-4"
            >
                <div>
                    <label className="block mb-1">Due Date</label>
                    <input
                        type="date"
                        value={invoice.due_date ? invoice.due_date.split("T")[0] : ""}
                        onChange={(e) => setInvoice({ ...invoice, due_date: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        required
                    />
                </div>

                <div>
                    <label className="block mb-1">Payment Type</label>
                    <input
                        type="text"
                        value={invoice.payment_type || ""}
                        onChange={(e) => setInvoice({ ...invoice, payment_type: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block mb-1">Status</label>
                    <select
                        value={invoice.status}
                        onChange={(e) => setInvoice({ ...invoice, status: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                    >
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                    </select>
                </div>

                <div>
                    <label className="block mb-1">Notes</label>
                    <textarea
                        value={invoice.notes || ""}
                        onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block mb-1">Assign Technician</label>
                    <input
                        type="text"
                        value={invoice.tech_id || ""}
                        onChange={(e) => setInvoice({ ...invoice, tech_id: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Tech ID"
                    />
                </div>

                <div className="flex gap-4">
                    <div>
                        <label className="block mb-1">Discount ($)</label>
                        <input
                            type="number"
                            value={invoice.discount}
                            onChange={(e) => setInvoice({ ...invoice, discount: parseFloat(e.target.value) || 0 })}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Tax (%)</label>
                        <input
                            type="number"
                            value={invoice.tax}
                            onChange={(e) => setInvoice({ ...invoice, tax: parseFloat(e.target.value) || 0 })}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={invoice.is_active}
                        onChange={(e) => setInvoice({ ...invoice, is_active: e.target.checked })}
                        className="h-4 w-4"
                    />
                    <label className="text-sm">Active</label>
                </div>

                {/* LINE ITEMS */}
                <div>
                    <h2 className="text-lg font-semibold mb-2">Line Items</h2>
                    {items.map((item, index) => {
                        const filteredSuggestions = allDescriptions.filter(desc =>
                            desc.toLowerCase().includes(item.description.toLowerCase())
                        ).slice(0, 6);

                        return (
                            <div key={index} className="relative mb-2">
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder="Description"
                                            value={item.description}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                handleItemChange(index, "description", val);
                                                fetchDescriptions(val);
                                                setShowSuggestionsIndex(index);
                                                setHighlightedIndex(-1);
                                            }}
                                            onKeyDown={(e) => {
                                                if (showSuggestionsIndex !== index) return;
                                                if (e.key === "ArrowDown") {
                                                    setHighlightedIndex((prev) =>
                                                        Math.min(prev + 1, filteredSuggestions.length - 1)
                                                    );
                                                } else if (e.key === "ArrowUp") {
                                                    setHighlightedIndex((prev) =>
                                                        Math.max(prev - 1, 0)
                                                    );
                                                } else if (e.key === "Enter" && highlightedIndex >= 0) {
                                                    e.preventDefault();
                                                    handleItemChange(index, "description", filteredSuggestions[highlightedIndex]);
                                                    setShowSuggestionsIndex(null);
                                                }
                                            }}
                                            onBlur={() => setTimeout(() => setShowSuggestionsIndex(null), 200)}
                                            className="w-full border rounded px-2 py-1"
                                        />
                                        {showSuggestionsIndex === index && filteredSuggestions.length > 0 && (
                                            <ul className="absolute z-10 bg-white border w-full mt-1 rounded shadow max-h-36 overflow-y-auto">
                                                {filteredSuggestions.map((suggestion, i) => (
                                                    <li
                                                        key={i}
                                                        className={`px-2 py-1 cursor-pointer hover:bg-blue-100 ${i === highlightedIndex ? "bg-blue-200" : ""}`}
                                                        onMouseDown={() => {
                                                            handleItemChange(index, "description", suggestion);
                                                            setShowSuggestionsIndex(null);
                                                        }}
                                                    >
                                                        {suggestion}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value))}
                                        className="w-20 border rounded px-2 py-1"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Unit $"
                                        value={item.unit_price}
                                        onChange={(e) => handleItemChange(index, "unit_price", parseFloat(e.target.value))}
                                        className="w-24 border rounded px-2 py-1"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="text-red-500 text-xl px-2"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    <button
                        type="button"
                        onClick={addItem}
                        className="text-blue-600 underline"
                    >
                        + Add Item
                    </button>
                </div>

                <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded mt-6"
                >
                    Save Changes
                </button>
            </form>
        </div>
    );
}
