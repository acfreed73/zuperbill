// frontend/src/routes/invoices/acknowledge.tsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from '@/services/api';
import SignatureCanvas from "react-signature-canvas";
import InvoicePreview from "../../components/InvoicePreview";

export default function AcknowledgeInvoice() {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const sigRef = useRef<SignatureCanvas>(null);
    const [invoice, setInvoice] = useState<any>(null);
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [signed, setSigned] = useState(false);
    const [testimonial, setTestimonial] = useState("");
    const [selectedTheme, setSelectedTheme] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("unpaid");
    const [paymentType, setPaymentType] = useState("");
    const [paymentNotes, setPaymentNotes] = useState("");
    const [cleared, setCleared] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        api.get(`/invoices/${invoiceId}`).then(res => {
            const data = res.data;
            setInvoice(data);
            setAgreed(!!data.accepted);
            setSigned(!!data.signed_at);
            setTestimonial(data.testimonial || "");
            setPaymentStatus(data.status || "unpaid");
            setPaymentType(data.payment_type || "");
            setPaymentNotes(data.notes || "");
            if (data.signature_base64 && sigRef.current) {
                sigRef.current.fromDataURL(data.signature_base64);
            }
        });
    }, [invoiceId]);

    useEffect(() => {
        if (!selectedTheme) return;
        api.get(`/ai/generate-testimonial`, {
            params: { theme: selectedTheme },
            responseType: 'text',
        })
            .then(res => setTestimonial(res.data))
            .catch(console.error);
    }, [selectedTheme]);

    const handleSubmit = async () => {
        const canvasEmpty = sigRef.current?.isEmpty();

        if (!agreed) {
            alert("You must agree to the terms.");
            return;
        }
        if (canvasEmpty && !invoice?.signature_base64) {
            alert("You must provide a signature.");
            return;
        }

        if (invoice?.accepted && !canvasEmpty && cleared) {
            alert("Invoice already signed; you cannot change the original signature.");
            return;
        }

        setSubmitting(true);

        const payload: any = {
            accepted: agreed,
            status: paymentStatus,
            payment_type: paymentType,
            notes: paymentNotes,
            signed_at: new Date().toISOString(),
            testimonial,
        };

        if (!canvasEmpty && !cleared) {
            payload.signature_base64 = sigRef.current?.toDataURL("image/png");
        }

        try {
            await api.post(`/invoices/${invoiceId}/acknowledge`, payload);
            navigate("/customers");
        } catch (err: any) {
            const message = err.response?.data?.detail || "Failed to submit.";
            alert(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClear = () => {
        sigRef.current?.clear();
        setSigned(false);
        setCleared(true);
    };

    if (!invoice) return <p className="p-4">Loading...</p>;

    const signatureData = signed
        ? sigRef.current?.toDataURL("image/png")
        : invoice.signature_base64;

    return (
        <div className="p-4 max-w-5xl mx-auto">
            <InvoicePreview
                invoice={invoice}
                signatureDataUrl={signatureData}
                signedAt={invoice.signed_at || new Date().toISOString()}
                accepted={invoice.accepted ?? agreed}
                testimonial={testimonial}
            />

            {/* Terms */}
            <div className="mt-6">
                <label className="block font-semibold mb-2">Terms & Conditions</label>
                <div className="h-40 border rounded overflow-hidden">
                    <iframe
                        src="https://callitweb.com/zacharyfreed/terms.html"
                        className="w-full h-full"
                        title="Terms"
                    />
                </div>
                <label className="block mt-2">
                    <input
                        type="checkbox"
                        className="mr-2"
                        checked={agreed}
                        onChange={() => setAgreed(!agreed)}
                    />
                    I agree to the terms and acknowledge work completion.
                </label>
            </div>
            {/* Testimonial */}
            <div className="mt-6">
                <label className="block font-semibold mb-2">Testimonial Theme</label>
                <div className="flex flex-wrap gap-4 text-sm mb-2">
                    {["price", "timely", "cordial", "clean", "quality", "overall"].map(theme => (
                        <label key={theme} className="flex items-center space-x-1">
                            <input
                                type="radio"
                                name="testimonialTheme"
                                value={theme}
                                checked={selectedTheme === theme}
                                onChange={() => setSelectedTheme(theme)}
                            />
                            <span>{theme}</span>
                        </label>
                    ))}
                </div>
                <textarea
                    className="w-full border rounded p-2 text-sm"
                    rows={3}
                    value={testimonial}
                    onChange={(e) => setTestimonial(e.target.value)}
                />
            </div>

            {/* Signature & Payment */}
            <div className="mt-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                    <label className="block font-semibold mb-2">Signature</label>
                    <SignatureCanvas
                        ref={sigRef}
                        penColor="black"
                        canvasProps={{ width: 600, height: 200, className: "border rounded", style: { maxWidth: "100%" } }}
                        onEnd={() => setSigned(true)}
                    />
                    <button onClick={handleClear} className="text-sm mt-2 text-blue-600">Clear</button>
                </div>
                <div className="flex-1">
                    <label className="block font-medium mb-1">Payment Status</label>
                    <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full border p-2 rounded mb-4">
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                    </select>

                    <label className="block font-medium mb-1">Payment Type</label>
                    <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className="w-full border p-2 rounded mb-4">
                        <option value="">Select...</option>
                        <option value="cash">Cash</option>
                        <option value="check">Check</option>
                        <option value="zelle">Zelle</option>
                        <option value="credit_card">Credit Card</option>
                    </select>

                    <label className="block font-medium mb-1">Payment Notes</label>
                    <textarea
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        className="w-full border p-2 rounded"
                        rows={3}
                    />
                </div>
            </div>
            <div className="flex gap-4 mt-6">
                <button className="bg-green-600 text-white px-6 py-2 rounded"
                        onClick={async () => {
                            try {
                            await api.post(`/invoices/${invoiceId}/email`);
                            alert("Invoice emailed successfully.");
                            } catch (err: any) {
                            alert("Failed to send invoice.");
                            } }} 
                > Email</button>

                <button onClick={handleSubmit} disabled={submitting} className="bg-red-600 text-white px-6 py-2 rounded">
                    {submitting ? "Submitting..." : "Submit"}
                </button>
            </div>
        </div>
    );
}