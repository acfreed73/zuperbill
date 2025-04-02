import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
}

export default function EditInvoice() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<Invoice | null>(null);

    useEffect(() => {
        fetch(`http://192.168.1.187:8000/invoices/${invoiceId}`)
            .then(res => res.json())
            .then(data => {
                setInvoice(data);
            });
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
            ...invoice,
            items: invoice.items.map(({ description, quantity, unit_price }) => ({
                description,
                quantity,
                unit_price,
            })),
        };

        const response = await fetch(`http://192.168.1.187:8000/invoices/${invoiceId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedInvoice),
        });

        if (response.ok) {
            navigate("/customers");
        } else {
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
                        <select
                            name="status"
                            value={invoice.status}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                        >
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label>Payment Type</label>
                        <input
                            type="text"
                            name="payment_type"
                            value={invoice.payment_type || ""}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label>Due Date</label>
                        <input
                            type="date"
                            name="due_date"
                            value={invoice.due_date?.split("T")[0] || ""}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                        />
                    </div>
                    <div className="flex-1">
                        <label>Tax (%)</label>
                        <input
                            type="number"
                            name="tax"
                            value={invoice.tax}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                        />
                    </div>
                    <div className="flex-1">
                        <label>Discount</label>
                        <input
                            type="number"
                            name="discount"
                            value={invoice.discount}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                        />
                    </div>
                </div>

                <div>
                    <label>Notes</label>
                    <textarea
                        name="notes"
                        value={invoice.notes || ""}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div>
                    <h2 className="text-xl font-bold my-2">Line Items</h2>
                    {invoice.items.map((item, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                placeholder="Description"
                                className="flex-1 border p-2 rounded"
                            />
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
                    <button type="button" onClick={addItem} className="text-blue-600 mt-2">
                        + Add Item
                    </button>
                </div>

                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                    Save Changes
                </button>
            </form>
        </div>
    );
}
