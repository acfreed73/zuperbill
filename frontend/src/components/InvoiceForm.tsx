import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

export default function InvoiceForm({ customerId }: { customerId: string }) {
    const navigate = useNavigate();

    const [isEstimate, setIsEstimate] = useState(false);
    const [form, setForm] = useState({
        status: "unpaid",
        due_date: "",
        notes: "",
        payment_type: "",
        discount: 0,
        tax: 0,
        tech_id: "",
    });

    const [items, setItems] = useState([
        { description: "", quantity: 1, unit_price: 0 },
    ]);

    const [allDescriptions, setAllDescriptions] = useState<string[]>([]);
    const [showSuggestionsIndex, setShowSuggestionsIndex] = useState<number | null>(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [users, setUsers] = useState<{ id: number; user_name?: string; email: string }[]>([]);

    useEffect(() => {
        api.get("/users")
            .then((res) => setUsers(res.data))
            .catch((err) => console.error("Error fetching users", err));
    }, []);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await api.post("/invoices/", {
                customer_id: parseInt(customerId),
                ...form,
                is_estimate: isEstimate,
                tech_id: form.tech_id ? parseInt(form.tech_id) : null,
                items,
            });
            navigate("/customers");
        } catch (err: any) {
            console.error(err);
            const message = err.response?.data?.detail || "Error creating invoice";
            alert(message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block mb-1">Document Type</label>
                <select
                    value={isEstimate ? "estimate" : "invoice"}
                    onChange={(e) => setIsEstimate(e.target.value === "estimate")}
                    className="border p-2 rounded w-full"
                >
                    <option value="invoice">Invoice</option>
                    <option value="estimate">Estimate</option>
                </select>
            </div>

            <div>
                <label className="block mb-1">Due Date</label>
                <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                />
            </div>

            <div>
                <label className="block mb-1">Payment Type</label>
                <input
                    type="text"
                    value={form.payment_type}
                    onChange={(e) => setForm({ ...form, payment_type: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                />
            </div>

            <div>
                <label className="block mb-1">Status</label>
                <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
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
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                />
            </div>

            <div>
                <label className="block mb-1">Assign Technician</label>
                <select
                    value={form.tech_id}
                    onChange={(e) => setForm({ ...form, tech_id: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                >
                    <option value="">-- Select Technician --</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.user_name || user.email}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex gap-4">
                <div>
                    <label className="block mb-1">Discount ($)</label>
                    <input
                        type="number"
                        value={form.discount}
                        onChange={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block mb-1">Tax (%)</label>
                    <input
                        type="number"
                        value={form.tax}
                        onChange={(e) => setForm({ ...form, tax: parseFloat(e.target.value) || 0 })}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
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
                className="bg-green-600 text-white px-4 py-2 rounded mt-4"
            >
                Save {isEstimate ? "Estimate" : "Invoice"}
            </button>
        </form>
    );
}
