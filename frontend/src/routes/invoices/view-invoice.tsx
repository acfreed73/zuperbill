import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ViewInvoice() {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const [invoice, setInvoice] = useState<any>(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetch(`http://localhost:8000/invoices/${invoiceId}`)
            .then(res => res.json())
            .then(setInvoice)
            .catch(console.error);
    }, [invoiceId]);

    const handleResend = async () => {
        setSending(true);
        const res = await fetch(`http://localhost:8000/invoices/${invoiceId}/resend`, {
            method: "POST"
        });

        if (res.ok) alert("Invoice resent successfully.");
        else alert("Failed to resend invoice.");
        setSending(false);
    };

    if (!invoice) return <p className="p-4">Loading...</p>;

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <iframe
                src={`http://localhost:8000/invoices/${invoiceId}/pdf`}
                className="w-full h-[800px] border mb-4"
            />
            <button
                onClick={handleResend}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                disabled={sending}
            >
                {sending ? "Sending..." : "Resend Invoice"}
            </button>
        </div>
    );
}
