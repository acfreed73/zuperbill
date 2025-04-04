// app/routes/invoices/acknowledge.tsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from '@/services/api';
import SignatureCanvas from "react-signature-canvas";
import InvoicePreview from "../../components/InvoicePreview";
import PaymentModal from "../../components/PaymentModal";

export default function AcknowledgeInvoice() {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const sigRef = useRef<SignatureCanvas>(null);
    const [invoice, setInvoice] = useState<any>(null);
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [signed, setSigned] = useState(false);
    const [testimonial, setTestimonial] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState("");
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [pendingSubmit, setPendingSubmit] = useState(false);
    const [missingItems, setMissingItems] = useState<string[]>([]);
    const [forceSubmit, setForceSubmit] = useState(false);


    // Add after other useState hooks
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(invoice?.status || "unpaid");
    const [paymentType, setPaymentType] = useState(invoice?.payment_type || "");
    const [paymentNotes, setPaymentNotes] = useState(invoice?.notes || "");

    const navigate = useNavigate();
    
    useEffect(() => {
        if (!selectedTheme) return;
        api.get(`/ai/generate-testimonial`, {
            params: { theme: selectedTheme },
            responseType: 'text',
        })
            .then(res => setTestimonial(res.data))
            .catch(console.error);
    }, [selectedTheme]);

    
    useEffect(() => {
        api.get(`/invoices/${invoiceId}`)
            .then(res => setInvoice(res.data))
            .catch(err => console.error("Failed to load invoice", err));
    }, [invoiceId]);

    
    const handleSubmit = async () => {
        const missing: string[] = [];
        if (!agreed) missing.push("terms");
        if (sigRef.current?.isEmpty()) missing.push("signature");

        if (missing.length > 0 && !forceSubmit) {
            setMissingItems(missing);
            setShowWarningModal(true);
            return;
        }

        setSubmitting(true);
        const signatureData = sigRef.current?.toDataURL("image/png");

        const payload = {
            signature_base64: signatureData,
            accepted: agreed,
            signed_at: new Date().toISOString(),
            testimonial,
        };

        try {
            await api.post(`/invoices/${invoiceId}/acknowledge`, payload);
            window.location.href = "/customers";
        } catch (err: any) {
            console.error("Submit failed", err);
            const message = err.response?.data?.detail || "Failed to submit. Try again.";
            alert(message);
        } finally {
            setSubmitting(false);
        }
    };



    const handleClear = () => {
        sigRef.current?.clear();
        setSigned(false);
    };

    const handleUpdatePayment = async (updates: any) => {
        try {
            const res = await api.patch(`/invoices/${invoiceId}`, updates);
            setInvoice(res.data);
            setShowModal(false);
        } catch {
            alert("Failed to update payment info.");
        }
    };


    const handleEmail = async () => {
        try {
            await api.post(`/invoices/${invoiceId}/email`);
            alert("Invoice emailed successfully.");
            navigate("/customers");
        } catch {
            alert("Failed to send invoice.");
        }
    };

    if (!invoice) return <p className="p-4">Loading...</p>;

    const signatureData = signed ? sigRef.current?.toDataURL("image/png") : invoice.signature_base64;

    return (
        <div className="p-4 max-w-5xl mx-auto">
            <InvoicePreview
                invoice={invoice}
                signatureDataUrl={signatureData}
                signedAt={new Date().toLocaleString()}
                accepted={agreed}
                testimonial={testimonial}
            />

            {/* Terms + Testimonial UI */}
            <div className="mt-6">
                <label className="block font-semibold mb-2">Terms & Conditions</label>
                <div className="h-40 border rounded overflow-hidden">
                    <iframe
                        src="https://callitweb.com/zacharyfreed/terms.html"
                        title="Terms & Conditions"
                        className="w-full h-full"
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
            <div className="mt-6">
                <label className="block font-semibold mb-2">Testimonial Theme</label>
                <div className="flex flex-wrap gap-4 text-sm mb-2">
                    {["price", "timely", "cordial", "clean", "quality", "overall"].map((theme) => (
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
                <label className="block font-semibold mb-1">Testimonial</label>
                <textarea
                    rows={3}
                    className="w-full border rounded p-2 text-sm"
                    placeholder="Write your testimonial here or keep the suggested one..."
                    value={testimonial}
                    onChange={(e) => setTestimonial(e.target.value)}
                />
            </div>
            {/* Signature pad */}
            <div className="mt-4">
                <label className="block font-semibold mb-2">Signature</label>
                <SignatureCanvas
                    ref={sigRef}
                    penColor="black"
                    canvasProps={{ width: 600, height: 200, className: "border rounded" }}
                    onEnd={() => setSigned(true)}
                />
                <button onClick={handleClear} className="text-sm mt-2 text-blue-600">Clear</button>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-4">
                {!invoice.accepted && (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
                    >
                        {submitting ? "Submitting..." : "Email Invoice"}
                    </button>
                )}

                {invoice.accepted && (
                    <>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-yellow-500 text-white px-6 py-2 rounded"
                        >
                            Record Payment
                        </button>

                        <button
                            onClick={handleEmail}
                            className="bg-green-600 text-white px-6 py-2 rounded"
                        >
                            Email Invoice
                        </button>
                    </>
                )}
            </div>
            {agreed && signatureData && (
                <button
                    onClick={() => setShowPaymentModal(true)}
                    className="mt-4 bg-green-600 text-white px-6 py-2 rounded"
                >
                    Mark as Paid
                </button>
            )}

            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-lg font-semibold mb-4">Mark Invoice as Paid</h2>

                        <label className="block mb-2 font-medium">Status</label>
                        <select
                            className="border rounded w-full p-2 mb-4"
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                        >
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                        </select>

                        <label className="block mb-2 font-medium">Payment Type</label>
                        <select
                            className="border rounded w-full p-2 mb-4"
                            value={paymentType}
                            onChange={(e) => setPaymentType(e.target.value)}
                        >
                            <option value="">Select...</option>
                            <option value="cash">Cash</option>
                            <option value="check">Check</option>
                            <option value="zelle">Zelle</option>
                            <option value="credit_card">Credit Card</option>
                        </select>

                        <label className="block mb-2 font-medium">Notes (optional)</label>
                        <textarea
                            className="border rounded w-full p-2 mb-4"
                            rows={3}
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="text-gray-600 hover:text-black"
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded"
                                onClick={async () => {
                                    try {
                                        const res = await api.patch(`/invoices/${invoiceId}`, {
                                            status: paymentStatus,
                                            payment_type: paymentType,
                                            notes: paymentNotes,
                                        });
                                        setInvoice(res.data);
                                        setShowPaymentModal(false);
                                    } catch {
                                        alert("Failed to update invoice.");
                                    }
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modals */}
            {showWarningModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                        <h2 className="text-lg font-semibold mb-2">Proceed without full acknowledgment?</h2>
                        <p className="text-sm text-gray-700 mb-4">
                            The following are missing: <strong>{missingItems.join(" and ")}</strong>.
                            <br />Do you still want to email the invoice anyway?
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                                onClick={() => setShowWarningModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={() => {
                                    setShowWarningModal(false);
                                    setForceSubmit(true);
                                    handleSubmit();
                                }}
                            >
                                Send Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <PaymentModal
                    invoice={invoice}
                    onClose={() => setShowModal(false)}
                    onSubmit={handleUpdatePayment}
                />
            )}
        </div>
    );
}
