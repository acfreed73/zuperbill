import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddCustomer() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        zipcode: "",
    });

    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError(""); // clear error on input
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch("http://192.168.1.187:8000/customers/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            if (response.ok) {
                const data = await response.json();
                navigate(`/create-invoice/${data.id}`);
            } else {
                const err = await response.json();
                setError(err.detail || "Error adding customer");
            }
        } catch (err) {
            setError("Network error or server is unavailable");
        }
    };

    return (
        <div className="p-4 max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Add Customer</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                {["name", "email", "phone", , "street", "city", "state", "zipcode"].map((field) => (
                    <div key={field}>
                        <label className="block mb-1 capitalize">{field}</label>
                        <input
                            type="text"
                            name={field}
                            value={(form as any)[field]}
                            onChange={handleChange}
                            required={field !== "phone"}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                    </div>
                ))}
                {error && <p className="text-red-600">{error}</p>}
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Save & Create Invoice
                </button>
            </form>
        </div>
    );
}
