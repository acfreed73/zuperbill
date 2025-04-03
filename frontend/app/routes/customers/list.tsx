import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import InvoiceList from "../invoices/list";
import React from "react";
import {
    faTrash,
    faPlus,
    faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    referral_source?: string;
    total_unpaid: number;
}

export default function CustomerList() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const fetchCustomers = async () => {
        const params = new URLSearchParams({
            q: search,
            limit: pageSize.toString(),
            offset: ((page - 1) * pageSize).toString(),
        });

        const res = await fetch(`http://192.168.1.187:8000/customers/?${params}`);
        const data = await res.json();
        setCustomers(data);
    };

    useEffect(() => {
        fetchCustomers();
    }, [search, page]);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this customer?")) return;

        const res = await fetch(`http://192.168.1.187:8000/customers/${id}`, {
            method: "DELETE",
        });

        if (res.ok) {
            setCustomers((prev) => prev.filter((c) => c.id !== id));
        } else {
            alert("Failed to delete customer.");
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Customers</h1>
                <Link
                    to="/add-customer"
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    <FontAwesomeIcon icon={faPlus} /> Add Customer
                </Link>
            </div>

            <input
                type="text"
                placeholder="Search by first and last name, email, or phone..."
                className="border px-3 py-2 mb-4 w-full rounded"
                value={search}
                onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                }}
            />

            {customers.map((c) => (
                <div key={c.id} className="border rounded p-4 mb-6 bg-white shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-lg">{c.first_name} {c.last_name}</p>
                            <p className="text-sm text-gray-600">{c.email}</p>
                            <p className="text-sm">{c.phone || "-"}</p>
                            <p className="text-sm italic">
                                {[c.street, c.city, c.state, c.zipcode].filter(Boolean).join(", ")}
                            </p>
                            <p className="text-sm"><strong>Referral Source: </strong>{c.referral_source || "-"}</p>
                            {(c.total_unpaid > 0) ? 
                            <p className="mt-1 text-red-600 font-bold">
                                Unpaid: ${c.total_unpaid.toFixed(2)}
                            </p> 
                            :
                            <p className="mt-1 text-green-600 font-bold">
                                Unpaid: ${c.total_unpaid.toFixed(2)}
                            </p>
                            }
                        </div>
                        <div className="space-x-3 mt-1">
                            <Link to={`/create-invoice/${c.id}`} className="text-blue-600">
                                <FontAwesomeIcon icon={faPlus} /> Invoice
                            </Link>
                            <Link to={`/edit-customer/${c.id}`} className="text-green-600">
                                <FontAwesomeIcon icon={faEdit} /> Edit
                            </Link>
                            <button
                                onClick={() => handleDelete(c.id)}
                                className="text-red-600"
                            >
                                <FontAwesomeIcon icon={faTrash} /> Delete
                            </button>
                        </div>
                    </div>

                    <InvoiceList customerId={c.id} />
                </div>
            ))}

            <div className="flex justify-between mt-6">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                    Prev
                </button>
                <span className="text-sm text-gray-600">Page {page}</span>
                <button
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 border rounded"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
