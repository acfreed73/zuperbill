import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
        const response = await fetch("http://192.168.1.187:8000/invoices/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer_id: parseInt(customerId),
                ...form,
                items,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            // navigate(`/view-invoice/${data.id}`);
            navigate("/customers");

        } else {
            alert("Error creating invoice");
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
                {items.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                        <input
                            type="text"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) =>
                                handleItemChange(index, "description", e.target.value)
                            }
                            className="flex-1 border rounded px-2 py-1"
                        />
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
                            className="text-red-500"
                        >
                            ✕
                        </button>
                    </div>
                ))}
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
