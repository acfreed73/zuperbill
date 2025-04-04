import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CustomerForm, { type CustomerFormData } from "../../components/CustomerForm";
import api from '@/services/api';
export default function EditCustomer() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form, setForm] = useState<CustomerFormData | null>(null);

    useEffect(() => {
        if (!id) return;

        api.get(`/customers/${id}`)
            .then(res => {
                const data = res.data;
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

        try {
            await api.put(`/customers/${id}`, form);
            navigate("/customers");
        } catch (err: any) {
            console.error(err);
            const message = err.response?.data?.detail || "Failed to update customer";
            alert(message);
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
