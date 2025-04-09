import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api from "@/services/api";

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
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const techId = searchParams.get("tech_id");
    const status = searchParams.get("status");
    const period = searchParams.get("period");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const sortBy = searchParams.get("sort_by") || "date";
    const sortDir = searchParams.get("sort_dir") || "desc";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const fetchInvoices = async () => {
        try {
            const params: Record<string, string> = {
                limit: limit.toString(),
                offset: offset.toString(),
                sort_by: sortBy,
                sort_dir: sortDir,
            };
            if (techId) params.tech_id = techId;
            if (status && status !== "all") params.status = status;
            if (period) params.period = period;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            if (customerId) params.customer_id = customerId.toString();

            const response = await api.get("/invoices/", { params });
            setInvoices(response.data);
        } catch (err) {
            console.error("Failed to fetch invoices", err);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [searchParams.toString(), customerId]);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this invoice?")) return;
        try {
            await api.delete(`/invoices/${id}`);
            setInvoices(prev => prev.filter(inv => inv.id !== id));
        } catch {
            alert("Failed to delete invoice.");
        }
    };

    const handleSort = (column: string) => {
        const newDir = sortBy === column && sortDir === "asc" ? "desc" : "asc";
        const newParams = new URLSearchParams(searchParams);
        newParams.set("sort_by", column);
        newParams.set("sort_dir", newDir);
        navigate(`?${newParams.toString()}`);
    };

    const handlePage = (direction: "next" | "prev") => {
        const newOffset = direction === "next"
            ? offset + limit
            : Math.max(offset - limit, 0);
        const newParams = new URLSearchParams(searchParams);
        newParams.set("offset", newOffset.toString());
        navigate(`?${newParams.toString()}`);
    };

    return (
        <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Invoices</h2>
            </div>

            {invoices.length === 0 ? (
                <p className="p-4">No invoices yet.</p>
            ) : (
                <>
                    <table className="w-full border border-gray-300 text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 text-left cursor-pointer" onClick={() => handleSort("invoice_number")}>
                                    Invoice #
                                </th>
                                <th className="p-2 text-left cursor-pointer" onClick={() => handleSort("date")}>
                                    Date
                                </th>
                                <th className="p-2 text-left cursor-pointer" onClick={() => handleSort("status")}>
                                    Status
                                </th>
                                <th className="p-2 text-left cursor-pointer" onClick={() => handleSort("final_total")}>
                                    Total
                                </th>
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
                                        <Link to={`/edit-invoice/${inv.id}`} className="text-blue-600">Edit</Link>
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

                    <div className="mt-4 flex justify-between">
                        <button
                            onClick={() => handlePage("prev")}
                            disabled={offset === 0}
                            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => handlePage("next")}
                            className="px-3 py-1 bg-gray-200 rounded"
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
