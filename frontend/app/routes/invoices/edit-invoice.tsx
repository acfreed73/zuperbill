// frontend/app/routes/invoices/edit-invoice.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function EditInvoice() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [invoice, setInvoice] = useState<any>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`http://192.168.1.187:8000/invoices/${invoiceId}`)
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                setInvoice(data);
                setLoading(false);
            })
            .catch(err => {
                setError("Invoice not found or error loading data");
                setLoading(false);
            });
    }, [invoiceId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setInvoice({ ...invoice, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const response = await fetch(`http://192.168.1.187:8000/invoices/${invoiceId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(invoice),
        });

        if (response.ok) {
            navigate("/customers");
        } else {
            alert("Error updating invoice");
        }
    };

    if (loading) return <p className="p-4">Loading...</p>;
    if (error) return <p className="p-4 text-red-600">{error}</p>;

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Edit Invoice #{invoice.invoice_number}</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" name="id" value={invoice.id} />
                <div>
                    <label className="block">Status</label>
                    <select name="status" value={invoice.status} onChange={handleChange} className="w-full border p-2 rounded">
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                    </select>
                </div>
                <div>
                    <label className="block mb-1">Payment Type</label>
                    <select
                        name="payment_type"
                        value={invoice.payment_type || ""}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                        <option value="">Select Payment Type</option>
                        <option value="cash">Cash</option>
                        <option value="credit">Credit</option>
                        <option value="check">Check</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div>
                    <label className="block">Notes</label>
                    <textarea name="notes" value={invoice.notes || ""} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">
                    Save Changes
                </button>
            </form>
        </div>
    );
}
