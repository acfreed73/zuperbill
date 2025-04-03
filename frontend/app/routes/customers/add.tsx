import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomerForm, { type CustomerFormData } from "../../components/CustomerForm";



export default function AddCustomer() {
    const navigate = useNavigate();
    const [form, setForm] = useState<CustomerFormData>({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        zipcode: "",
        referral_source: ""
    });

    const handleSubmit = async () => {
        try {
            const res = await fetch("http://192.168.1.187:8000/customers/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                navigate("/customers");
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to add customer");
            }
        } catch (err) {
            console.error(err);
            alert("Error submitting form.");
        }
    };

    return (
        <div className="p-4 max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Add Customer</h1>
            <CustomerForm form={form} setForm={setForm} onSubmit={handleSubmit} submitLabel="Save & Return" />
        </div>
    );
}
