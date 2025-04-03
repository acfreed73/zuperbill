import React, { useEffect, useState } from "react";

export interface CustomerFormData {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    referral_source?: string;
}

const US_STATES = [
    "", "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI",
    "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN",
    "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH",
    "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA",
    "WV", "WI", "WY"
];

interface Props {
    form: CustomerFormData | null;
    setForm: (data: CustomerFormData) => void;
    onSubmit: () => void;
    submitLabel?: string;
}

export default function CustomerForm({ form, setForm, onSubmit, submitLabel = "Save" }: Props) {
    if (!form) {
        return <p className="p-4 text-red-600">Form not loaded yet.</p>;
    }
    const [localForm, setLocalForm] = useState(form);

    // ✅ Sync with parent-provided form values (especially useful in edit mode)
    useEffect(() => {
        setLocalForm(form);
    }, [form]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const updated = { ...localForm, [e.target.name]: e.target.value };
        setLocalForm(updated);
        setForm(updated); // notify parent
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!localForm.first_name || !localForm.email || !localForm.last_name) {
            alert("Name and email are required.");
            return;
        }

        onSubmit();
    };

    return (
        <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
                <label className="block mb-1">First Name *</label>
                <input
                    type="text"
                    name="first_name"
                    value={localForm.first_name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
            </div>
            <div>
                <label className="block mb-1">Last Name *</label>
                <input
                    type="text"
                    name="last_name"
                    value={localForm.last_name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
            </div>
            <div>
                <label className="block mb-1">Email *</label>
                <input
                    type="email"
                    name="email"
                    value={localForm.email}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
            </div>
            <div>
                <label className="block mb-1">Phone</label>
                <input
                    type="text"
                    name="phone"
                    value={localForm.phone || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
            </div>
            <div>
                <label className="block mb-1">Street</label>
                <input
                    type="text"
                    name="street"
                    value={localForm.street || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
            </div>
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block mb-1">City</label>
                    <input
                        type="text"
                        name="city"
                        value={localForm.city || ""}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block mb-1">State</label>
                    <select
                        name="state"
                        value={localForm.state || ""}
                        onChange={handleChange}
                        className="border border-gray-300 rounded px-3 py-2"
                    >
                        {US_STATES.map(state => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block mb-1">Zip</label>
                    <input
                        type="text"
                        name="zipcode"
                        value={localForm.zipcode || ""}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                </div>
                <div className="flex-1">
                    <label className="block mb-1">Referral Source</label>
                    <input
                        type="text"
                        name="referral_source"
                        value={localForm.referral_source || ""}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                </div>
            </div>
            <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded"
            >
                {submitLabel}
            </button>
        </form>
    );
}
