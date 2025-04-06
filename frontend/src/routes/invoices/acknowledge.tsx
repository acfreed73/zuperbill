// app/routes/invoices/acknowledge.tsx
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
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [missingItems, setMissingItems] = useState<string[]>([]);
    const [forceSubmit, setForceSubmit] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState("unpaid");
    const [paymentType, setPaymentType] = useState("");
    const [paymentNotes, setPaymentNotes] = useState("");
    const [cleared, setCleared] = useState(false);


    const navigate = useNavigate();
    useEffect(() => {
        if (invoice && invoice.signature_base64 && sigRef.current) {
            sigRef.current.fromDataURL(invoice.signature_base64);
        }
    }, [invoice]);

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
            .then(res => {
                const data = res.data;
                setInvoice(data);
                setAgreed(!!data.accepted);
                setSigned(!!data.signed_at);
                setTestimonial(data.testimonial || "");
                setPaymentStatus(data.status || "unpaid");
                setPaymentType(data.payment_type || "");
                setPaymentNotes(data.notes || "");
            })
            .catch(err => console.error("Failed to load invoice", err));
    }, [invoiceId]);

    const handleSubmit = async () => {
        const missing: string[] = [];
        const canvasEmpty = sigRef.current?.isEmpty();

        if (!agreed) missing.push("terms");
        if (canvasEmpty && !invoice?.signature_base64) {
            missing.push("signature");
        }
        // Prevent signature overwrite after acceptance
        if (invoice?.accepted && !sigRef.current?.isEmpty() && cleared) {
            alert("This invoice was already signed. You cannot change the original signature.");
            return;
        }
        if (missing.length > 0 && !forceSubmit) {
            setMissingItems(missing);
            setShowWarningModal(true);
            return;
        }

        setSubmitting(true);

        let signatureData: string | undefined = undefined;
        if (!canvasEmpty && !cleared) {
            signatureData = sigRef.current?.toDataURL("image/png");
        }

        const payload: any = {
            accepted: agreed,
            signed_at: new Date().toISOString(),
            testimonial,
        };

        if (signatureData) {
            payload.signature_base64 = signatureData;
        }

        try {
            await api.post(`/invoices/${invoiceId}/acknowledge`, payload);
            window.location.href = "/customers";
        } catch (err: any) {
            const message = err.response?.data?.detail || "Failed to submit. Try again.";
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

    const handleMarkPaid = async () => {
        try {
            await api.patch(`/invoices/${invoiceId}`, {
                status: paymentStatus,
                payment_type: paymentType,
                notes: paymentNotes,
            });
            alert("Invoice marked as paid.");
            navigate("/customers");
        } catch {
            alert("Failed to update invoice.");
        }
    };
    const handleEmail = async () => {
        const canvasEmpty = sigRef.current?.isEmpty();

        if (invoice?.accepted && !sigRef.current?.isEmpty() && cleared) {
        alert("This invoice was already signed. You cannot change the original signature.");
        navigate("/customers");
        return;
    }

        let signatureData: string | undefined = undefined;
        if (!canvasEmpty && !cleared) {
            signatureData = sigRef.current?.toDataURL("image/png");
        }

        const payload: any = {
            accepted: agreed,
            signed_at: new Date().toISOString(),
            testimonial,
        };

        if (signatureData) {
            payload.signature_base64 = signatureData;
        }

        try {
            await api.post(`/invoices/${invoiceId}/acknowledge`, payload);
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
                    <input type="checkbox" className="mr-2" checked={agreed} onChange={() => setAgreed(!agreed)} />
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
                    placeholder="Write your testimonial here or keep the suggested one..."
                    value={testimonial}
                    onChange={(e) => setTestimonial(e.target.value)}
                />
            </div>

            {/* Signature */}
            <div className="mt-4">
                <label className="block font-semibold mb-2">Signature</label>
                <SignatureCanvas
                    ref={sigRef}
                    penColor="black"
                    canvasProps={{ width: 600, height: 200, className: "border rounded", style: { maxWidth: "100%", height: "auto" } }}
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
                        className="bg-blue-600 text-white px-6 py-2 rounded"
                    >
                        {submitting ? "Submitting..." : "Email Invoice"}
                    </button>
                )}
                {invoice.accepted && (
                    <>
                        <button
                            onClick={handleEmail}
                            className="bg-green-600 text-white px-6 py-2 rounded"
                        >
                            Email Invoice
                        </button>
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="bg-yellow-600 text-white px-6 py-2 rounded"
                        >
                            Mark as Paid
                        </button>
                    </>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow max-w-md w-full">
                        <h2 className="text-lg font-bold mb-4">Mark Invoice as Paid</h2>
                        <label className="block font-medium mb-1">Status</label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="w-full border p-2 rounded mb-4"
                        >
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                        </select>

                        <label className="block font-medium mb-1">Payment Type</label>
                        <select
                            value={paymentType}
                            onChange={(e) => setPaymentType(e.target.value)}
                            className="w-full border p-2 rounded mb-4"
                        >
                            <option value="">Select...</option>
                            <option value="cash">Cash</option>
                            <option value="check">Check</option>
                            <option value="zelle">Zelle</option>
                            <option value="credit_card">Credit Card</option>
                        </select>

                        <label className="block font-medium mb-1">Notes</label>
                        <textarea
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                            className="w-full border p-2 rounded mb-4"
                            rows={3}
                        />

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="text-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMarkPaid}
                                className="bg-blue-600 text-white px-4 py-2 rounded"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Warning Modal */}
            {showWarningModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow max-w-md w-full">
                        <h2 className="text-lg font-semibold mb-2">Proceed without full acknowledgment?</h2>
                        <p className="text-sm text-gray-700 mb-4">
                            Missing: <strong>{missingItems.join(" and ")}</strong>.
                            <br />Do you still want to email the invoice?
                        </p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setShowWarningModal(false)}>Cancel</button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded"
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
        </div>
    );
}
