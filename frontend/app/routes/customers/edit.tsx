import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CustomerForm, { type CustomerFormData } from "../../components/CustomerForm";

export default function EditCustomer() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form, setForm] = useState<CustomerFormData | null>(null);

    useEffect(() => {
        if (!id) return;
        fetch(`http://192.168.1.187:8000/customers/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("Customer not found");
                return res.json();
            })
            .then(data => {
                setForm({
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email,
                    phone: data.phone || "",
                    street: data.street || "",
                    city: data.city || "",
                    state: data.state || "",
                    zipcode: data.zipcode || "",
                    referral_source: data.referral_source || "",
                });
            })
            .catch(err => {
                console.error(err);
                alert("Failed to load customer");
                navigate("/customers");
            });
    }, [id, navigate]);

    const handleSubmit = async () => {
        if (!form || !id) return;

        const response = await fetch(`http://192.168.1.187:8000/customers/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(form)
        });

        if (response.ok) {
            navigate("/customers");
        } else {
            const err = await response.json();
            alert(err.detail || "Failed to update customer");
        }
    };

    if (!form) return <p className="p-4">Loading...</p>;

    return (
        <div className="p-4 max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Edit Customer</h1>
            <CustomerForm form={form} setForm={setForm} onSubmit={handleSubmit} submitLabel="Update" />
        </div>
    );
}
