import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from '@/services/api';

interface Invoice {
    id: number;
    invoice_number: string;
    date: string;
    status: string;
    final_total: number;
    accepted?: boolean;
    user_name?: string;
}

export default function InvoiceList({ customerId }: { customerId?: number }) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");

    const fetchInvoices = async () => {
        try {
            const params: Record<string, string> = {};
            if (customerId) params.customer_id = customerId.toString();
            if (statusFilter !== "all") params.status = statusFilter;

            const response = await api.get('/invoices/', { params });
            setInvoices(response.data);
        } catch (err) {
            console.error("Failed to fetch invoices", err);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [customerId, statusFilter]);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this invoice?")) return;

        try {
            await api.delete(`/invoices/${id}`);
            setInvoices(prev => prev.filter(inv => inv.id !== id));
        } catch {
            alert("Failed to delete invoice.");
        }
    };

    return (
        <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Invoices</h2>
                <div className="space-x-2">
                    {["all", "unpaid", "paid"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s as "all" | "unpaid" | "paid")}
                            className={`px-3 py-1 text-sm rounded ${statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-200"
                                }`}
                        >
                            {s[0].toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

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
                            <th className="p-2 text-left">Tech</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((inv) => (
                            <tr key={inv.id} className={`border-t ${inv.status === "paid" ? "bg-green-100" : ""}`}>
                                <td className="p-2">{inv.invoice_number}</td>
                                <td className="p-2">
                                    {new Date(inv.date).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "numeric",
                                        day: "numeric",
                                    })}
                                </td>
                                <td className="p-2">{inv.status}</td>
                                <td className="p-2">${inv.final_total.toFixed(2)}</td>
                                <td className="p-2 space-x-2">
                                    <Link to={`/edit-invoice/${inv.id}`} className="text-blue-600"> Edit </Link>
                                    <Link to={`/invoices/${inv.id}/acknowledge`} className="text-green-600">Ack</Link>
                                    <button
                                        onClick={() => handleDelete(inv.id)}
                                        className="text-red-600"
                                    >
                                        Delete
                                    </button>
                                </td>
                                <td className="p-2">{inv.user_name || "—"}</td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
