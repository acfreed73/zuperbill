// frontend/app/routes/public/invoice.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/services/api";
import InvoicePreview from "@/components/InvoicePreview";

export default function PublicInvoiceView() {
    const { token } = useParams<{ token: string }>();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/public/invoice/${token}`)
            .then(res => setInvoice(res.data))
            .catch(err => console.error("Failed to load invoice", err))
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <p className="p-4">Loading...</p>;
    if (!invoice) return <p className="p-4 text-red-600">Invoice not found.</p>;

    return (
        <div className="p-4 max-w-5xl mx-auto">
            <InvoicePreview
                invoice={invoice}
                signatureDataUrl={invoice.signature_base64 || ""}
                signedAt={invoice.signed_at}
                accepted={invoice.accepted}
                testimonial={invoice.testimonial}
            />
            {invoice.media_folder_url && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-2">Drive Folder</h3>
                    <a
                        href={invoice.media_folder_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                    >
                        View Folder on Google Drive
                    </a>
                </div>
            )}
        </div>
    );
}
