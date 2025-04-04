import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from '@/services/api';

export default function InvoiceForm({ customerId }: { customerId: string }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        status: "unpaid",
        due_date: "",
        notes: "",
        payment_type: "",
        discount: 0,
        tax: 0,
    });

    const [items, setItems] = useState([
        { description: "", quantity: 1, unit_price: 0 },
    ]);

    const [allDescriptions, setAllDescriptions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const fetchDescriptions = async (query: string) => {
        if (!query.trim()) return setAllDescriptions([]);
        try {
            const res = await api.get('/line-items/descriptions', {
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
            const response = await api.post('/invoices/', {
                customer_id: parseInt(customerId),
                ...form,
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
                <label className="block mb-1">Due Date</label>
                <input
                    type="date"
                    name="due_date"
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
                    name="payment_type"
                    value={form.payment_type}
                    onChange={(e) => setForm({ ...form, payment_type: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                />
            </div>

            <div>
                <label className="block mb-1">Status</label>
                <select
                    name="status"
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
                    name="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                />
            </div>

            <div className="flex gap-4">
                <div>
                    <label className="block mb-1">Discount ($)</label>
                    <input
                        type="number"
                        value={form.discount}
                        onChange={(e) =>
                            setForm({ ...form, discount: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block mb-1">Tax (%)</label>
                    <input
                        type="number"
                        value={form.tax}
                        onChange={(e) =>
                            setForm({ ...form, tax: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold mb-2">Line Items</h2>
                {items.map((item, index) => {
                    const filteredSuggestions = allDescriptions.filter(desc =>
                        desc.toLowerCase().includes(item.description.toLowerCase()) &&
                        item.description.trim() !== ""
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
                                            setShowSuggestions(true);
                                            setHighlightedIndex(-1);
                                        }}
                                        onKeyDown={(e) => {
                                            if (!showSuggestions) return;
                                            if (e.key === "ArrowDown") {
                                                setHighlightedIndex(prev =>
                                                    Math.min(prev + 1, filteredSuggestions.length - 1)
                                                );
                                            } else if (e.key === "ArrowUp") {
                                                setHighlightedIndex(prev =>
                                                    Math.max(prev - 1, 0)
                                                );
                                            } else if (e.key === "Enter" && highlightedIndex >= 0) {
                                                e.preventDefault();
                                                handleItemChange(index, "description", filteredSuggestions[highlightedIndex]);
                                                setShowSuggestions(false);
                                            }
                                        }}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                                        className="w-full border rounded px-2 py-1"
                                    />
                                    {showSuggestions && filteredSuggestions.length > 0 && (
                                        <ul className="absolute z-10 bg-white border border-gray-300 w-full rounded shadow mt-1 max-h-36 overflow-y-auto">
                                            {filteredSuggestions.map((suggestion, i) => (
                                                <li
                                                    key={i}
                                                    className={`px-2 py-1 cursor-pointer hover:bg-blue-100 ${i === highlightedIndex ? "bg-blue-200" : ""}`}
                                                    onMouseDown={() => {
                                                        handleItemChange(index, "description", suggestion);
                                                        setShowSuggestions(false);
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
                                    onChange={(e) =>
                                        handleItemChange(index, "quantity", parseInt(e.target.value))
                                    }
                                    className="w-20 border rounded px-2 py-1"
                                />
                                <input
                                    type="number"
                                    placeholder="Unit $"
                                    value={item.unit_price}
                                    onChange={(e) =>
                                        handleItemChange(index, "unit_price", parseFloat(e.target.value))
                                    }
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
                Save Invoice
            </button>
        </form>
    );
}
