import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from '@/services/api';

interface LineItem {
    id?: number;
    description: string;
    quantity: number;
    unit_price: number;
}

interface Invoice {
    id: number;
    invoice_number: string;
    status: string;
    due_date: string;
    payment_type: string;
    notes: string;
    discount: number;
    tax: number;
    items: LineItem[];
    customer_id: number;
    testimonial: string;
    tech_id?: number;
    media_folder_url?: string;
}

export default function EditInvoice() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestionsIndex, setShowSuggestionsIndex] = useState<number | null>(null);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const [users, setUsers] = useState<{ id: number; user_name?: string; email: string }[]>([]);
    useEffect(() => {
        api.get("/users")
            .then(res => setUsers(res.data))
            .catch(err => console.error("Failed to load users", err));
    }, []);

    useEffect(() => {
        api.get(`/invoices/${invoiceId}`)
            .then(res => setInvoice(res.data))
            .catch(err => console.error("Failed to load invoice", err));
    }, [invoiceId]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!invoice) return;
        const { name, value } = e.target;
        setInvoice({ ...invoice, [name]: value });
    };

    const handleItemChange = (index: number, field: keyof LineItem, value: string | number) => {
        if (!invoice) return;
        const newItems = [...invoice.items];
        (newItems[index] as any)[field] = field === "quantity" || field === "unit_price" ? parseFloat(value as string) : value;
        setInvoice({ ...invoice, items: newItems });
    };

    const handleDescriptionInput = async (index: number, value: string) => {
        handleItemChange(index, "description", value);
        setShowSuggestionsIndex(index);
        setHighlightedIndex(-1);
        if (value.trim() === "") return setSuggestions([]);

        const res = await api.get('/line-items/descriptions', {
            params: { q: value },
        });
        setSuggestions(res.data);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (showSuggestionsIndex !== index) return;

        if (e.key === "ArrowDown") {
            setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" && highlightedIndex >= 0) {
            e.preventDefault();
            handleItemChange(index, "description", suggestions[highlightedIndex]);
            setSuggestions([]);
            setShowSuggestionsIndex(null);
        }
    };

    const addItem = () => {
        if (!invoice) return;
        setInvoice({ ...invoice, items: [...invoice.items, { description: "", quantity: 1, unit_price: 0 }] });
    };

    const removeItem = (index: number) => {
        if (!invoice) return;
        const newItems = invoice.items.filter((_, i) => i !== index);
        setInvoice({ ...invoice, items: newItems });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoice) return;

        const updatedInvoice = {
            customer_id: invoice.customer_id,
            status: invoice.status,
            due_date: invoice.due_date,
            notes: invoice.notes,
            payment_type: invoice.payment_type,
            discount: invoice.discount,
            tax: invoice.tax,
            testimonial: invoice.testimonial,
            tech_id: invoice.tech_id ?? null,
            media_folder_url: invoice.media_folder_url ?? null,
            items: invoice.items.map(({ description, quantity, unit_price }) => ({
                description,
                quantity,
                unit_price,
            })),
        };
        try {
            await api.put(`/invoices/${invoiceId}`, updatedInvoice);
            navigate("/customers");
        } catch {
            alert("Failed to update invoice");
        }
    };

    if (!invoice) return <p className="p-4">Loading...</p>;

    return (
        <div className="p-4 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Edit Invoice #{invoice.invoice_number}</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label>Status</label>
                        <select name="status" value={invoice.status} onChange={handleChange} className="w-full border p-2 rounded">
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label>Payment Type</label>
                        <input type="text" name="payment_type" value={invoice.payment_type || ""} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label>Due Date</label>
                        <input type="date" name="due_date" value={invoice.due_date?.split("T")[0] || ""} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div className="flex-1">
                        <label>Tax (%)</label>
                        <input type="number" name="tax" value={invoice.tax} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div className="flex-1">
                        <label>Discount</label>
                        <input type="number" name="discount" value={invoice.discount} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                </div>

                <div>
                    <label>Notes</label>
                    <textarea name="notes" value={invoice.notes || ""} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label>Assigned Technician</label>
                    <select
                        name="tech_id"
                        value={invoice.tech_id ?? ""}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    >
                        <option value="">-- Select Technician --</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.user_name} {"<"}{user.email}{">"}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Testimonial</label>
                    <textarea name="testimonial" value={invoice.testimonial || ""} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                <label className="block mb-1 font-semibold">Google Drive Folder Link</label>
                <input
                    type="url"
                    name="media_folder_url"
                    value={invoice.media_folder_url || ""}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    placeholder="https://drive.google.com/drive/folders/..."
                />
                    <p className="text-xs text-gray-500 mt-1">
                        Suggested format: <code>CustomerName-INV{invoice.invoice_number}</code>
                    </p>
                    {invoice.media_folder_url && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-2">Drive Folder</h3>
                            <a
                                href={invoice.media_folder_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                            >
                                View Folder on Google Drive
                            </a>
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="text-xl font-bold my-2">Line Items</h2>
                    {invoice.items.map((item, index) => (
                        <div key={index} className="relative flex gap-2 mb-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => handleDescriptionInput(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    onBlur={() => setTimeout(() => setShowSuggestionsIndex(null), 150)}
                                    placeholder="Description"
                                    className="w-full border p-2 rounded"
                                />
                                {showSuggestionsIndex === index && suggestions.length > 0 && (
                                    <ul className="absolute z-10 bg-white border border-gray-300 w-full rounded shadow mt-1 max-h-40 overflow-y-auto">
                                        {suggestions.map((s, i) => (
                                            <li
                                                key={i}
                                                className={`px-2 py-1 cursor-pointer hover:bg-blue-100 ${i === highlightedIndex ? "bg-blue-200" : ""}`}
                                                onMouseDown={() => {
                                                    handleItemChange(index, "description", s);
                                                    setSuggestions([]);
                                                    setShowSuggestionsIndex(null);
                                                }}
                                            >
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                className="w-24 border p-2 rounded"
                            />
                            <input
                                type="number"
                                value={item.unit_price}
                                onChange={(e) => handleItemChange(index, "unit_price", e.target.value)}
                                className="w-24 border p-2 rounded"
                            />
                            <button type="button" onClick={() => removeItem(index)} className="text-red-500">
                                ✕
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={addItem} className="text-blue-600 mt-2">+ Add Item</button>
                </div>

                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save Changes</button>
            </form>
        </div>
    );
}
