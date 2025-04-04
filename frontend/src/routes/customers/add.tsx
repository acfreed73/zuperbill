import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomerForm, { type CustomerFormData } from "../../components/CustomerForm";
import api from '@/services/api';


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
            const res = await api.post('/customers/', form); 
            navigate("/customers");
        } catch (err: any) {
            console.error(err);
            const message = err.response?.data?.detail || "Failed to add customer";
            alert(message);
        }
    };


    return (
        <div className="p-4 max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Add Customer</h1>
            <CustomerForm form={form} setForm={setForm} onSubmit={handleSubmit} submitLabel="Save & Return" />
        </div>
    );
}
