import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Invoice {
    id: number;
    invoice_number: string;
    date: string;
    status: string;
    final_total: number;
}

export default function InvoiceList({ customerId }: { customerId?: number }) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    const fetchInvoices = async () => {
        try {
            const url = customerId
                ? `http://192.168.1.187:8000/invoices/?customer_id=${customerId}`
                : `http://192.168.1.187:8000/invoices/`;

            const response = await fetch(url);
            const data = await response.json();
            setInvoices(data);
        } catch (err) {
            console.error("Failed to fetch invoices", err);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [customerId]);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this invoice?")) return;

        const res = await fetch(`http://192.168.1.187:8000/invoices/${id}`, {
            method: "DELETE",
        });

        if (res.ok) {
            setInvoices(prev => prev.filter(inv => inv.id !== id));
        } else {
            alert("Failed to delete invoice.");
        }
    };

    return (
        <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Invoices</h2>

            {customerId && (
                <div className="mb-2">
                    <Link
                        to={`/create-invoice/${customerId}`}
                        className="inline-block bg-blue-600 text-white px-3 py-1 rounded"
                    >
                        + Add Invoice
                    </Link>
                </div>
            )}

            {invoices.length === 0 ? (
                <p className="p-4">No invoices yet.</p>
            ) : (
                <table className="w-full border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="text-left p-2">Invoice #</th>
                            <th className="p-2 text-left">Date</th>
                            <th className="p-2 text-left">Status</th>
                            <th className="p-2 text-left">Total</th>
                            <th className="p-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map(inv => (
                            <tr key={inv.id} className={`border-t ${inv.status === 'paid' ? 'bg-green-100' : ''}`}>
                                <td className="p-2">{inv.invoice_number}</td>
                                <td className="p-2">{inv.date}</td>
                                <td className="p-2">{inv.status}</td>
                                <td className="p-2">${inv.final_total.toFixed(2)}</td>
                                <td className="p-2 space-x-2">
                                    <Link to={`/edit-invoice/${inv.id}`} className="text-blue-600">Edit</Link>
                                    <button
                                        onClick={() => handleDelete(inv.id)}
                                        className="text-red-600"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
