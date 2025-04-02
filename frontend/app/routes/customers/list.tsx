import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import InvoiceList from "../invoices/list";
import React from "react";


interface Customer {
    id: number;
    name: string;
    email: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    zipcode?: string;
}

export default function CustomerList() {
    const [customers, setCustomers] = useState<Customer[]>([]);

    useEffect(() => {
        fetch("http://192.168.1.187:8000/customers/")
            .then(res => res.json())
            .then(setCustomers)
            .catch(err => console.error("Failed to fetch customers", err));
    }, []);

    return (
        <div className="p-4 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Customers</h1>
                <Link
                    to="/add-customer"
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Add Customer
                </Link>
            </div>
            <table className="w-full border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Phone</th>
                        <th className="text-left p-2">Address</th>
                        <th className="text-left p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((c) => (
                        <React.Fragment key={c.id}>
                            <tr className="border-t">
                                <td className="p-2">{c.name}</td>
                                <td className="p-2">{c.email}</td>
                                <td className="p-2">{c.phone || "-"}</td>
                                <td className="p-2">
                                    {[c.street, c.city, c.state, c.zipcode].filter(Boolean).join(", ")}
                                </td>
                                <td className="p-2 space-x-2">
                                    <Link to={`/create-invoice/${c.id}`} className="text-blue-600">
                                        Invoice
                                    </Link>
                                    <button className="text-red-600">Delete</button>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={5} className="p-2 bg-gray-50">
                                    <InvoiceList customerId={c.id} />
                                </td>
                            </tr>
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
